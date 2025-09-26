"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bot,
  Users,
  Gift,
  Settings,
  BarChart3,
  Zap,
  Building2,
  TestTube,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    name: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
  },
  {
    name: "Bots",
    href: "/dashboard/bots",
    icon: Bot,
  },
  {
    name: "Promociones",
    href: "/dashboard/promociones",
    icon: Gift,
  },
  {
    name: "Automatizaciones",
    href: "/dashboard/automatizaciones",
    icon: Zap,
  },
  {
    name: "Mi Negocio",
    href: "/dashboard/negocio",
    icon: Building2,
  },
  {
    name: "Pruebas",
    href: "/dashboard/pruebas",
    icon: TestTube,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-sidebar-foreground">ChatBot Pro</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center",
                )}
              >
                <item.icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/60 text-center">ChatBot Pro v1.0</div>
        </div>
      )}
    </div>
  )
}
