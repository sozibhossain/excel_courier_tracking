"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, Bell, LogOut, LayoutDashboard } from "lucide-react"

// UI Components
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Hooks & Context
import { useAuth } from "@/lib/auth-context"
import { useCustomerParcels } from "@/lib/hooks/use-customer-parcels"
import type { ParcelSummary, ParcelStatus } from "@/lib/api-client"
import { NewShipmentDialog } from "@/components/customer/new-shipment-dialog"
import { useNotifications } from "@/lib/notifications-context"

const STATUS_CHIP: Record<ParcelStatus, { label: string; className: string }> = {
  BOOKED: { label: "Booked", className: "bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100" },
  ASSIGNED: { label: "Assigned", className: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100" },
  PICKED_UP: { label: "Picked up", className: "bg-cyan-100 text-cyan-900 dark:bg-cyan-900 dark:text-cyan-100" },
  IN_TRANSIT: { label: "In transit", className: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100" },
  DELIVERED: { label: "Delivered", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100" },
  FAILED: { label: "Issue", className: "bg-rose-100 text-rose-900 dark:bg-rose-900 dark:text-rose-100" },
  CANCELLED: { label: "Cancelled", className: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100" },
}

export default function CustomerDashboard() {
  const { user, logout } = useAuth()
  const { parcels, loading, refresh } = useCustomerParcels({ limit: 30 })
  const { unreadCount } = useNotifications()
  
  // State Management
  const [searchQuery, setSearchQuery] = useState("")
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const filteredParcels = useMemo(() => filterParcels(parcels, searchQuery), [parcels, searchQuery])

  const handleConfirmLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
      setLogoutOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background">
      {/* 1. STICKY HEADER */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <h1 className="text-lg font-bold tracking-tight">Excel Courier</h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/customer/notifications"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent hover:border-border hover:bg-muted"
                aria-label={`Notifications (${unreadCount})`}
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white ring-2 ring-background">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="group h-10 gap-2 rounded-xl px-2 sm:px-4 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all">
                    <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                    <span className="hidden sm:inline font-semibold">Logout</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign out?</AlertDialogTitle>
                    <AlertDialogDescription>You will need to log back in to manage your active parcels.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="rounded-xl" disabled={loggingOut}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmLogout} disabled={loggingOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                      {loggingOut ? "Signing out..." : "Sign Out"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* 2. HERO SECTION */}
        <section className="mb-10 rounded-3xl bg-white p-8 shadow-sm border border-border dark:bg-card">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Customer Portal</p>
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            Welcome back, <span className="text-primary">{user?.name?.split(' ')[0] ?? "Partner"}</span>
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Manage your logistics chain in real-time. Track packages, schedule pickups, and keep your customers updated with ease.
          </p>
        </section>

        {/* 3. CONTENT CONTROLS */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tracking ID or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-white dark:bg-card"
            />
          </div>
          <NewShipmentDialog onCreated={refresh} />
        </div>

        {/* 4. SHIPMENTS GRID */}
        <div className="space-y-4">
          <div className="flex items-end justify-between px-1">
            <h2 className="text-xl font-bold">My Shipments</h2>
            <p className="text-sm text-muted-foreground">{filteredParcels.length} total parcels</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <ShipmentSkeletons />
            ) : filteredParcels.length === 0 ? (
              <Card className="col-span-full border-dashed py-12 text-center">
                <p className="text-muted-foreground">No active shipments found matching your search.</p>
              </Card>
            ) : (
              filteredParcels.map((parcel) => (
                <Link key={parcel._id} href={`/customer/tracking/${parcel.trackingCode}`}>
                  <Card className="group h-full overflow-hidden transition-all hover:ring-2 hover:ring-primary/20 hover:shadow-md">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <Badge className={`${STATUS_CHIP[parcel.status].className} border-none shadow-none`}>
                          {STATUS_CHIP[parcel.status].label}
                        </Badge>
                        <span className="text-[10px] font-mono font-medium text-muted-foreground group-hover:text-primary transition-colors">
                          #{parcel.trackingCode}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-lg leading-tight line-clamp-1">
                          {parcel.deliveryAddressId?.label ?? "Standard Delivery"}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[40px]">
                          {parcel.deliveryAddressId?.fullAddress ?? "No address provided"}
                        </p>
                      </div>

                      <div className="pt-2 border-t flex justify-between items-center text-[11px] font-medium text-muted-foreground">
                        <span>Updated {formatDate(parcel.updatedAt)}</span>
                        <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">View Details →</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// Helper Functions & Components
function filterParcels(parcels: ParcelSummary[] = [], search: string) {
  if (!search) return parcels
  const query = search.toLowerCase()
  return parcels.filter((parcel) => 
    parcel.trackingCode.toLowerCase().includes(query) || 
    parcel.deliveryAddressId?.fullAddress?.toLowerCase().includes(query)
  )
}

const formatDate = (value?: string) => {
  if (!value) return "recently"
  const parsed = new Date(value)
  return isNaN(parsed.getTime()) ? "recently" : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ShipmentSkeletons() {
  return Array.from({ length: 6 }).map((_, i) => (
    <Card key={i} className="p-5 space-y-4">
      <div className="flex justify-between"><Skeleton className="h-5 w-20" /><Skeleton className="h-4 w-16" /></div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </Card>
  ))
}
