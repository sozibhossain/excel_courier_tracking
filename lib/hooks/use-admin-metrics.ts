"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchAdminMetrics, type DashboardMetrics } from "@/lib/api-client"

export function useAdminMetrics() {
  const { tokens } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tokens?.accessToken) return

    const fetchMetrics = async () => {
      try {
        setLoading(true)
        const data = await fetchAdminMetrics(tokens.accessToken)
        setMetrics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [tokens?.accessToken])

  return { metrics, loading, error }
}
