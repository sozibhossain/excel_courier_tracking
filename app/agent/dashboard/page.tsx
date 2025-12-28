"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ParcelCard } from "@/components/agent/parcel-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  LogOut,
  X,
  Package,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  Bell,
  Truck,
  PackageCheck,
} from "lucide-react";
import { useAgentParcels } from "@/lib/hooks/use-agent-parcels";
import type { ParcelSummary } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
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
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateAgentLiveLocation } from "@/lib/api-client";

// Constants
const ACTIVE_STATUSES: ParcelSummary["status"][] = ["BOOKED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"];
const COMPLETED_STATUSES: ParcelSummary["status"][] = ["DELIVERED"];
const REVIEW_STATUSES: ParcelSummary["status"][] = ["FAILED", "CANCELLED"];

type LocationState = "idle" | "watching" | "denied" | "error" | "unsupported";

const LOCATION_COLORS: Record<LocationState, string> = {
  idle: "bg-amber-400",
  watching: "bg-emerald-500",
  denied: "bg-rose-500",
  error: "bg-amber-500",
  unsupported: "bg-slate-400",
};

export default function AgentDashboard() {
  const router = useRouter();
  const { logout, tokens } = useAuth();
  const { unreadCount } = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const { parcels, loading, error: parcelError, refresh } = useAgentParcels({ limit: 50 });
  const [locationStatus, setLocationStatus] = useState<LocationState>("idle");
  const [locationMessage, setLocationMessage] = useState<string>("Waiting for GPS...");

  // GPS Sync Logic (Kept your logic, cleaned up variables)
  useEffect(() => {
    const token = tokens?.accessToken;
    if (!token || typeof window === "undefined" || !("geolocation" in navigator)) return;

    let cancelled = false;
    let watchId: number | null = null;
    let lastCoords: { lat: number; lng: number } | null = null;

    const transmit = (lat: number, lng: number) => {
      lastCoords = { lat, lng };
      updateAgentLiveLocation(token, { lat, lng })
        .then(() => {
          if (!cancelled) {
            setLocationStatus("watching");
            setLocationMessage("Live location sharing active");
          }
        })
        .catch(() => setLocationStatus("error"));
    };

    watchId = navigator.geolocation.watchPosition(
      (pos) => transmit(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        if (cancelled) return;
        setLocationStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
        setLocationMessage(err.code === err.PERMISSION_DENIED ? "GPS access denied" : "GPS Error");
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => {
      cancelled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [tokens?.accessToken]);

  // Parcel Filtering logic
  const filteredParcels = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const list = parcels || [];
    if (!query) return list;
    return list.filter(p => 
      p.trackingCode?.toLowerCase().includes(query) || 
      p.deliveryAddressId?.city?.toLowerCase().includes(query)
    );
  }, [parcels, searchQuery]);

  // Tab Definitions for easier rendering
  const TAB_CONFIG = [
    { id: "active", label: "Active", filter: (p: any) => ACTIVE_STATUSES.includes(p.status) },
    { id: "picked_up", label: "Picked Up", filter: (p: any) => p.status === "PICKED_UP" },
    { id: "in_transit", label: "In Transit", filter: (p: any) => p.status === "IN_TRANSIT" },
    { id: "completed", label: "Completed", filter: (p: any) => COMPLETED_STATUSES.includes(p.status) },
    { id: "review", label: "Review", filter: (p: any) => REVIEW_STATUSES.includes(p.status) },
  ];

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background pb-10">
      {/* Header - Fixed height for better mobile layout */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg text-primary-foreground">
              <LayoutDashboard size={18} />
            </div>
            <h1 className="font-bold text-base sm:text-lg tracking-tight">Agent Console</h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/agent/notifications" className="p-2 relative hover:bg-muted rounded-full">
              <Bell size={20} className="text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-destructive text-[10px] text-white flex items-center justify-center rounded-full border-2 border-background">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive gap-2">
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[90vw] max-w-md rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Ready to sign out?</AlertDialogTitle>
                  <AlertDialogDescription>Active tracking will stop until you sign back in.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmLogout} className="bg-destructive text-white rounded-xl">
                    {loggingOut ? "Signing out..." : "Sign Out"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4 space-y-4">
        {/* Location & Alerts */}
        {["denied", "error", "unsupported"].includes(locationStatus) && (
          <Alert variant="destructive" className="rounded-xl border-none shadow-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs font-medium">{locationMessage}</AlertDescription>
          </Alert>
        )}

        {/* Dynamic Stats Grid - 3 columns on all screens but smaller text on mobile */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <StatCard
            title="Active"
            count={parcels.filter(p => ACTIVE_STATUSES.includes(p.status)).length}
            icon={<Package size={16} />}
            className="bg-blue-50 dark:bg-blue-900/20 text-blue-600"
          />
          <StatCard
            title="On Way"
            count={parcels.filter(p => p.status === "IN_TRANSIT").length}
            icon={<Truck size={16} />}
            className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
          />
          <StatCard
            title="Issues"
            count={parcels.filter(p => REVIEW_STATUSES.includes(p.status)).length}
            icon={<AlertCircle size={16} />}
            className="bg-amber-50 dark:bg-amber-900/20 text-amber-600"
          />
        </div>

        {/* Search Bar - Full width on mobile */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tracking ID or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 sm:h-12 rounded-xl border-none shadow-sm ring-1 ring-border focus-visible:ring-primary bg-background"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
              <X size={16} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-1">
          <div className={`h-2 w-2 rounded-full animate-pulse ${LOCATION_COLORS[locationStatus]}`} />
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {locationMessage}
          </span>
        </div>

        {/* Scrollable Tabs System */}
        <Tabs defaultValue="active" className="w-full">
          <div className="relative -mx-4 px-4 overflow-x-auto no-scrollbar">
            <TabsList className="flex w-max min-w-full gap-1 bg-muted/40 p-1 rounded-xl">
              {TAB_CONFIG.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {tab.label} ({parcels.filter(tab.filter).length})
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="mt-4">
            {TAB_CONFIG.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="space-y-3 outline-none">
                {loading ? (
                  <LoadingList />
                ) : filteredParcels.filter(tab.filter).length > 0 ? (
                  filteredParcels
                    .filter(tab.filter)
                    .map((p) => (
                      <ParcelCard key={p._id} parcel={p} onActionComplete={refresh} />
                    ))
                ) : (
                  <EmptyState
                    icon={tab.id === 'completed' ? <PackageCheck /> : <Package />}
                    title={`No ${tab.label} shipments`}
                    description="Items matching this status will appear here."
                  />
                )}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </main>
    </div>
  );
}

/**
 * Enhanced Components for Responsiveness
 */

function StatCard({ title, count, icon, className }: { title: string; count: number; icon: React.ReactNode; className: string }) {
  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-xl sm:text-2xl font-bold">{count}</p>
          </div>
          <div className={`p-2 rounded-lg ${className}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 bg-background rounded-xl border border-border/50 shadow-sm">
          <div className="flex justify-between mb-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 rounded-2xl border border-dashed border-muted bg-muted/5">
      <div className="mb-3 text-muted-foreground/30 h-10 w-10">{icon}</div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-[12px] text-muted-foreground text-center mt-1">{description}</p>
    </div>
  );
}