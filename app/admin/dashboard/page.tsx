"use client"

import { MetricsGrid } from "@/components/admin/metrics-grid"
import { ParcelsTable } from "@/components/admin/parcels-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminMetrics } from "@/lib/hooks/use-admin-metrics"
import { useAdminParcels } from "@/lib/hooks/use-admin-parcels"

export default function AdminDashboard() {
  const { metrics, loading: metricsLoading } = useAdminMetrics()
  const { parcels, loading: parcelsLoading } = useAdminParcels({ limit: 5 })

  

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-3xl border border-border/80 bg-white p-6">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground max-w-2xl">
          Unified visibility across bookings, agents, and customer deliveries. Monitor exceptions and act quickly.
        </p>
      </div>

      {/* Metrics */}
      <MetricsGrid metrics={metrics} loading={metricsLoading} />

      {/* Recent Parcels */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Parcels</CardTitle>
          <CardDescription>Latest delivery shipments in the system</CardDescription>
        </CardHeader>

        <CardContent>
          <ParcelsTable
            parcels={parcels}
            loading={parcelsLoading}
            emptyLabel="No parcels found"
          />
        </CardContent>
      </Card>
    </div>
  )
}
