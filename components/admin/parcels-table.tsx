"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { ParcelSummary, ParcelStatus } from "@/lib/api-client"
import { AssignAgentDialog } from "./AssignAgentDialog"
import { Button } from "@/components/ui/button"
import { Eye, Trash2 } from "lucide-react"
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
import { deleteAdminParcel } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"

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
  if (!date) return "N/A"
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return "N/A"
  return parsed.toLocaleDateString()
}

const formatAmount = (value?: number) => {
  if (typeof value !== "number") return "N/A"
  return new Intl.NumberFormat().format(value)
}

export function ParcelsTable({
  parcels,
  loading,
  emptyLabel = "No parcels found",
  token,
  onParcelUpdated,
  onParcelDeleted,
}: {
  parcels: ParcelSummary[]
  loading?: boolean
  emptyLabel?: string
  token?: string
  onParcelUpdated?: (updated: ParcelSummary) => void
  onParcelDeleted?: (deletedId: string) => void
}) {
  const showEmptyState = !loading && parcels.length === 0
  const [selectedParcel, setSelectedParcel] = useState<ParcelSummary | null>(null)
  const [parcelToDelete, setParcelToDelete] = useState<ParcelSummary | null>(null)
  const [deletingParcel, setDeletingParcel] = useState(false)
  const { toast } = useToast()

  console.log("TTTTTTTTTTTTTTTTTT", token)

  const handleDeleteParcel = async () => {
    if (!parcelToDelete || !token) return
    const target = parcelToDelete
    try {
      setDeletingParcel(true)
      await deleteAdminParcel(token, target._id)
      onParcelDeleted?.(target._id)
      toast({ title: "Parcel removed", description: `${target.trackingCode} has been deleted.` })
    } catch (error) {
      console.error(error)
      toast({
        title: "Failed to delete parcel",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingParcel(false)
      setParcelToDelete(null)
    }
  }

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-[160px]">Tracking</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Assign agent</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
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
                  <Skeleton className="h-8 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}

          {showEmptyState && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                {emptyLabel}
              </TableCell>
            </TableRow>
          )}

          {!loading &&
            parcels.map((parcel) => {
              const statusConfig = statusStyles[parcel.status]
              const origin = parcel.pickupAddressId?.city ?? parcel.pickupAddressId?.label ?? "Unassigned"
              const destination = parcel.deliveryAddressId?.city ?? parcel.deliveryAddressId?.label ?? "Unassigned"

              return (
                <TableRow key={parcel._id} className="hover:bg-muted/40">
                  <TableCell className="font-mono text-xs text-foreground sm:text-sm">{parcel.trackingCode}</TableCell>

                  <TableCell className="text-sm">
                    <div className="font-medium">{parcel.customerId?.name ?? "Unknown"}</div>
                    <p className="text-xs text-muted-foreground">{parcel.customerId?.email ?? "No email"}</p>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {origin} - {destination}
                  </TableCell>

                  <TableCell>
                    <Badge className={`${statusConfig.className} border-none`}>{statusConfig.label}</Badge>
                  </TableCell>

                  <TableCell className="text-sm">
                    {parcel.assignedAgentId?.name ?? <span className="text-muted-foreground">Unassigned</span>}
                  </TableCell>

                  <TableCell className="text-sm">
                    {token ? (
                      <AssignAgentDialog token={token} parcel={parcel} onAssigned={(u) => onParcelUpdated?.(u)} />
                    ) : (
                      <span className="text-xs text-muted-foreground">Auth required</span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">{formatDate(parcel.createdAt)}</TableCell>

                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedParcel(parcel)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={!token}
                        onClick={() => setParcelToDelete(parcel)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
        </TableBody>
      </Table>

      <Dialog open={Boolean(selectedParcel)} onOpenChange={(open) => !open && setSelectedParcel(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Parcel details</DialogTitle>
          </DialogHeader>

          {selectedParcel && (
            <div className="space-y-6 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Tracking code</p>
                  <p className="font-mono text-base">{selectedParcel.trackingCode}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Status</p>
                  <Badge className={`${statusStyles[selectedParcel.status].className} border-none`}>
                    {statusStyles[selectedParcel.status].label}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedParcel.customerId?.name ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{selectedParcel.customerId?.email ?? "No email"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Agent</p>
                  <p className="font-medium">{selectedParcel.assignedAgentId?.name ?? "Unassigned"}</p>
                  <p className="text-xs text-muted-foreground">{selectedParcel.assignedAgentId?.email ?? ""}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase text-muted-foreground">Pickup address</p>
                  <p className="font-medium">{selectedParcel.pickupAddressId?.label ?? "Pending assignment"}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedParcel.pickupAddressId?.fullAddress ?? selectedParcel.pickupAddressId?.city ?? ""}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase text-muted-foreground">Delivery address</p>
                  <p className="font-medium">{selectedParcel.deliveryAddressId?.label ?? "Pending assignment"}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedParcel.deliveryAddressId?.fullAddress ?? selectedParcel.deliveryAddressId?.city ?? ""}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">COD amount</p>
                  <p className="font-semibold">{formatAmount(selectedParcel.codAmount)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Weight</p>
                  <p className="font-semibold">
                    {typeof selectedParcel.weight === "number" ? `${selectedParcel.weight} kg` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Payment type</p>
                  <p className="font-semibold">{selectedParcel.paymentType ?? "N/A"}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(selectedParcel.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Updated</p>
                  <p className="font-medium">{formatDate(selectedParcel.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(parcelToDelete)}
        onOpenChange={(open) => !open && !deletingParcel && setParcelToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this parcel?</AlertDialogTitle>
            <AlertDialogDescription>
              {parcelToDelete
                ? `This will permanently delete shipment ${parcelToDelete.trackingCode}. Choose Yes to continue or No to keep it.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingParcel}>No</AlertDialogCancel>
            <AlertDialogAction disabled={deletingParcel || !token} onClick={handleDeleteParcel}>
              {deletingParcel ? "Deleting..." : "Yes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
