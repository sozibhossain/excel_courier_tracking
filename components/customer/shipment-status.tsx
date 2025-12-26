"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Weight } from "lucide-react"

interface ShipmentStatusProps {
  trackingId: string
  status: string
  sender: {
    name: string
    location: string
  }
  recipient: {
    name: string
    location: string
  }
  weight: string
  estimatedDelivery: string
}

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100", label: "Pending" },
  "picked-up": { color: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100", label: "Picked Up" },
  "in-transit": { color: "bg-cyan-100 text-cyan-900 dark:bg-cyan-900 dark:text-cyan-100", label: "In Transit" },
  "out-for-delivery": {
    color: "bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100",
    label: "Out for Delivery",
  },
  delivered: { color: "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100", label: "Delivered" },
}

export function ShipmentStatus({
  trackingId,
  status,
  sender,
  recipient,
  weight,
  estimatedDelivery,
}: ShipmentStatusProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Tracking #{trackingId}</CardTitle>
            <CardDescription>Real-time shipment status</CardDescription>
          </div>
          <Badge className={config.color}>{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Route */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">From</p>
              <p className="font-medium text-foreground">{sender.name}</p>
              <p className="text-sm text-muted-foreground">{sender.location}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <MapPin className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">To</p>
              <p className="font-medium text-foreground">{recipient.name}</p>
              <p className="text-sm text-muted-foreground">{recipient.location}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <div className="flex gap-2">
            <Weight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Weight</p>
              <p className="text-sm font-medium text-foreground">{weight}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Est. Delivery</p>
              <p className="text-sm font-medium text-foreground">{estimatedDelivery}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
