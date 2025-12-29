"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useSidebar } from "@/lib/sidebar-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  BarChart3, Package, Users, FileText, LogOut,
  ChevronLeft, ChevronRight, Menu, Bell, X, LayoutDashboard,
} from "lucide-react"

export function AdminSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { isOpen, setIsOpen, isMobile } = useSidebar()

  const menuItems = [
    { label: "Dashboard", icon: BarChart3, href: "/admin/dashboard" },
    { label: "Parcels", icon: Package, href: "/admin/parcels" },
    { label: "Users", icon: Users, href: "/admin/users" },
    { label: "Reports", icon: FileText, href: "/admin/reports" },
    { label: "Notifications", icon: Bell, href: "/admin/notifications" },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen border-r bg-white transition-all duration-300 ease-in-out dark:bg-slate-950",
          isOpen ? "w-64 translate-x-0" : isMobile ? "-translate-x-full" : "w-20 translate-x-0"
        )}
      >
        <div className="flex h-full flex-col px-3 py-4">
          <div className="mb-8 flex items-center justify-between px-2">
            <div className="flex items-center gap-3 overflow-hidden">
              
              {isOpen && (
               <div className="flex items-center justify-center gap-4">
                 
<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <LayoutDashboard className="h-5 w-5" />
              </div>
                <span className="font-bold text-lg tracking-tight whitespace-nowrap animate-in fade-in duration-500">
                  Admin Panel
                </span>
               </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="h-8 w-8 rounded-lg text-slate-500"
            >
              {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </Button>
          </div>

          <nav className="flex-1 space-y-1.5">
            {menuItems.map((item) => {
              const active = pathname === item.href
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="relative block">
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    className={cn(
                      "group w-full h-11 justify-start gap-4 rounded-xl transition-all",
                      active ? "bg-primary/10 text-primary" : "text-slate-500",
                      !isOpen && "justify-center px-0"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0", active && "scale-110")} />
                    {isOpen && <span className="font-medium animate-in fade-in duration-300">{item.label}</span>}
                    {active && <div className="absolute left-[-12px] h-6 w-1 rounded-r-full bg-primary" />}
                  </Button>
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto border-t pt-4">
            <Button
              onClick={logout}
              variant="ghost"
              className={cn(
                "w-full h-11 justify-start gap-4 rounded-xl text-rose-500 hover:bg-rose-50",
                !isOpen && "justify-center px-0"
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {isOpen && <span className="font-medium">Sign Out</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}