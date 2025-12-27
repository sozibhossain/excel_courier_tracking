"use client";

import { useMemo, useState } from "react";
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

// Grouping Statuses
const ACTIVE_STATUSES: ParcelSummary["status"][] = [
  "BOOKED",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
];
const COMPLETED_STATUSES: ParcelSummary["status"][] = ["DELIVERED"];
const REVIEW_STATUSES: ParcelSummary["status"][] = ["FAILED", "CANCELLED"];

export default function AgentDashboard() {
  const router = useRouter();
  const { logout } = useAuth();
  const { unreadCount } = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const { parcels, loading } = useAgentParcels({ limit: 50 });

  // Categorize parcels into three groups
  const categorized = useMemo(() => {
    return parcels.reduce(
      (acc, parcel) => {
        if (ACTIVE_STATUSES.includes(parcel.status)) acc.active.push(parcel);
        else if (COMPLETED_STATUSES.includes(parcel.status))
          acc.completed.push(parcel);
        else if (REVIEW_STATUSES.includes(parcel.status))
          acc.review.push(parcel);
        return acc;
      },
      {
        active: [] as ParcelSummary[],
        completed: [] as ParcelSummary[],
        review: [] as ParcelSummary[],
      }
    );
  }, [parcels]);

  const filteredActive = useMemo(
    () => filterParcels(categorized.active, searchQuery),
    [categorized.active, searchQuery]
  );
  const filteredCompleted = useMemo(
    () => filterParcels(categorized.completed, searchQuery),
    [categorized.completed, searchQuery]
  );
  const filteredReview = useMemo(
    () => filterParcels(categorized.review, searchQuery),
    [categorized.review, searchQuery]
  );

  const handleConfirmLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await logout();
      setLogoutOpen(false);
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Brand/Logo Section */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight leading-none">
                  Agent Console
                </h1>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 font-medium hidden sm:block">
                  Real-time Logistics
                </p>
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Notification Button */}
              <Link
                href="/agent/notifications"
                className="relative h-10 w-10 rounded-xl border border-transparent hover:border-border hover:bg-muted flex items-center justify-center"
                aria-label={`Notifications (${unreadCount})`}
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white ring-2 ring-background">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Logout Button Section */}
              <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="group h-10 gap-2 rounded-xl px-2 sm:px-4 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
                  >
                    <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                    <span className="hidden sm:inline font-semibold">
                      Logout
                    </span>
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign out?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will need to log back in to manage your active
                      parcels.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel
                      className="rounded-xl"
                      disabled={loggingOut}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConfirmLogout}
                      disabled={loggingOut}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                    >
                      {loggingOut ? "Signing out..." : "Sign Out"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Stats Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Active Jobs"
            count={categorized.active.length}
            icon={<Package className="h-5 w-5" />}
            color="text-blue-600 bg-blue-50 dark:bg-blue-950/30"
          />
          <StatCard
            title="Completed"
            count={categorized.completed.length}
            icon={<CheckCircle2 className="h-5 w-5" />}
            color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
          />
          <StatCard
            title="Needs Review"
            count={categorized.review.length}
            icon={<AlertCircle className="h-5 w-5" />}
            color="text-amber-600 bg-amber-50 dark:bg-amber-950/30"
          />
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search tracking ID or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-2xl border-none shadow-sm ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary transition-all bg-background"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 items-stretch p-1 bg-muted/50 rounded-2xl">
            <TabsTrigger
              value="active"
              className="rounded-xl data-[state=active]:shadow-sm"
            >
              Active ({categorized.active.length})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="rounded-xl data-[state=active]:shadow-sm"
            >
              Completed
            </TabsTrigger>
            <TabsTrigger
              value="review"
              className="rounded-xl data-[state=active]:shadow-sm"
            >
              Review
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="active" className="space-y-4 outline-none">
              {loading ? (
                <LoadingList />
              ) : filteredActive.length > 0 ? (
                filteredActive.map((p) => <ParcelCard key={p._id} parcel={p} />)
              ) : (
                <EmptyState
                  icon={<Package />}
                  title="All caught up"
                  description="No active deliveries found."
                />
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 outline-none">
              {loading ? (
                <LoadingList />
              ) : filteredCompleted.length > 0 ? (
                filteredCompleted.map((p) => (
                  <ParcelCard key={p._id} parcel={p} />
                ))
              ) : (
                <EmptyState
                  icon={<CheckCircle2 />}
                  title="No completions yet"
                  description="Deliveries you finish will appear here."
                />
              )}
            </TabsContent>

            <TabsContent value="review" className="space-y-4 outline-none">
              {loading ? (
                <LoadingList />
              ) : filteredReview.length > 0 ? (
                filteredReview.map((p) => <ParcelCard key={p._id} parcel={p} />)
              ) : (
                <EmptyState
                  icon={<AlertCircle />}
                  title="Clear records"
                  description="No failed or cancelled parcels to review."
                />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

/**
 * Sub-components
 */

function StatCard({
  title,
  count,
  icon,
  color,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{count}</p>
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function filterParcels(parcels: ParcelSummary[], search: string) {
  if (!search) return parcels;
  const query = search.toLowerCase().trim();
  return parcels.filter(
    (p) =>
      p.trackingCode?.toLowerCase().includes(query) ||
      p.deliveryAddressId?.city?.toLowerCase().includes(query)
  );
}

function LoadingList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="p-4 bg-background rounded-2xl border border-border"
        >
          <div className="flex justify-between mb-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 rounded-3xl border-2 border-dashed border-muted bg-muted/5">
      <div className="mb-4 text-muted-foreground/40">
        {icon && <div className="h-12 w-12">{icon}</div>}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-[250px] mt-1">
        {description}
      </p>
    </div>
  );
}
