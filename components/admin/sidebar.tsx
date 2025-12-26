"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Package,
  Users,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react"

export function AdminSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [isOpen, setIsOpen] = useState(true)

  const menuItems = [
    { label: "Dashboard", icon: BarChart3, href: "/admin/dashboard" },
    { label: "Parcels", icon: Package, href: "/admin/parcels" },
    { label: "Users", icon: Users, href: "/admin/users" },
    { label: "Reports", icon: FileText, href: "/admin/reports" },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Mobile Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-primary text-primary-foreground p-2 rounded-lg"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar */}
      <aside
        className={[
          "fixed top-0 left-0 z-50 h-screen border-r bg-sidebar border-sidebar-border",
          "transition-all duration-300",
          // Desktop collapse width
          isOpen ? "lg:w-64" : "lg:w-20",
          // Mobile slide in/out
          isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
          // Always visible on desktop
          "lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex flex-col h-full p-4">
          {/* Header / Logo */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">

              {/* Hide text when collapsed on desktop */}
              <span className={`font-bold text-sidebar-foreground ${!isOpen ? "lg:hidden" : ""}`}>
                Tracking
              </span>
            </div>

            {/* Desktop collapse button */}
            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="hidden lg:inline-flex items-center justify-center rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent"
              aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon

              return (
                <Link key={item.href} href={item.href} className="block">
                  <Button
                    variant="ghost"
                    className={[
                      "w-full h-11",
                      "justify-start gap-3",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent",
                      // Center icons when collapsed on desktop
                      !isOpen ? "lg:justify-center lg:px-0" : "",
                    ].join(" ")}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className={!isOpen ? "lg:hidden" : ""}>{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <Button
            onClick={logout}
            variant="ghost"
            className={[
              "w-full h-11 mt-2",
              "justify-start gap-3",
              "text-sidebar-foreground hover:bg-sidebar-accent",
              !isOpen ? "lg:justify-center lg:px-0" : "",
            ].join(" ")}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={!isOpen ? "lg:hidden" : ""}>Logout</span>
          </Button>
        </div>
      </aside>
    </>
  )
}
