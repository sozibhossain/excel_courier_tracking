"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { AdminSidebar } from "@/components/admin/sidebar"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Spinner } from "@/components/ui/spinner"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user?.role !== "ADMIN") {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (user?.role !== "ADMIN") {
    return null
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
