"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import {
  Users,
  Gift,
  Settings,
  BarChart3,
  Zap,
  Building2,
  TestTube,
  ChevronLeft,
  ChevronRight,
  Package,
  Calendar,
  ShoppingCart,
  MessageSquare,
} from "lucide-react"

interface NavigationItem {
  name: string
  href: string
  icon: any
  requiresFeature?: string
  visible?: boolean
}

const baseNavigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    name: "Mensajes",
    href: "/dashboard/chat",
    icon: MessageSquare,
  },
  {
    name: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
  },
  {
    name: "Bots",
    href: "/dashboard/bots",
    icon: Users, // TODO: cambiar por ícono de bot
  },
  {
    name: "Pedidos",
    href: "/dashboard/pedidos",
    icon: ShoppingCart,
    requiresFeature: "take_orders",
  },
  {
    name: "Reservas",
    href: "/dashboard/reservas",
    icon: Calendar,
    requiresFeature: "take_reservations",
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
  const [navigation, setNavigation] = useState<NavigationItem[]>(() => 
    // Initialize with feature items hidden to avoid flash
    baseNavigation.map(item => ({ 
      ...item, 
      visible: !item.requiresFeature 
    }))
  )
  const supabase = createClient()

  const updateNavigation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's bots and their features
      const { data: bots, error: botsError } = await supabase
        .from("bots")
        .select("features")
        .eq("user_id", user.id)

      console.log('🔍 Updating sidebar navigation...')
      console.log('📊 Found bots:', bots)
      console.log('❌ Bots error:', botsError)

      if (botsError) {
        console.error('Error fetching bots for sidebar:', botsError)
        return
      }

      if (!bots || bots.length === 0) {
        console.log('⚠️ No bots found, hiding all feature-dependent items')
        const updatedNavigation = baseNavigation.map(item => ({
          ...item,
          visible: !item.requiresFeature // Only show items that don't require features
        }))
        setNavigation(updatedNavigation)
        return
      }

      // Extract all enabled features across all bots
      const allFeatures = new Set<string>()
      bots.forEach((bot, index) => {
        console.log(`🤖 Bot ${index + 1} features:`, bot.features, typeof bot.features)
        if (bot.features && Array.isArray(bot.features)) {
          bot.features.forEach((feature: string) => allFeatures.add(feature))
        }
      })

      console.log('✨ All enabled features:', Array.from(allFeatures))

      // Update navigation based on available features
      const updatedNavigation = baseNavigation.map(item => {
        const isVisible = item.requiresFeature ? allFeatures.has(item.requiresFeature) : true
        console.log(`📋 ${item.name}: requiresFeature="${item.requiresFeature}" → visible=${isVisible}`)
        return {
          ...item,
          visible: isVisible
        }
      })

      console.log('🎯 Final navigation state:')
      updatedNavigation.forEach(item => {
        if (item.requiresFeature) {
          console.log(`  ${item.name}: ${item.visible ? '✅ VISIBLE' : '❌ HIDDEN'}`)
        }
      })
      
      setNavigation(updatedNavigation)
    } catch (error) {
      console.error('Error updating navigation:', error)
      // Fallback: show all items
      setNavigation(baseNavigation.map(item => ({ ...item, visible: true })))
    }
  }

  useEffect(() => {
    updateNavigation()

    // Listen for custom events when bots are created/updated
    const handleBotUpdate = () => {
      console.log('Bot update event received, refreshing navigation...')
      updateNavigation()
    }

    window.addEventListener('botCreated', handleBotUpdate)
    window.addEventListener('botUpdated', handleBotUpdate)

    // Also update navigation when navigating between pages (in case user created/edited a bot)
    const handleRouteChange = () => {
      setTimeout(updateNavigation, 500) // Small delay to ensure data is saved
    }
    
    window.addEventListener('focus', handleRouteChange)

    return () => {
      window.removeEventListener('botCreated', handleBotUpdate)
      window.removeEventListener('botUpdated', handleBotUpdate)
      window.removeEventListener('focus', handleRouteChange)
    }
  }, [supabase])

  return (
    <div
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 h-screen",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Image src="/ucobot-logo.png" alt="UcoBot" width={24} height={24} className="text-primary" />
            <span className="text-lg font-bold text-sidebar-foreground">UcoBot</span>
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
          {navigation
            .filter(item => item.visible !== false)
            .map((item) => {
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
          <div className="text-xs text-sidebar-foreground/60 text-center">UcoBot v1.0</div>
        </div>
      )}
    </div>
  )
}
