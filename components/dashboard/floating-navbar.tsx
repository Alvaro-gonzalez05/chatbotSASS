"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Users,
  Bot,
  Gift,
  Zap,
  Building2,
  TestTube,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { User } from "@supabase/supabase-js"

// Navegación izquierda (3 elementos)
const leftNavigation = [
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
    name: "Promociones",
    href: "/dashboard/promociones",
    icon: Gift,
  },
]

// Navegación derecha (3 elementos)
const rightNavigation = [
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

interface FloatingNavbarProps {
  user?: User
  profile?: any
}

export function FloatingNavbar({ user, profile }: FloatingNavbarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href

  return (
    <div className="fixed bottom-4 left-4 right-4 flex justify-center z-50 lg:hidden">
      <nav className="flex items-center justify-center space-x-2 px-4 py-2 rounded-2xl border bg-background/95 backdrop-blur-md shadow-lg max-w-sm">
        {/* Navegación Izquierda */}
        {leftNavigation.map((item) => (
          <Button
            key={item.name}
            variant={isActive(item.href) ? "default" : "ghost"}
            size="icon"
            className={cn(
              "rounded-xl h-9 w-9",
              isActive(item.href) && "bg-primary shadow-sm"
            )}
            asChild
          >
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              <span className="sr-only">{item.name}</span>
            </Link>
          </Button>
        ))}

        {/* Botón Bot Central */}
        <Button
          variant={isActive("/dashboard/bots") ? "default" : "ghost"}
          size="icon"
          className={cn(
            "rounded-full h-12 w-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md mx-1",
            isActive("/dashboard/bots") && "ring-2 ring-primary/30"
          )}
          asChild
        >
          <Link href="/dashboard/bots">
            <Bot className="h-5 w-5" />
            <span className="sr-only">Bots</span>
          </Link>
        </Button>

        {/* Navegación Derecha */}
        {rightNavigation.map((item) => (
          <Button
            key={item.name}
            variant={isActive(item.href) ? "default" : "ghost"}
            size="icon"
            className={cn(
              "rounded-xl h-9 w-9",
              isActive(item.href) && "bg-primary shadow-sm"
            )}
            asChild
          >
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              <span className="sr-only">{item.name}</span>
            </Link>
          </Button>
        ))}
      </nav>
    </div>
  )
}