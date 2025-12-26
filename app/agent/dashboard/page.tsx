"use client"

import { useMemo, useState } from "react"
import { ParcelCard } from "@/components/agent/parcel-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Maximize2 } from "lucide-react"
import { useAgentParcels } from "@/lib/hooks/use-agent-parcels"
import type { ParcelSummary } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"

const ACTIVE_STATUSES = ["BOOKED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"]

export default function AgentDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const { parcels, loading } = useAgentParcels({ limit: 50 })

  const { activeParcels, completedParcels } = useMemo(() => {
    const predicate = (parcel: ParcelSummary) =>
      ACTIVE_STATUSES.includes(parcel.status) ? "activeParcels" : "completedParcels"
    return parcels.reduce(
      (acc, parcel) => {
        acc[predicate(parcel)].push(parcel)
        return acc
      },
      { activeParcels: [] as ParcelSummary[], completedParcels: [] as ParcelSummary[] }
    )
  }, [parcels])

  const filteredActive = useMemo(() => filterParcels(activeParcels, searchQuery), [activeParcels, searchQuery])
  const filteredCompleted = useMemo(
    () => filterParcels(completedParcels, searchQuery),
    [completedParcels, searchQuery]
  )

  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <div className="sticky top-0 z-20 space-y-4 border-b border-border bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Agent Console</p>
            <h1 className="text-2xl font-bold text-foreground">My Parcels</h1>
            <p className="text-sm text-muted-foreground">{activeParcels.length} active assignments</p>
          </div>
          <Button size="sm" variant="outline">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tracking ID or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-10">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/60">
            <TabsTrigger value="active">
              Active
              <span className="ml-2 rounded-full bg-primary px-2 text-xs text-primary-foreground">
                {activeParcels.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed
              <span className="ml-2 rounded-full bg-muted-foreground px-2 text-xs text-background">
                {completedParcels.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 space-y-3">
            {loading && <LoadingList />}
            {!loading && filteredActive.length === 0 && (
              <EmptyState title="Nothing to deliver" description="No assignments match your filters right now." />
            )}
            {!loading && filteredActive.map((parcel) => <ParcelCard key={parcel._id} parcel={parcel} />)}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-3">
            {loading && <LoadingList />}
            {!loading && filteredCompleted.length === 0 && (
              <EmptyState title="No completed jobs" description="Deliveries you finish will land here." />
            )}
            {!loading && filteredCompleted.map((parcel) => <ParcelCard key={parcel._id} parcel={parcel} />)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function filterParcels(parcels: ParcelSummary[], search: string) {
  if (!search) return parcels
  const query = search.toLowerCase()
  return parcels.filter((parcel) => {
    const tracking = parcel.trackingCode.toLowerCase().includes(query)
    const destination = parcel.deliveryAddressId?.city?.toLowerCase().includes(query)
    return tracking || destination
  })
}

function LoadingList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-32 w-full rounded-2xl" />
      ))}
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/80 p-6 text-center">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
