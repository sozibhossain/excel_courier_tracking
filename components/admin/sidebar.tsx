"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { BarChart3, Package, Users, FileText, LogOut, ChevronLeft, ChevronRight, Menu } from "lucide-react"

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
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-primary text-primary-foreground p-2 rounded-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 ${
          isOpen ? "w-64" : "w-20"
        } lg:w-64 lg:translate-x-0 ${isOpen ? "" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center gap-2 ${!isOpen && "lg:flex"} hidden lg:flex`}>
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <Package className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              {isOpen && <span className="font-bold text-sidebar-foreground">Delivery</span>}
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="hidden lg:block text-sidebar-foreground hover:bg-sidebar-accent rounded-lg p-1 transition-colors"
            >
              {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {isOpen && <span className="ml-2">{item.label}</span>}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Logout Button */}
          <Button
            onClick={logout}
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-5 h-5" />
            {isOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Offset */}
      <div className="lg:ml-64" />
    </>
  )
}
