"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LogOut, Edit2 } from "lucide-react"

export default function AgentProfile() {
  const { user, logout } = useAuth()

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">View and edit your information</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase text-muted-foreground font-semibold">Name</label>
              <Input defaultValue={user?.name} readOnly className="mt-1" />
            </div>

            <div>
              <label className="text-xs uppercase text-muted-foreground font-semibold">Email</label>
              <Input defaultValue={user?.email} readOnly className="mt-1" />
            </div>

            <div>
              <label className="text-xs uppercase text-muted-foreground font-semibold">Phone</label>
              <Input defaultValue={user?.phone || "Not provided"} readOnly className="mt-1" />
            </div>

            <div>
              <label className="text-xs uppercase text-muted-foreground font-semibold">Role</label>
              <div className="mt-1">
                <Badge className="bg-secondary text-secondary-foreground">{user?.role}</Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1 bg-transparent">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={logout}
              variant="outline"
              className="flex-1 text-destructive hover:bg-destructive/10 bg-transparent"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
