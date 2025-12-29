"use client"

import { useAuth } from "@/lib/auth-context"
import { AdminSidebar } from "@/components/admin/sidebar"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"
import { Bell, User, ShieldCheck, Menu, LayoutDashboard } from "lucide-react"
import { useNotifications } from "@/lib/notifications-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function AdminHeader() {
  const { unreadCount } = useNotifications()
  const { user } = useAuth()
  const { isOpen, setIsOpen, isMobile } = useSidebar()

  return (
    <header className={cn(
      "fixed top-0 right-0 z-40 h-16 border-b bg-white/80 backdrop-blur-md transition-all duration-300",
      isMobile ? "left-0" : isOpen ? "left-64" : "left-20"
    )}>
      <div className="h-full px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Trigger */}
          {isMobile && !isOpen && (
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            {isOpen ? ( null) : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <LayoutDashboard className="h-5 w-5" />
            </div>}

            <span className="text-sm font-medium text-slate-500">
              {isOpen ? "Console" : "Admin Console"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/admin/notifications" className="relative">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Bell className="h-5 w-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>
          <div className="flex items-center gap-3 pl-2 border-l">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold leading-none">{user?.name || "Admin"}</p>
              <p className="text-[10px] uppercase text-slate-400 font-bold">Administrator</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <User className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { isOpen, isMobile } = useSidebar()

  if (loading) return <div className="h-screen w-full flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  if (user?.role !== "ADMIN") return null

  return (
    <div className="min-h-screen bg-slate-50/50">
      <AdminSidebar />
      <AdminHeader />
      <main className={cn(
        "transition-all duration-300 ease-in-out pt-16",
        isMobile ? "pl-0" : isOpen ? "pl-64" : "pl-20"
      )}>
        <div className="mx-auto max-w-[1600px] p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  )
}