"use client"

import type { ReactNode } from "react"
import { AuthProvider } from "@/lib/auth-context"
import { NotificationsProvider } from "@/lib/notifications-context"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotificationsProvider>{children}</NotificationsProvider>
    </AuthProvider>
  )
}
