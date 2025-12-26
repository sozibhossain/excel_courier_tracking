"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { Search } from "lucide-react"
import { useCustomerParcels } from "@/lib/hooks/use-customer-parcels"
import type { ParcelSummary, ParcelStatus } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { NewShipmentDialog } from "@/components/customer/new-shipment-dialog"

const STATUS_CHIP: Record<
  ParcelStatus,
  {
    label: string
    className: string
  }
> = {
  BOOKED: { label: "Booked", className: "bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100" },
  ASSIGNED: { label: "Assigned", className: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100" },
  PICKED_UP: { label: "Picked up", className: "bg-cyan-100 text-cyan-900 dark:bg-cyan-900 dark:text-cyan-100" },
  IN_TRANSIT: {
    label: "In transit",
    className: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100",
  },
  DELIVERED: {
    label: "Delivered",
    className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100",
  },
  FAILED: { label: "Issue", className: "bg-rose-100 text-rose-900 dark:bg-rose-900 dark:text-rose-100" },
  CANCELLED: { label: "Cancelled", className: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100" },
}

export default function CustomerDashboard() {
  const { user, logout } = useAuth()
  const { parcels, loading, refresh } = useCustomerParcels({ limit: 30 })
  const [searchQuery, setSearchQuery] = useState("")

  const filteredParcels = useMemo(() => filterParcels(parcels, searchQuery), [parcels, searchQuery])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-4xl p-6">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Customer Portal</p>
          <h1 className="text-3xl font-bold text-foreground">Welcome Back excel courier tracking {user?.name ?? "there"}</h1>
          <p className="text-muted-foreground">Track packages, schedule pickups, and keep recipients updated.</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4">
        {/* Quick Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tracking ID or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>

        {/* Shipments Grid */}
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">My Shipments</h2>
              <p className="text-sm text-muted-foreground">Live data synced from the logistics API.</p>
            </div>
            <NewShipmentDialog onCreated={refresh} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {loading && <ShipmentSkeletons />}
            {!loading && filteredParcels.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No shipments match your filters yet.
                </CardContent>
              </Card>
            )}
            {!loading &&
              filteredParcels.map((parcel) => (
                <Link key={parcel._id} href={`/customer/tracking/${parcel.trackingCode}`}>
                  <Card className="h-full cursor-pointer transition-all hover:shadow-lg">
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-mono uppercase text-muted-foreground">#{parcel.trackingCode}</p>
                          <p className="text-lg font-semibold">{parcel.deliveryAddressId?.label ?? "Delivery address"}</p>
                        </div>
                        <Badge className={`${STATUS_CHIP[parcel.status].className} border-none`}>
                          {STATUS_CHIP[parcel.status].label}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{parcel.deliveryAddressId?.fullAddress ?? "Awaiting address details"}</p>
                        <p>Updated {formatDate(parcel.updatedAt)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function filterParcels(parcels: ParcelSummary[], search: string) {
  if (!search) return parcels
  const query = search.toLowerCase()
  return parcels.filter((parcel) => {
    const tracking = parcel.trackingCode.toLowerCase().includes(query)
    const destination = parcel.deliveryAddressId?.fullAddress?.toLowerCase().includes(query)
    return tracking || destination
  })
}

const formatDate = (value?: string) => {
  if (!value) return "recently"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "recently"
  return parsed.toLocaleDateString()
}

function ShipmentSkeletons() {
  return (
    <>
      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={`shipment-skeleton-${index}`}>
          <CardContent className="space-y-4 p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </>
  )
}
