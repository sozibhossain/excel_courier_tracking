"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  CheckCheck, 
  Inbox, 
  Bell, 
  ArrowRight, 
  ChevronLeft 
} from "lucide-react"

// UI Components (Shadcn/UI)
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Data & Context
import { useNotifications } from "@/lib/notifications-context"
import type { NotificationItem } from "@/lib/api-client"

/**
 * Formats ISO date strings into a readable format for the console.
 */
const formatTimestamp = (value?: string) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

interface NotificationCenterProps {
  heading?: string
  description?: string
}

export function NotificationCenter({
  heading,
  description,
}: NotificationCenterProps) {
  const router = useRouter()
  const { notifications, unreadCount, loading, markNotification, markAll } = useNotifications()
  
  // Local state for UI feedback during async actions
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)

  const handleMarkAll = async () => {
    if (!unreadCount || markingAll) return
    setMarkingAll(true)
    try {
      await markAll()
    } finally {
      setMarkingAll(false)
    }
  }

  const handleMark = async (notificationId: string) => {
    if (markingId) return
    setMarkingId(notificationId)
    try {
      await markNotification(notificationId)
    } finally {
      setMarkingId(null)
    }
  }

  const renderNotification = (notification: NotificationItem) => {
    const hasTracking = typeof notification.data?.trackingCode === "string"
    
    return (
      <div
        key={notification._id}
        className={cn(
          "group relative flex flex-col gap-4 p-5 transition-all hover:bg-muted/30 sm:flex-row sm:items-start sm:justify-between",
          !notification.isRead && "bg-primary/5 dark:bg-primary/10"
        )}
      >
        {/* Unread Accent Line */}
        {!notification.isRead && (
          <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
        )}

        <div className="flex flex-1 gap-4">
          {/* Icon Container */}
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm transition-colors",
            notification.isRead ? "bg-background" : "bg-primary/10 border-primary/20 text-primary"
          )}>
            <Bell className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={cn(
                "font-bold leading-tight transition-colors",
                notification.isRead ? "text-foreground/80" : "text-foreground"
              )}>
                {notification.title}
              </p>
              <Badge 
                variant="outline" 
                className="rounded-lg bg-background px-1.5 py-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                {notification.type.replace(/_/g, " ")}
              </Badge>
            </div>
            
            {notification.body && (
              <p className="text-sm leading-relaxed text-muted-foreground max-w-xl">
                {notification.body}
              </p>
            )}

            {hasTracking && (
              <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-primary">
                <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono">
                  {notification.data?.trackingCode as string}
                </span>
                <ArrowRight className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wide">View Shipment</span>
              </div>
            )}
          </div>
        </div>

        {/* Timestamp & Actions */}
        <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:flex-col sm:items-end sm:justify-start">
          <p className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">
            {formatTimestamp(notification.createdAt)}
          </p>
          
          {!notification.isRead && (
            <Button
              size="sm"
              variant="secondary"
              className="h-8 rounded-lg px-3 text-xs font-bold shadow-sm hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={() => handleMark(notification._id)}
              disabled={markingId === notification._id || markingAll}
            >
              {markingId === notification._id ? "..." : "Mark as read"}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className=" space-y-6 py-6 px-4">
      {/* Navigation & Header Section */}
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="-ml-2 h-8 gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <div className="h-1 w-8 rounded-full bg-primary" />
              <span className="text-xs font-bold uppercase tracking-widest">Notification Center</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              {heading ?? "Notifications"}
            </h1>
            <p className="text-muted-foreground">
              {description ?? "Stay up to date with real-time updates across your account."}
            </p>
          </div>
          
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-xl border-2 font-bold transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-sm"
            onClick={handleMarkAll}
            disabled={!unreadCount || markingAll}
          >
            <CheckCheck className="h-4 w-4" />
            {markingAll ? "Processing..." : `Clear All (${unreadCount})`}
          </Button>
        </div>
      </div>

      {/* List Container */}
      <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-xl shadow-slate-200/50 dark:bg-card dark:shadow-none">
        {loading ? (
          <NotificationSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-border/50">
            {notifications.map((notification) => renderNotification(notification))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Loading state skeleton
 */
function NotificationSkeleton() {
  return (
    <div className="divide-y divide-border/50">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex gap-4 p-5 animate-pulse">
          <div className="h-10 w-10 rounded-xl bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-1/4 rounded bg-muted" />
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Empty state display
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-300 dark:bg-muted dark:text-muted-foreground">
        <Inbox className="h-10 w-10" />
      </div>
      <div className="max-w-[280px] space-y-1">
        <p className="text-lg font-bold text-foreground">All caught up!</p>
        <p className="text-sm text-muted-foreground">
          Your inbox is empty. We&apos;ll notify you when something important happens.
        </p>
      </div>
    </div>
  )
}