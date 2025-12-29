"use client"

import { useEffect, useRef } from "react"
import { SOCKET_BASE_URL } from "@/lib/env"
import { ensureSocketClient } from "@/lib/realtime/socket"
import { useAuth } from "@/lib/auth-context"
import type { ParcelStatus } from "@/lib/api-client"

export interface ParcelStatusEvent {
  parcelId: string
  trackingCode?: string
  status: ParcelStatus
  note?: string
  updatedAt?: string
  deliveredAt?: string
  failureReason?: string
}

interface Options {
  parcelId?: string
  enabled?: boolean
  onStatus?: (payload: ParcelStatusEvent) => void
  onTracking?: (payload: any) => void
  onNotification?: (payload: any) => void
}

export function useParcelRealtime({
  parcelId,
  enabled = true,
  onStatus,
  onTracking,
  onNotification,
}: Options) {
  const { user } = useAuth()
  const normalizedUserId = (user as any)?._id ?? user?.id
  const statusHandler = useRef<Options["onStatus"]>(onStatus)
  const trackingHandler = useRef(onTracking)
  const notificationHandler = useRef(onNotification)

  useEffect(() => {
    statusHandler.current = onStatus
  }, [onStatus])

  useEffect(() => {
    trackingHandler.current = onTracking
  }, [onTracking])

  useEffect(() => {
    notificationHandler.current = onNotification
  }, [onNotification])

  useEffect(() => {
    if (!enabled) return undefined
    if (!parcelId && !normalizedUserId) return undefined

    let socket: any
    let cancelled = false

    const joinRooms = () => {
      if (!socket) return
      if (parcelId) socket.emit("join:parcel", parcelId)
      if (normalizedUserId) {
        socket.emit("join:user", normalizedUserId)
        if (user?.role === "CUSTOMER") socket.emit("join:customer", normalizedUserId)
        if (user?.role === "AGENT") socket.emit("join:agent", normalizedUserId)
      }
    }

    const connect = async () => {
      const ioClient = await ensureSocketClient(SOCKET_BASE_URL)
      if (!ioClient || cancelled) return

      socket = ioClient(SOCKET_BASE_URL, { transports: ["websocket"] })
      socket.on("connect", joinRooms)
      joinRooms()

      socket.on("parcel:status", (payload: ParcelStatusEvent) => statusHandler.current?.(payload))
      socket.on("parcel:tracking", (payload: any) => trackingHandler.current?.(payload))
      socket.on("notification:user", (payload: any) => notificationHandler.current?.(payload))
    }

    connect()

    return () => {
      cancelled = true
      if (socket) {
        socket.off("parcel:status")
        socket.off("parcel:tracking")
        socket.off("notification:user")
        socket.off("connect", joinRooms)
        socket.disconnect()
      }
    }
  }, [parcelId, enabled, normalizedUserId, user?.role])
}
