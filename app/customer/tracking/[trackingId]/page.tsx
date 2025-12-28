"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, QrCode, RefreshCw, Share2, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { ShipmentStatus } from "@/components/customer/shipment-status"
import { TrackingTimeline, type TrackingEvent } from "@/components/customer/tracking-timeline"
import { ParcelRouteMap } from "@/components/customer/parcel-route-map"
import { useParcelTracking } from "@/lib/hooks/use-parcel-tracking"
import { useParcelRealtime } from "@/lib/hooks/use-parcel-realtime"
import { API_ORIGIN } from "@/lib/env"
import type { ParcelStatus, ParcelStatusHistoryEntry, TrackingPoint, ParcelSummary } from "@/lib/api-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

export default function TrackingPage() {
  const params = useParams()
  const trackingId = params.trackingId as string
  const { tracking, loading, error, refresh } = useParcelTracking(trackingId)
  const [statusHistory, setStatusHistory] = useState<ParcelStatusHistoryEntry[]>([])
  const [trackingPoints, setTrackingPoints] = useState<TrackingPoint[]>([])

  const { tokens } = useAuth()
  const { toast } = useToast()

  // ✅ QR modal state
  const [qrOpen, setQrOpen] = useState(false)
  const [qrObjectUrl, setQrObjectUrl] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)

  useEffect(() => {
    setStatusHistory(tracking?.history ?? [])
    setTrackingPoints(tracking?.tracking.history ?? [])
  }, [tracking])

  useParcelRealtime({
    parcelId: tracking?.parcel._id,
    enabled: !!tracking?.parcel._id,
    onStatus: (payload) => {
      if (!payload?.status) return
      setStatusHistory((prev) => [
        {
          _id: `live-${Date.now()}`,
          status: payload.status,
          note: payload.note,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
    },
    onTracking: (point) => {
      if (typeof point?.lat !== "number" || typeof point?.lng !== "number") return
      setTrackingPoints((prev) => [point, ...prev].slice(0, 50))
    },
  })

  const timelineEvents = useMemo(
    () => buildTimeline(statusHistory, tracking?.parcel?.status),
    [statusHistory, tracking?.parcel?.status]
  )

  const routePoints = useMemo(
    () => buildRoutePoints(tracking?.parcel, trackingPoints),
    [tracking?.parcel, trackingPoints]
  )

  const parcel = tracking?.parcel
  const shareDisabled = typeof navigator === "undefined"

  const qrcodeUrl = parcel ? `${API_ORIGIN}/api/v1/parcels/${parcel._id}/qrcode` : "#"

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

  const revokeQrUrl = () => {
    if (qrObjectUrl) URL.revokeObjectURL(qrObjectUrl)
    setQrObjectUrl(null)
  }

  // ✅ fetch QR with token, create blob URL, show in modal
  const openQrModal = async () => {
    if (!parcel) return
    const token = ensureToken()
    if (!token) return

    setQrOpen(true)
    setQrError(null)
    revokeQrUrl()
    setQrLoading(true)

    try {
      const res = await fetch(qrcodeUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error(`QR request failed (${res.status})`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setQrObjectUrl(url)
    } catch (e) {
      setQrError(e instanceof Error ? e.message : "Unable to load QR code")
    } finally {
      setQrLoading(false)
    }
  }

  // cleanup on close/unmount
  useEffect(() => {
    if (!qrOpen) {
      revokeQrUrl()
      setQrError(null)
      setQrLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrOpen])

  useEffect(() => {
    return () => {
      revokeQrUrl()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto p-6">
          <Link href="/customer/dashboard">
            <Button variant="ghost" className="mb-4 text-primary hover:bg-primary/10 hover:text-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shipments
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Package Tracking</h1>
          <p className="text-muted-foreground">Live status and courier location.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-6 pb-10">
        {loading && <TrackingSkeleton />}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && parcel && (
          <>
            <ShipmentStatus
              trackingId={parcel.trackingCode}
              status={mapShipmentStatus(parcel.status)}
              sender={{
                name: parcel.pickupAddressId?.label ?? "Pickup",
                location: parcel.pickupAddressId?.fullAddress ?? "Not available",
              }}
              recipient={{
                name: parcel.deliveryAddressId?.label ?? "Recipient",
                location: parcel.deliveryAddressId?.fullAddress ?? "Not available",
              }}
              weight={formatWeight(parcel.weight)}
              estimatedDelivery={formatDate(parcel.deliveredAt || parcel.scheduledPickupAt)}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                className="flex items-center justify-center gap-2"
                onClick={() => handleShare(trackingId)}
                disabled={shareDisabled}
              >
                <Share2 className="w-4 h-4" />
                Share Tracking
              </Button>

              {/* ✅ Open modal, fetch QR with token */}
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2"
                onClick={openQrModal}
              >
                <QrCode className="w-4 h-4" />
                QR Code
              </Button>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Parcel details</CardTitle>
                  <p className="text-sm text-muted-foreground">Payment & delivery preferences</p>
                </div>
                <Button variant="ghost" size="icon" onClick={refresh} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  <span className="sr-only">Refresh</span>
                </Button>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <DetailRow label="Tracking code" value={parcel.trackingCode} />
                <DetailRow label="Payment type" value={formatText(parcel.paymentType)} />
                {parcel.paymentType === "COD" && (
                  <DetailRow label="COD amount" value={formatCurrency(parcel.codAmount)} />
                )}
                <DetailRow label="Last update" value={formatDate(parcel.updatedAt)} />
                {parcel.failureReason && <DetailRow label="Failure reason" value={parcel.failureReason} />}
              </CardContent>
            </Card>

            <ParcelRouteMap points={routePoints} />

            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Delivery timeline</h2>
                  <p className="text-sm text-muted-foreground">Status history in chronological order.</p>
                </div>
                {timelineEvents.length > 0 ? (
                  <TrackingTimeline events={timelineEvents} />
                ) : (
                  <p className="text-sm text-muted-foreground">No status updates yet.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ✅ QR CODE MODAL */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md z-50">
          <DialogHeader>
            <DialogTitle>Parcel QR code</DialogTitle>
            <DialogDescription>Show this QR code to the delivery agent.</DialogDescription>
          </DialogHeader>

          {qrLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading QR...
            </div>
          )}

          {!qrLoading && qrError && (
            <Alert variant="destructive">
              <AlertDescription>{qrError}</AlertDescription>
            </Alert>
          )}

          {!qrLoading && !qrError && qrObjectUrl && (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-lg border bg-white p-4">
                <img
                  src={qrObjectUrl}
                  alt="Parcel QR Code"
                  className="h-64 w-64 object-contain"
                />
              </div>

              <div className="flex w-full justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={openQrModal}
                  disabled={qrLoading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value ?? DASH}</p>
    </div>
  )
}

function TrackingSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </CardContent>
    </Card>
  )
}

const STATUS_ORDER: ParcelStatus[] = [
  "BOOKED",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
]

const STATUS_LABELS: Record<ParcelStatus, string> = {
  BOOKED: "Booked",
  ASSIGNED: "Agent Assigned",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
}

const DASH = "\u2014"

const mapShipmentStatus = (status?: ParcelStatus) => {
  switch (status) {
    case "PICKED_UP":
      return "picked-up"
    case "IN_TRANSIT":
      return "in-transit"
    case "DELIVERED":
      return "delivered"
    default:
      return "pending"
  }
}

const formatDate = (value?: string | Date | null) => {
  if (!value) return DASH
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? DASH : date.toLocaleString()
}

const formatWeight = (value?: number) => (typeof value === "number" ? `${value.toFixed(1)} kg` : DASH)

const formatCurrency = (value?: number) => {
  if (typeof value !== "number") return DASH
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "code",
    maximumFractionDigits: 2,
  }).format(value)
}

const formatText = (value?: string | null) => (value && value.trim().length ? value : DASH)

const areSameCoords = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
  Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6

const toAddressPoint = (address?: ParcelSummary["pickupAddressId"] | null) => {
  if (typeof address?.lat !== "number" || typeof address?.lng !== "number") return null
  return { lat: address.lat, lng: address.lng }
}

const buildRoutePoints = (parcel?: ParcelSummary | null, points: TrackingPoint[] = []) => {
  const chronological = toChronologicalPoints(points)
  const route: Array<{ lat: number; lng: number; createdAt?: string }> = []
  const pickup = toAddressPoint(parcel?.pickupAddressId)
  const delivery = toAddressPoint(parcel?.deliveryAddressId)

  if (pickup) route.push(pickup)

  chronological.forEach((point) => {
    const previous = route[route.length - 1]
    if (!previous || !areSameCoords(previous, point)) {
      route.push({ lat: point.lat, lng: point.lng, createdAt: point.createdAt })
    }
  })

  if (delivery) {
    const last = route[route.length - 1]
    if (!last || !areSameCoords(last, delivery)) route.push(delivery)
  }

  return route
}

const buildTimeline = (history: ParcelStatusHistoryEntry[], currentStatus?: ParcelStatus): TrackingEvent[] => {
  const currentIndex = currentStatus ? STATUS_ORDER.indexOf(currentStatus) : -1
  const chronological = [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  return chronological.map((entry) => {
    const entryIndex = STATUS_ORDER.indexOf(entry.status)
    return {
      status: STATUS_LABELS[entry.status as ParcelStatus] ?? entry.status,
      location: entry.note ?? "Status update",
      timestamp: formatDate(entry.createdAt),
      description: entry.note ?? `Parcel marked as ${STATUS_LABELS[entry.status as ParcelStatus] ?? entry.status}.`,
      completed: entryIndex === -1 ? false : entryIndex <= currentIndex,
    }
  })
}

const toChronologicalPoints = (points: TrackingPoint[]) =>
  [...points]
    .filter((point) => typeof point.lat === "number" && typeof point.lng === "number")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((point) => ({ lat: point.lat, lng: point.lng, createdAt: point.createdAt }))

const handleShare = async (trackingCode: string) => {
  const shareUrl = typeof window !== "undefined" ? window.location.href : ""
  try {
    if (navigator.share) {
      await navigator.share({ url: shareUrl, title: "Track my parcel", text: `Tracking code ${trackingCode}` })
      return
    }
    await navigator.clipboard.writeText(shareUrl)
  } catch (error) {
    console.error("Share action failed", error)
  }
}
