"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  fetchCustomerParcels,
  type ParcelSummary,
  type PaginationMeta,
  type ParcelStatus,
} from "@/lib/api-client"
import { useParcelRealtime, type ParcelStatusEvent } from "@/lib/hooks/use-parcel-realtime"

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

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), [])

  useParcelRealtime({
    enabled: true,
    onStatus: (payload?: ParcelStatusEvent) => {
      if (!payload?.parcelId || !payload.status) return

      let matchFound = false
      setParcels((prev) => {
        const next = prev.map((parcel) => {
          const matches =
            parcel._id === payload.parcelId ||
            (!!payload.trackingCode && parcel.trackingCode === payload.trackingCode)

          if (!matches) return parcel
          matchFound = true

          const deliveredAt =
            payload.status === "DELIVERED"
              ? payload.deliveredAt ?? new Date().toISOString()
              : payload.deliveredAt ?? parcel.deliveredAt
          const failureReason =
            payload.status === "FAILED"
              ? payload.failureReason ?? payload.note ?? parcel.failureReason
              : undefined

          return {
            ...parcel,
            status: payload.status,
            updatedAt: payload.updatedAt ?? parcel.updatedAt,
            deliveredAt,
            failureReason,
          }
        })

        return matchFound ? next : prev
      })

      if (!matchFound) {
        refresh()
      }
    },
  })

  return { parcels, loading, error, meta, setQuery, refresh }
}
