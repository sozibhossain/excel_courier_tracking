"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, TrendingUp, Clock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { DashboardMetrics } from "@/lib/api-client"

interface MetricCardProps {
  title: string
  description: string
  icon: React.ReactNode
  value?: string
  loading?: boolean
}

function MetricCard({ title, description, icon, value, loading }: MetricCardProps) {
  return (
    <Card className="h-full border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <p className="text-xs text-muted-foreground/80">{description}</p>
        </div>
        <div className="text-primary/60">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-3xl font-semibold tracking-tight text-foreground">{value ?? "—"}</div>
        )}
      </CardContent>
    </Card>
  )
}

type MetricKey = keyof DashboardMetrics

const METRIC_CONFIG: Array<{
  key: MetricKey
  title: string
  description: string
  icon: React.ReactNode
  formatter: (value: number) => string
}> = [
  {
    key: "dailyBookings",
    title: "Bookings (24h)",
    description: "Confirmed in the last day",
    icon: <Package className="w-5 h-5" />,
    formatter: (value: number) => value.toLocaleString(),
  },
  {
    key: "deliveredTotal" as const,
    title: "Delivered Parcels",
    description: "Completed deliveries all time",
    icon: <TrendingUp className="w-5 h-5" />,
    formatter: (value: number) => value.toLocaleString(),
  },
  {
    key: "failedDeliveries" as const,
    title: "Exceptions",
    description: "Failed / cancelled jobs",
    icon: <Clock className="w-5 h-5" />,
    formatter: (value: number) => value.toLocaleString(),
  },
  {
    key: "codTotal" as const,
    title: "COD Collected",
    description: "Cash on delivery volume",
    icon: <Users className="w-5 h-5" />,
    formatter: (value: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value),
  },
]

export function MetricsGrid({ metrics, loading }: { metrics?: DashboardMetrics | null; loading?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {METRIC_CONFIG.map((config) => (
        <MetricCard
          key={config.key}
          title={config.title}
          description={config.description}
          icon={config.icon}
          loading={loading}
          value={metrics ? config.formatter(metrics[config.key] ?? 0) : undefined}
        />
      ))}
    </div>
  )
}
