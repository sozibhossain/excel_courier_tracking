"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, MapPin, BarChart3, User } from "lucide-react"

export function AgentBottomNav() {
  const pathname = usePathname()

  const navItems = [
    { label: "Parcels", icon: Package, href: "/agent/dashboard" },
    { label: "Map", icon: MapPin, href: "/agent/map" },
    { label: "Stats", icon: BarChart3, href: "/agent/stats" },
    { label: "Profile", icon: User, href: "/agent/profile" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border lg:hidden z-30">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div
                className={`flex flex-col items-center gap-1 py-2 px-2 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
