"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, QrCode, RefreshCw, Share2 } from "lucide-react"
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
import type { ParcelStatus, ParcelStatusHistoryEntry, TrackingPoint } from "@/lib/api-client"

export default function TrackingPage() {
  const params = useParams()
  const trackingId = params.trackingId as string
  const { tracking, loading, error, refresh } = useParcelTracking(trackingId)
  const [statusHistory, setStatusHistory] = useState(tracking?.history ?? [])
  const [trackingPoints, setTrackingPoints] = useState(tracking?.tracking.history ?? [])

  useEffect(() => {
    if (tracking) {
      setStatusHistory(tracking.history ?? [])
      setTrackingPoints(tracking.tracking.history ?? [])
    }
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
      if (!point?.lat || !point?.lng) return
      setTrackingPoints((prev) => [point, ...prev].slice(0, 50))
    },
  })

  const timelineEvents = useMemo(() => buildTimeline(statusHistory, tracking?.parcel.status), [
    statusHistory,
    tracking?.parcel.status,
  ])

  const mapPoints = useMemo(() => toChronologicalPoints(trackingPoints), [trackingPoints])

  const parcel = tracking?.parcel
  const shareDisabled = typeof window === "undefined"
  const qrcodeUrl = parcel ? `${API_ORIGIN}/api/v1/parcels/${parcel._id}/qrcode` : "#"

  return (
    <div className="space-y-6">
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto p-6">
          <Link href="/customer/dashboard">
            <Button variant="ghost" className="mb-4 text-primary hover:bg-primary/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shipments
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Package Tracking</h1>
          <p className="text-muted-foreground">Live status and courier location.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
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
              weight={parcel.weight ? `${parcel.weight} kg` : "—"}
              estimatedDelivery={formatDate(parcel.deliveredAt || parcel.scheduledPickupAt)}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Button className="flex items-center justify-center gap-2" onClick={() => handleShare(trackingId)} disabled={shareDisabled}>
                <Share2 className="w-4 h-4" />
                Share Tracking
              </Button>
              <Button variant="outline" className="flex items-center justify-center gap-2" asChild>
                <Link href={qrcodeUrl} target="_blank" rel="noreferrer">
                  <QrCode className="w-4 h-4" />
                  QR Code
                </Link>
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
                <DetailRow label="Payment type" value={parcel.paymentType ?? "—"} />
                {parcel.paymentType === "COD" && <DetailRow label="COD amount" value={`৳ ${parcel.codAmount?.toFixed(2) || "0.00"}`} />}
                <DetailRow label="Last update" value={formatDate(parcel.updatedAt)} />
                {parcel.failureReason && <DetailRow label="Failure reason" value={parcel.failureReason} />}
              </CardContent>
            </Card>

            <ParcelRouteMap points={mapPoints} />

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
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value ?? "—"}</p>
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
  if (!value) return "—"
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString()
}

const buildTimeline = (history: ParcelStatusHistoryEntry[], currentStatus?: ParcelStatus): TrackingEvent[] => {
  const currentIndex = currentStatus ? STATUS_ORDER.indexOf(currentStatus) : -1
  const chronological = [...history].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

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
