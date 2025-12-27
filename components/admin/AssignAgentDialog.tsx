"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import type { ParcelSummary, UserSummary } from "@/lib/api-client"
import { fetchAdminUsers, assignAgentToParcel } from "@/lib/api-client"

export function AssignAgentDialog({
  token,
  parcel,
  onAssigned,
}: {
  token: string
  parcel: ParcelSummary
  onAssigned?: (updated: ParcelSummary) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [assigning, setAssigning] = React.useState<string | null>(null)

  const [agents, setAgents] = React.useState<UserSummary[]>([])
  const [q, setQ] = React.useState("")

  // Load agents when dialog opens
  React.useEffect(() => {
    if (!open) return
    let mounted = true

    ;(async () => {
      try {
        setLoading(true)
        const res = await fetchAdminUsers(token, { role: "AGENT", limit: 200, page: 1 })
        if (mounted) setAgents(res.data ?? [])
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [open, token])

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return agents
    return agents.filter((agent) => {
      return (
        agent.name?.toLowerCase().includes(query) ||
        agent.email?.toLowerCase().includes(query)
      )
    })
  }, [agents, q])

  const handleAssign = async (agentId: string) => {
    try {
      setAssigning(agentId)
      const updated = await assignAgentToParcel(token, parcel._id, agentId)
      onAssigned?.(updated)
      setOpen(false)
    } finally {
      setAssigning(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {parcel.assignedAgentId?.name ? "Change" : "Assign"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign agent</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Search agent by name/email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <ScrollArea className="h-72 rounded-md border">
          <div className="p-2 space-y-2">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}

            {!loading && filtered.length === 0 && (
              <div className="p-6 text-sm text-muted-foreground text-center">No agents found</div>
            )}

            {!loading &&
              filtered.map((agent) => (
                <div
                  key={agent._id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <div className="text-sm font-medium">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">{agent.email}</div>
                  </div>

                  <Button
                    size="sm"
                    disabled={assigning !== null}
                    onClick={() => handleAssign(agent._id)}
                  >
                    {assigning === agent._id ? "Assigning..." : "Assign"}
                  </Button>
                </div>
              ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
