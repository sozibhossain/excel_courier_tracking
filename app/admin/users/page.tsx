"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Search, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdminUsers } from "@/lib/hooks/use-admin-users"
import type { User } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"

const ROLE_FILTERS: Array<{ label: string; value: User["role"] | "ALL" }> = [
  { label: "All roles", value: "ALL" },
  { label: "Admins", value: "ADMIN" },
  { label: "Agents", value: "AGENT" },
  { label: "Customers", value: "CUSTOMER" },
]

const ROLE_OPTIONS: User["role"][] = ["ADMIN", "AGENT", "CUSTOMER"]

export default function AdminUsers() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<User["role"] | "ALL">("ALL")
  const { users, loading, setQuery } = useAdminUsers({ limit: 25 })

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      role: roleFilter === "ALL" ? undefined : roleFilter,
      page: 1,
    }))
  }, [roleFilter, setQuery])

  const filteredUsers = useMemo(() => {
    if (!search) return users
    const query = search.toLowerCase()
    return users.filter((user) => {
      const nameMatch = user.name?.toLowerCase().includes(query)
      const emailMatch = user.email?.toLowerCase().includes(query)
      return nameMatch || emailMatch
    })
  }, [users, search])

  const handleRoleChange = async (userId: string, role: User["role"]) => {
    // TODO: call API to update role
    console.log("update role:", userId, role)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Control roles, activation, and account health.</p>
        </div>
        <Button variant="outline" className="border-dashed">
          Invite User
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email"
            className="pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as User["role"] | "ALL")}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Filter role" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_FILTERS.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card className="border-border/80 shadow-sm">
        <CardContent className="pt-6">
          <div className="overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Update role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading &&
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`user-skeleton-${index}`}>
                      <TableCell>
                        <Skeleton className="h-4 w-36" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-9 w-40 rounded-md" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-8 w-8 rounded-full" />
                      </TableCell>
                    </TableRow>
                  ))}

                {!loading && filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No users match your filters.
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-semibold">
                        <div>{user.name}</div>
                        <p className="text-xs text-muted-foreground">Joined recently</p>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {user.role}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user._id, value as User["role"])}
                        >
                          <SelectTrigger className="h-9 w-40">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={`${
                            user.isActive ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          } border-none`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
