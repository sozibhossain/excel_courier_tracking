"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function RoleBasedRedirect() {
  const router = useRouter()
  const { user, isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Route based on role
    if (user?.role === "ADMIN") {
      router.push("/admin/dashboard")
    } else if (user?.role === "AGENT") {
      router.push("/agent/dashboard")
    } else if (user?.role === "CUSTOMER") {
      router.push("/customer/dashboard")
    }
  }, [user, isAuthenticated, loading, router])

  return null
}
