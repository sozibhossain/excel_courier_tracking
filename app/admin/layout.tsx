"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/lib/auth-context"
import { AdminSidebar } from "@/components/admin/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { Bell, UserCircle } from "lucide-react"

function AdminHeader() {
  const notificationCount = 5

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 border-b bg-background">
      <div className="h-full px-4 lg:px-8 flex items-center justify-between">
        <div className="font-semibold">Admin Panel</div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted"
            aria-label={`Notifications (${notificationCount})`}
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] leading-[18px] text-center">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border hover:bg-muted"
            aria-label="Profile"
          >
            <UserCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user?.role !== "ADMIN") router.push("/login")
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (user?.role !== "ADMIN") return null

  return (
    <div className="min-h-screen">
      <AdminHeader />
      <AdminSidebar />

      {/* Content: header height + sidebar width offset */}
      <main className="pt-16 lg:pl-64">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
