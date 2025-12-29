"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Bell, LogOut, LayoutDashboard, Plus, ArrowRight, Package } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming shadcn utility

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Hooks & Context
import { useAuth } from "@/lib/auth-context";
import { useCustomerParcels } from "@/lib/hooks/use-customer-parcels";
import type { ParcelSummary, ParcelStatus } from "@/lib/api-client";
import { NewShipmentDialog } from "@/components/customer/new-shipment-dialog";
import { useNotifications } from "@/lib/notifications-context";

const STATUS_CHIP: Record<ParcelStatus, { label: string; className: string }> = {
  BOOKED: {
    label: "Booked",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  ASSIGNED: {
    label: "Assigned",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  PICKED_UP: {
    label: "Picked up",
    className: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  },
  IN_TRANSIT: {
    label: "In Transit",
    className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
  DELIVERED: {
    label: "Delivered",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  FAILED: {
    label: "Issue",
    className: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
};

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const { parcels, loading, refresh } = useCustomerParcels({ limit: 30 });
  const { unreadCount } = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const filteredParcels = useMemo(
    () => filterParcels(parcels, searchQuery),
    [parcels, searchQuery]
  );

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setLogoutOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      {/* 1. STICKY HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Excel<span className="text-primary text-2xl">.</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/customer/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-destructive dark:border-slate-900" />
              )}
            </Link>

            <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-900/20"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="hidden font-medium sm:inline">Logout</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[400px] rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will need to sign in again to view your shipment history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmLogout}
                    disabled={loggingOut}
                    className="rounded-xl bg-rose-600 hover:bg-rose-700"
                  >
                    {loggingOut ? "Signing out..." : "Logout"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 sm:py-10">
        {/* 2. HERO SECTION */}
        <div className="relative mb-8 overflow-hidden rounded-[2rem] bg-slate-900 p-8 text-white sm:p-12 dark:bg-slate-900">
            <div className="relative z-10 max-w-2xl">
                <Badge className="mb-4 bg-primary/20 text-primary-foreground border-none hover:bg-primary/30">
                    Dashboard
                </Badge>
                <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                    Welcome, {user?.name?.split(" ")[0] ?? "Partner"}!
                </h1>
                <p className="mt-4 text-lg text-slate-400">
                    Your logistics at a glance. Track, manage, and scale your shipments with real-time updates.
                </p>
            </div>
            {/* Background Accent */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        </div>

        {/* 3. SEARCH & ACTIONS */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Search ID, address, or label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border-slate-200 bg-white pl-11 pr-4 ring-offset-transparent focus-visible:ring-primary/20 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>
          <div className="flex shrink-0">
             <NewShipmentDialog onCreated={refresh} />
          </div>
        </div>

        {/* 4. SHIPMENTS GRID */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Shipments</h2>
            <Badge variant="outline" className="rounded-full px-3 py-1 font-medium">
              {filteredParcels.length} total
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <ShipmentSkeletons />
            ) : filteredParcels.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-white/50 py-20 text-center dark:border-slate-800 dark:bg-slate-900/50">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold">No parcels found</h3>
                <p className="text-slate-500">Try adjusting your search query or create a new shipment.</p>
              </div>
            ) : (
              filteredParcels.map((parcel) => (
                <Card
                  key={parcel._id}
                  className="group relative overflow-hidden rounded-3xl border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <Badge className={cn("rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider border-none shadow-none", STATUS_CHIP[parcel.status].className)}>
                        {STATUS_CHIP[parcel.status].label}
                      </Badge>
                      <span className="font-mono text-xs font-bold text-slate-400">
                        #{parcel.trackingCode}
                      </span>
                    </div>

                    <div className="mb-6 space-y-2">
                      <h3 className="line-clamp-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                        {parcel.deliveryAddressId?.label ?? "Package Shipment"}
                      </h3>
                      <p className="line-clamp-2 min-h-[40px] text-sm text-slate-500 dark:text-slate-400">
                        {parcel.deliveryAddressId?.fullAddress ?? "No specific address provided"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-tighter text-slate-400 font-bold">Updated</span>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {formatDate(parcel.updatedAt)}
                        </span>
                      </div>
                      
                      <Button asChild variant="secondary" size="sm" className="rounded-xl group/btn">
                        <Link href={`/customer/tracking/${parcel.trackingCode}`}>
                          Details <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

// Optimized Helper Functions
function filterParcels(parcels: ParcelSummary[] = [], search: string) {
  if (!search) return parcels;
  const q = search.toLowerCase();
  return parcels.filter(
    (p) =>
      p.trackingCode.toLowerCase().includes(q) ||
      p.deliveryAddressId?.fullAddress?.toLowerCase().includes(q) ||
      p.deliveryAddressId?.label?.toLowerCase().includes(q)
  );
}

const formatDate = (value?: string) => {
  if (!value) return "Recently";
  const date = new Date(value);
  return isNaN(date.getTime())
    ? "Recently"
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

function ShipmentSkeletons() {
  return Array.from({ length: 6 }).map((_, i) => (
    <Card key={i} className="rounded-3xl border-slate-200 p-6 dark:border-slate-800">
      <div className="mb-4 flex justify-between">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="mb-2 h-7 w-3/4 rounded-lg" />
      <Skeleton className="mb-6 h-4 w-full rounded-lg" />
      <div className="flex items-center justify-between border-t pt-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </Card>
  ));
}