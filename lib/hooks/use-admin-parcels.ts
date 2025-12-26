"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchAdminParcels, type ParcelSummary, type PaginationMeta, type ParcelStatus } from "@/lib/api-client"

export interface AdminParcelQuery {
  page?: number
  limit?: number
  status?: ParcelStatus
  agentId?: string
  customerId?: string
  dateFrom?: string
  dateTo?: string
}

export function useAdminParcels(initialQuery?: AdminParcelQuery) {
  const { tokens } = useAuth()
  const [parcels, setParcels] = useState<ParcelSummary[]>([])
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<AdminParcelQuery>(initialQuery ?? {})

  useEffect(() => {
    if (!tokens?.accessToken) return

    const fetchParcels = async () => {
      try {
        setLoading(true)
        const { data, meta: pagination } = await fetchAdminParcels(tokens.accessToken, query)
        setParcels(data)
        setMeta(pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchParcels()
  }, [tokens?.accessToken, JSON.stringify(query)])

  return { parcels, meta, loading, error, setQuery }
}
