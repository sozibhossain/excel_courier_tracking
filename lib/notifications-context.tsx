"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import {
  fetchNotifications,
  markAllNotifications as apiMarkAllNotifications,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { ensureSocketClient } from "@/lib/realtime/socket"
import { SOCKET_BASE_URL } from "@/lib/env"

interface NotificationsContextValue {
  notifications: NotificationItem[]
  unreadCount: number
  loading: boolean
  ready: boolean
  refresh: () => Promise<void>
  markNotification: (notificationId: string) => Promise<NotificationItem | null>
  markAll: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

const MAX_NOTIFICATIONS = 100

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { tokens, user } = useAuth()
  const accessToken = tokens?.accessToken
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const socketRef = useRef<any>(null)

  const loadNotifications = useCallback(async () => {
    if (!accessToken) {
      setNotifications([])
      setUnreadCount(0)
      setReady(true)
      return
    }
    setLoading(true)
    try {
      const { data, meta } = await fetchNotifications(accessToken, { limit: 50 })
      setNotifications(data)
      setUnreadCount(meta?.unreadCount ?? data.filter((item) => !item.isRead).length)
    } catch (error) {
      console.error("Failed to load notifications", error)
    } finally {
      setLoading(false)
      setReady(true)
    }
  }, [accessToken])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (!accessToken || !user) {
      if (socketRef.current) {
        socketRef.current.off("notification:user")
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    const userId = (user as any)?._id ?? user?.id
    if (!userId) return

    let cancelled = false
    let socketInstance: any = null

    const handlePayload = (payload: any) => {
      const incoming: NotificationItem | undefined = payload?.notification ?? payload
      if (!incoming?._id) return
      setNotifications((prev) => {
        const filtered = prev.filter((item) => item._id !== incoming._id)
        return [incoming, ...filtered].slice(0, MAX_NOTIFICATIONS)
      })
      if (typeof payload?.unreadCount === "number") {
        setUnreadCount(payload.unreadCount)
      }
    }

    const joinRooms = () => {
      if (!socketInstance) return
      socketInstance.emit("join:user", userId)
      if (user.role === "CUSTOMER") socketInstance.emit("join:customer", userId)
      if (user.role === "AGENT") socketInstance.emit("join:agent", userId)
    }

    const connect = async () => {
      const ioClient = await ensureSocketClient(SOCKET_BASE_URL)
      if (!ioClient || cancelled) return
      socketInstance = ioClient(SOCKET_BASE_URL, { transports: ["websocket"] })
      socketRef.current = socketInstance
      socketInstance.on("connect", joinRooms)
      joinRooms()
      socketInstance.on("notification:user", handlePayload)
    }

    connect()

    return () => {
      cancelled = true
      if (socketInstance) {
        socketInstance.off("notification:user", handlePayload)
        socketInstance.off("connect", joinRooms)
        socketInstance.disconnect()
      }
      if (socketRef.current === socketInstance) {
        socketRef.current = null
      }
    }
  }, [accessToken, user])

  const refresh = useCallback(async () => {
    await loadNotifications()
  }, [loadNotifications])

  const markNotification = useCallback(
    async (notificationId: string) => {
      if (!accessToken) return null
      try {
        const result = await markNotificationRead(accessToken, notificationId)
        if (!result.data) return null
        setNotifications((prev) => prev.map((item) => (item._id === result.data!._id ? result.data! : item)))
        if (typeof result.meta?.unreadCount === "number") {
          setUnreadCount(result.meta.unreadCount)
        }
        return result.data
      } catch (error) {
        console.error("Failed to mark notification", error)
        return null
      }
    },
    [accessToken]
  )

  const markAll = useCallback(async () => {
    if (!accessToken) return
    try {
      const meta = await apiMarkAllNotifications(accessToken)
      setNotifications((prev) =>
        prev.map((item) =>
          item.isRead
            ? item
            : {
                ...item,
                isRead: true,
                readAt: item.readAt ?? new Date().toISOString(),
              }
        )
      )
      if (typeof meta?.unreadCount === "number") {
        setUnreadCount(meta.unreadCount)
      } else {
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Failed to mark notifications", error)
    }
  }, [accessToken])

  const value: NotificationsContextValue = {
    notifications,
    unreadCount,
    loading,
    ready,
    refresh,
    markNotification,
    markAll,
  }

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider")
  }
  return context
}
