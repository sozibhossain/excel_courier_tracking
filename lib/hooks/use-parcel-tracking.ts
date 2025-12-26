"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchParcelTrackingByCode, type ParcelTrackingResponse } from "@/lib/api-client"

export function useParcelTracking(trackingCode: string) {
  const { tokens } = useAuth()
  const [tracking, setTracking] = useState<ParcelTrackingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!tokens?.accessToken || !trackingCode) return
    let cancelled = false

    const fetchTracking = async () => {
      try {
        setLoading(true)
        const payload = await fetchParcelTrackingByCode(tokens.accessToken, trackingCode)
        if (!cancelled) {
          setTracking(payload)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load tracking data")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchTracking()
    return () => {
      cancelled = true
    }
  }, [tokens?.accessToken, trackingCode, refreshKey])

  const refresh = () => setRefreshKey((key) => key + 1)

  return { tracking, loading, error, refresh }
}
