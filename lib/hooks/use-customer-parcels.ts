"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  fetchCustomerParcels,
  type ParcelSummary,
  type PaginationMeta,
  type ParcelStatus,
} from "@/lib/api-client"

export function useCustomerParcels(initialQuery?: {
  status?: ParcelStatus
  page?: number
  limit?: number
  dateFrom?: string
  dateTo?: string
}) {
  const { tokens } = useAuth()
  const [parcels, setParcels] = useState<ParcelSummary[]>([])
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState(initialQuery ?? {})
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!tokens?.accessToken) return

    const fetchParcels = async () => {
      try {
        setLoading(true)
        const { data, meta: pagination } = await fetchCustomerParcels(tokens.accessToken, query)
        setParcels(data)
        setMeta(pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchParcels()
  }, [tokens?.accessToken, JSON.stringify(query), refreshKey])

  const refresh = () => setRefreshKey((key) => key + 1)

  return { parcels, loading, error, meta, setQuery, refresh }
}
