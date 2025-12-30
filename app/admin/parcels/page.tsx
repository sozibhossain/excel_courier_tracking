"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ParcelsTable } from "@/components/admin/parcels-table";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminParcels } from "@/lib/hooks/use-admin-parcels";
import type { ParcelStatus, ParcelSummary } from "@/lib/api-client";

const STATUS_FILTERS: Array<{ label: string; value: ParcelStatus | "ALL" }> = [
  { label: "All statuses", value: "ALL" },
  { label: "Booked", value: "BOOKED" },
  { label: "Assigned", value: "ASSIGNED" },
  { label: "Picked up", value: "PICKED_UP" },
  { label: "In transit", value: "IN_TRANSIT" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Exceptions", value: "FAILED" },
];

export default function AdminParcels() {
  const [token, setToken] = useState(""); // ✅ get admin token
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ParcelStatus | "ALL">("ALL");

  const { parcels, loading, setQuery } = useAdminParcels({ limit: 25 });

  // ✅ local list so we can update a single row after assigning agent
  const [localParcels, setLocalParcels] = useState<ParcelSummary[]>([]);

  useEffect(() => {
    console.log("Token changed:", token);
  }, [token]);

  useEffect(() => {
    try {
      const storedTokens = localStorage.getItem("tokens");
      if (!storedTokens) return;

      const parsed = JSON.parse(storedTokens) as { accessToken?: string };
      setToken(parsed.accessToken ?? "");
    } catch {
      setToken("");
    }
  }, []);

  useEffect(() => {
    setLocalParcels(parcels);
  }, [parcels]);

  useEffect(() => {
    setQuery((prev) => ({
      ...prev,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page: 1,
    }));
  }, [statusFilter, setQuery]);

  const filteredParcels = useMemo(() => {
    if (!search) return localParcels;
    const query = search.toLowerCase();

    return localParcels.filter((parcel) => {
      const trackingMatch = parcel.trackingCode?.toLowerCase().includes(query);
      const customerMatch = parcel.customerId?.name
        ?.toLowerCase()
        .includes(query);
      const destinationMatch = parcel.deliveryAddressId?.city
        ?.toLowerCase()
        .includes(query);
      return Boolean(trackingMatch || customerMatch || destinationMatch);
    });
  }, [localParcels, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Parcels Management
          </h1>
          <p className="text-muted-foreground">
            Live view of every shipment in the network.
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tracking code, customer, or city..."
            className="pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as ParcelStatus | "ALL")
          }
        >
          <SelectTrigger className="w-full lg:w-56">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Parcels Table */}
      <Card className="border-border/80 shadow-sm">
        <CardContent className="pt-6">
          <ParcelsTable
            parcels={filteredParcels}
            loading={loading}
            token={token}
            onParcelUpdated={(updated) => {
              setLocalParcels((prev) =>
                prev.map((p) => (p._id === updated._id ? updated : p))
              );
            }}
            onParcelDeleted={(deletedId) => {
              setLocalParcels((prev) =>
                prev.filter((p) => p._id !== deletedId)
              );
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
