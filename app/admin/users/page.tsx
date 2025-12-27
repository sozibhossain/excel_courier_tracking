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
import type { User, UserSummary } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/auth-context"
import { deleteAdminUser, updateAdminUser } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"

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
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserSummary | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [localUsers, setLocalUsers] = useState<UserSummary[]>([])
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const { tokens } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      role: roleFilter === "ALL" ? undefined : roleFilter,
      page: 1,
    }))
  }, [roleFilter, setQuery])

  useEffect(() => {
    setLocalUsers(users)
  }, [users])

  useEffect(() => {
    if (!selectedUser) return
    const match = localUsers.find((user) => user._id === selectedUser._id)
    if (match && match !== selectedUser) {
      setSelectedUser(match)
    }
  }, [localUsers, selectedUser])

  useEffect(() => {
    if (!userToDelete) return
    const match = localUsers.find((user) => user._id === userToDelete._id)
    if (match && match !== userToDelete) {
      setUserToDelete(match)
    }
  }, [localUsers, userToDelete])

  const filteredUsers = useMemo(() => {
    if (!search) return localUsers
    const query = search.toLowerCase()
    return localUsers.filter((user) => {
      const nameMatch = user.name?.toLowerCase().includes(query)
      const emailMatch = user.email?.toLowerCase().includes(query)
      return nameMatch || emailMatch
    })
  }, [localUsers, search])

  const handleRoleChange = async (userId: string, role: User["role"]) => {
    if (!tokens?.accessToken) {
      toast({ title: "Authentication required", description: "Please login again to manage users.", variant: "destructive" })
      return
    }
    try {
      setUpdatingUserId(userId)
      const updated = await updateAdminUser(tokens.accessToken, userId, { role })
      setLocalUsers((prev) =>
        prev.map((user) => (user._id === userId ? { ...user, role: updated.role, isActive: updated.isActive } : user))
      )
      setQuery((prev) => ({ ...prev }))
      toast({ title: "Role updated", description: `${updated.name || "User"} is now ${updated.role}.` })
    } catch (error) {
      console.error(error)
      toast({ title: "Failed to update role", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" })
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete || !tokens?.accessToken) return
    try {
      setDeleting(true)
      await deleteAdminUser(tokens.accessToken, userToDelete._id)
      setLocalUsers((prev) => prev.filter((user) => user._id !== userToDelete._id))
      setQuery((prev) => ({ ...prev }))
      toast({ title: "User removed", description: `${userToDelete.name ?? "Account"} has been deleted.` })
    } catch (error) {
      console.error(error)
      toast({
        title: "Failed to delete user",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setUserToDelete(null)
    }
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
                          disabled={updatingUserId === user._id || !tokens?.accessToken}
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedUser(user)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={!tokens?.accessToken}
                          onClick={() => setUserToDelete(user)}
                        >
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

      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Name</p>
                <p className="font-semibold">{selectedUser.name || "Unknown"}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Email</p>
                  <p className="font-medium break-all">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Role</p>
                  <Badge variant="outline" className="font-mono">
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Status</p>
                  <span
                    className={`text-sm font-medium ${
                      selectedUser.isActive ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {selectedUser.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">User ID</p>
                  <p className="font-mono text-xs">{selectedUser._id}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(userToDelete)} onOpenChange={(open) => !open && !deleting && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete
                ? `This will remove ${userToDelete.name ?? "this user"} from the system. Choose Yes to continue or No to keep the account.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={deleting || !tokens?.accessToken}>
              {deleting ? "Deleting..." : "Yes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
