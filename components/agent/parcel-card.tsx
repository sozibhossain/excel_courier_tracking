"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPin, Phone, Navigation, ScanLine, CheckCircle2, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import {
  updateAgentParcelStatus,
  recordAgentParcelTracking,
  verifyAgentParcelScan,
  type ParcelSummary,
  type ParcelStatus,
} from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"

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

const statusLabels: Record<ParcelStatus, string> = {
  BOOKED: "Booked",
  ASSIGNED: "Agent Assigned",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
}

const transitions: Record<ParcelStatus, ParcelStatus[]> = {
  BOOKED: ["ASSIGNED"],
  ASSIGNED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED"],
  IN_TRANSIT: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  FAILED: ["ASSIGNED", "CANCELLED"],
  CANCELLED: [],
}

interface ParcelCardProps {
  parcel: ParcelSummary
  onActionComplete?: () => void
}

export function ParcelCard({ parcel, onActionComplete }: ParcelCardProps) {
  const destination =
    parcel.deliveryAddressId?.fullAddress ?? parcel.deliveryAddressId?.city ?? "Awaiting destination details"
  const pickupCity = parcel.pickupAddressId?.city ?? parcel.pickupAddressId?.label ?? "Unknown pickup"
  const statusConfig = statusBadge[parcel.status]
  const { tokens } = useAuth()
  const { toast } = useToast()

  const availableTransitions = useMemo(() => transitions[parcel.status] ?? [], [parcel.status])
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<ParcelStatus | "">("")
  const [statusNote, setStatusNote] = useState("")
  const [statusSubmitting, setStatusSubmitting] = useState(false)

  const [geoAvailable, setGeoAvailable] = useState(false)
  const [trackingSubmitting, setTrackingSubmitting] = useState(false)

  const [scanOpen, setScanOpen] = useState(false)
  const [scanCode, setScanCode] = useState(parcel.trackingCode ?? "")
  const [scanSubmitting, setScanSubmitting] = useState(false)

  useEffect(() => {
    setGeoAvailable(typeof window !== "undefined" && "geolocation" in navigator)
  }, [])

  useEffect(() => {
    setSelectedStatus(availableTransitions[0] ?? "")
  }, [availableTransitions])

  useEffect(() => {
    if (!statusDialogOpen) setStatusNote("")
  }, [statusDialogOpen])

  useEffect(() => {
    if (!scanOpen) setScanCode(parcel.trackingCode ?? "")
  }, [scanOpen, parcel.trackingCode])

  const requireNote = selectedStatus === "FAILED"

  const ensureToken = () => {
    if (!tokens?.accessToken) {
      toast({
        title: "Authentication required",
        description: "Please sign in again to continue.",
        variant: "destructive",
      })
      return null
    }
    return tokens.accessToken
  }

  const handleStatusSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedStatus) return
    const token = ensureToken()
    if (!token) return

    try {
      setStatusSubmitting(true)
      await updateAgentParcelStatus(token, parcel._id, {
        status: selectedStatus,
        note: statusNote.trim() || undefined,
      })
      toast({
        title: statusLabels[selectedStatus],
        description: `Parcel ${parcel.trackingCode} marked as ${statusLabels[selectedStatus]}.`,
      })
      onActionComplete?.()
      setStatusDialogOpen(false)
    } catch (error) {
      toast({
        title: "Unable to update status",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setStatusSubmitting(false)
    }
  }

  const getCurrentPosition = () =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not available"))
        return
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000,
      })
    })

  const handleTrackingUpdate = async () => {
    const token = ensureToken()
    if (!token || !geoAvailable) return
    try {
      setTrackingSubmitting(true)
      const position = await getCurrentPosition()
      await recordAgentParcelTracking(token, parcel._id, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        speed: position.coords.speed ?? undefined,
        heading: position.coords.heading ?? undefined,
      })
      toast({
        title: "Location shared",
        description: `Live point dropped for ${parcel.trackingCode}.`,
      })
      onActionComplete?.()
    } catch (error) {
      toast({
        title: "Unable to send location",
        description: error instanceof Error ? error.message : "Location request failed",
        variant: "destructive",
      })
    } finally {
      setTrackingSubmitting(false)
    }
  }

  const handleScanSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const token = ensureToken()
    if (!token || !scanCode.trim()) return
    try {
      setScanSubmitting(true)
      await verifyAgentParcelScan(token, { parcelId: parcel._id, code: scanCode.trim() })
      toast({
        title: "Scan verified",
        description: `Code matches parcel ${parcel.trackingCode}.`,
      })
      setScanOpen(false)
    } catch (error) {
      toast({
        title: "Scan failed",
        description: error instanceof Error ? error.message : "Unable to verify code",
        variant: "destructive",
      })
    } finally {
      setScanSubmitting(false)
    }
  }

  return (
    <>
      <Card className="transition-all hover:shadow-lg">
        <CardContent className="space-y-3 p-4">
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

          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-secondary" />
            <div className="space-y-0.5">
              <p className="text-foreground">{destination}</p>
              <p className="text-xs text-muted-foreground">
                {formatWeight(parcel.weight)} / COD {formatCodAmount(parcel.codAmount)}
              </p>
            </div>
          </div>

          {parcel.customerId?.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{parcel.customerId.email}</span>
            </div>
          )}

          <div className="grid gap-2 pt-1 sm:grid-cols-3">
            <Button
              size="sm"
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={() => setStatusDialogOpen(true)}
              disabled={availableTransitions.length === 0}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Update Status
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={handleTrackingUpdate}
              disabled={!geoAvailable || trackingSubmitting}
            >
              {trackingSubmitting ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="mr-1 h-4 w-4" />
              )}
              {trackingSubmitting ? "Sharing..." : "Drop Pin"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setScanOpen(true)}
            >
              <ScanLine className="mr-1 h-4 w-4" />
              Scan Parcel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update status</DialogTitle>
            <DialogDescription>Select the next milestone for this parcel.</DialogDescription>
          </DialogHeader>
          {availableTransitions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No further transitions are available for this parcel.</p>
          ) : (
            <form className="space-y-4" onSubmit={handleStatusSubmit}>
              <div className="space-y-2">
                <Label htmlFor={`status-${parcel._id}`}>Next status</Label>
                <Select value={selectedStatus} onValueChange={(value: ParcelStatus) => setSelectedStatus(value)}>
                  <SelectTrigger id={`status-${parcel._id}`}>
                    <SelectValue placeholder="Choose status" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTransitions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`status-note-${parcel._id}`}>
                  Note {requireNote && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                  id={`status-note-${parcel._id}`}
                  placeholder="Optional notes for the customer"
                  value={statusNote}
                  onChange={(event) => setStatusNote(event.target.value)}
                  required={requireNote}
                />
                {requireNote && <p className="text-xs text-muted-foreground">Explain the issue for failed deliveries.</p>}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setStatusDialogOpen(false)} disabled={statusSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedStatus || (requireNote && !statusNote.trim()) || statusSubmitting}
                >
                  {statusSubmitting ? "Updating..." : "Save"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan parcel</DialogTitle>
            <DialogDescription>Enter or paste the code from the parcel label.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleScanSubmit}>
            <div className="space-y-2">
              <Label htmlFor={`scan-${parcel._id}`}>Tracking / QR value</Label>
              <Input
                id={`scan-${parcel._id}`}
                value={scanCode}
                onChange={(event) => setScanCode(event.target.value)}
                placeholder="PKL-12345"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setScanOpen(false)} disabled={scanSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={!scanCode.trim() || scanSubmitting}>
                {scanSubmitting ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
