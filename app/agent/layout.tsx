"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { AgentBottomNav } from "@/components/agent/bottom-nav"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Spinner } from "@/components/ui/spinner"

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user?.role !== "AGENT") {
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

  if (user?.role !== "AGENT") {
    return null
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <main>{children}</main>
      <AgentBottomNav />
    </div>
  )
}
