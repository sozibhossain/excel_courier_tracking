"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, AlertCircle } from "lucide-react"
import type { ParcelSummary, ParcelStatus } from "@/lib/api-client"

const statusBadge: Record<
  ParcelStatus,
  {
    label: string
    className: string
  }
> = {
  BOOKED: { label: "Booked", className: "bg-slate-200 text-slate-900 dark:bg-slate-900 dark:text-slate-100" },
  ASSIGNED: { label: "Assigned", className: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100" },
  PICKED_UP: { label: "Picked up", className: "bg-cyan-100 text-cyan-900 dark:bg-cyan-900 dark:text-cyan-100" },
  IN_TRANSIT: { label: "In transit", className: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100" },
  DELIVERED: {
    label: "Delivered",
    className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100",
  },
  FAILED: { label: "Issue", className: "bg-rose-100 text-rose-900 dark:bg-rose-900 dark:text-rose-100" },
  CANCELLED: { label: "Cancelled", className: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100" },
}

const formatWeight = (weight?: number) => (weight ? `${weight.toFixed(1)} kg` : "Weight TBD")
const formatCodAmount = (amount?: number) =>
  typeof amount === "number"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount)
    : "N/A"

interface ParcelCardProps {
  parcel: ParcelSummary
}

export function ParcelCard({ parcel }: ParcelCardProps) {
  const destination =
    parcel.deliveryAddressId?.fullAddress ?? parcel.deliveryAddressId?.city ?? "Awaiting destination details"
  const pickupCity = parcel.pickupAddressId?.city ?? parcel.pickupAddressId?.label ?? "Unknown pickup"
  const statusConfig = statusBadge[parcel.status]

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardContent className="space-y-3 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase text-muted-foreground">#{parcel.trackingCode}</p>
            <h3 className="truncate text-lg font-semibold text-foreground">
              {parcel.customerId?.name ?? "Assigned customer"}
            </h3>
            <p className="text-xs text-muted-foreground">{pickupCity}</p>
          </div>
          <Badge className={`${statusConfig.className} border-none`}>{statusConfig.label}</Badge>
        </div>

        {/* Destination */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-secondary" />
          <div className="space-y-0.5">
            <p className="text-foreground">{destination}</p>
            <p className="text-xs text-muted-foreground">
              {formatWeight(parcel.weight)} / COD {formatCodAmount(parcel.codAmount)}
            </p>
          </div>
        </div>

        {/* Customer contact */}
        {parcel.customerId?.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{parcel.customerId.email}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90">
            Mark Delivered
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <AlertCircle className="mr-1 h-4 w-4" />
            Report
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
