"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { ParcelSummary, ParcelStatus } from "@/lib/api-client"

const statusStyles: Record<
  ParcelStatus,
  {
    label: string
    className: string
  }
> = {
  BOOKED: { label: "Booked", className: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200" },
  ASSIGNED: { label: "Assigned", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" },
  PICKED_UP: { label: "Picked Up", className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100" },
  IN_TRANSIT: { label: "In Transit", className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100" },
  DELIVERED: { label: "Delivered", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100" },
  FAILED: { label: "Issue", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" },
  CANCELLED: { label: "Cancelled", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100" },
}

const formatDate = (date?: string) => {
  if (!date) return "—"
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return "—"
  return parsed.toLocaleDateString()
}

export function ParcelsTable({
  parcels,
  loading,
  emptyLabel = "No parcels found",
}: {
  parcels: ParcelSummary[]
  loading?: boolean
  emptyLabel?: string
}) {
  const showEmptyState = !loading && parcels.length === 0

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-[160px]">Tracking</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading &&
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
              </TableRow>
            ))}

          {showEmptyState && (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                {emptyLabel}
              </TableCell>
            </TableRow>
          )}

          {!loading &&
            parcels.map((parcel) => {
              const statusConfig = statusStyles[parcel.status]
              const origin = parcel.pickupAddressId?.city ?? parcel.pickupAddressId?.label
              const destination = parcel.deliveryAddressId?.city ?? parcel.deliveryAddressId?.label
              return (
                <TableRow key={parcel._id} className="hover:bg-muted/40">
                  <TableCell className="font-mono text-xs sm:text-sm text-foreground">{parcel.trackingCode}</TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{parcel.customerId?.name ?? "—"}</div>
                    <p className="text-xs text-muted-foreground">{parcel.customerId?.email}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {origin ?? "Unassigned"} - {destination ?? "Unassigned"}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusConfig.className} border-none`}>
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {parcel.assignedAgentId?.name ?? (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(parcel.createdAt)}</TableCell>
                </TableRow>
              )
            })}
        </TableBody>
      </Table>
    </div>
  )
}
