"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchAdminUsers, type PaginationMeta, type UserSummary, type User } from "@/lib/api-client"

interface UserQuery {
  page?: number
  limit?: number
  role?: User["role"]
}

export function useAdminUsers(initialQuery?: UserQuery) {
  const { tokens } = useAuth()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<UserQuery>(initialQuery ?? {})

  useEffect(() => {
    if (!tokens?.accessToken) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const { data, meta: pagination } = await fetchAdminUsers(tokens.accessToken, query)
        setUsers(data)
        setMeta(pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tokens?.accessToken, JSON.stringify(query)])

  return { users, meta, loading, error, setQuery }
}
