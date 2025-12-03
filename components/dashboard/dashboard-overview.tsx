"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, Bot, MessageSquare, TrendingUp, Plus, Calendar, Gift, Zap, Loader2, MessageCircle, Activity, UserPlus, Settings, Play } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { ScrollFadeIn, ScrollSlideUp, ScrollStaggeredChildren, ScrollStaggerChild, ScrollScaleIn } from "@/components/ui/scroll-animations"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { startOfMonth, subMonths, endOfMonth } from "date-fns"
import { MultiStepBotCreation } from "./multi-step-bot-creation"
import { MultiStepAutomationCreation } from "./multi-step-automation-creation"
import { ClientCreationDialog } from "./client-creation-dialog"

interface DashboardOverviewProps {
  user: User
  profile: any
}

export function DashboardOverview({ user, profile }: DashboardOverviewProps) {
  const router = useRouter()
  const [isBotDialogOpen, setIsBotDialogOpen] = useState(false)
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [isAutomationDialogOpen, setIsAutomationDialogOpen] = useState(false)
  
  const [stats, setStats] = useState({
    totalClients: 0,
    clientsGrowth: 0,
    activeBots: 0,
    monthlyMessages: 0,
    messagesGrowth: 0,
    conversionRate: 0,
    conversionGrowth: 0,
    activeConversations: 0,
    totalConversations: 0,
    unreadMessages: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "F5":
          e.preventDefault()
          setIsBotDialogOpen(true)
          break
        case "F6":
          e.preventDefault()
          setIsClientDialogOpen(true)
          break
        case "F7":
          e.preventDefault()
          setIsAutomationDialogOpen(true)
          break
        case "F8":
          e.preventDefault()
          router.push("/dashboard/chat")
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router])

  const fetchStats = async () => {
    try {
      const now = new Date()
      const startOfCurrentMonth = startOfMonth(now).toISOString()
      const startOfLastMonth = startOfMonth(subMonths(now, 1)).toISOString()
      const endOfLastMonth = endOfMonth(subMonths(now, 1)).toISOString()

      // 1. Clients Stats
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: lastMonthClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lt('created_at', startOfCurrentMonth)

      const clientsGrowth = lastMonthClients && lastMonthClients > 0 
        ? ((totalClients || 0) - lastMonthClients) / lastMonthClients * 100 
        : 0

      // 2. Active Bots
      const { count: activeBots } = await supabase
        .from('bots')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true)

      // 3. Messages Stats & Active Conversations
      // Fetch conversations IDs for this user
      const { data: userConversations } = await supabase
        .from('conversations')
        .select('id, status, last_message_at')
        .eq('user_id', user.id)
      
      const conversationIds = userConversations?.map(c => c.id) || []
      
      // Calculate active conversations (activity in last 24h)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const activeConversations = userConversations?.filter(c => 
        c.last_message_at && c.last_message_at >= oneDayAgo
      ).length || 0
      
      let monthlyMessages = 0
      let lastMonthMessages = 0
      let unreadMessages = 0

      if (conversationIds.length > 0) {
        const { count: currentMonthCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .gte('created_at', startOfCurrentMonth)
          
        const { count: lastMonthCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .gte('created_at', startOfLastMonth)
          .lt('created_at', startOfCurrentMonth)
          
        monthlyMessages = currentMonthCount || 0
        lastMonthMessages = lastMonthCount || 0
      }

      const messagesGrowth = lastMonthMessages > 0
        ? (monthlyMessages - lastMonthMessages) / lastMonthMessages * 100
        : 0

      setStats({
        totalClients: totalClients || 0,
        clientsGrowth,
        activeBots: activeBots || 0,
        monthlyMessages,
        messagesGrowth,
        conversionRate: 0,
        conversionGrowth: 0,
        activeConversations,
        totalConversations: conversationIds.length,
        unreadMessages: 0 
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [user.id])

  // Calculate trial days left
  const trialEndDate = profile?.trial_end_date ? new Date(profile.trial_end_date) : new Date()
  const now = new Date()
  const diffTime = Math.max(0, trialEndDate.getTime() - now.getTime())
  const trialDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
  const maxTrialDays = 15 // Assuming 15 days trial

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }



  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ScrollSlideUp>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-balance">¡Bienvenido, {profile?.business_name || "emprendedor"}!</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">Aquí tienes un resumen de tu negocio y chatbots</p>
          </div>
        </ScrollSlideUp>
      </div>



      <div className="space-y-6">
        {/* Quick Actions - Horizontal */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div onClick={() => setIsBotDialogOpen(true)} className="block cursor-pointer">
              <Card className="bg-emerald-500 hover:bg-emerald-600 transition-colors border-none text-white h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
                  <div className="p-2 bg-white/20 rounded-full mb-1">
                    <Bot className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-sm">Nuevo Bot</span>
                  <span className="text-xs opacity-70">Tecla F5</span>
                </CardContent>
              </Card>
            </div>
            
            <div onClick={() => setIsClientDialogOpen(true)} className="block cursor-pointer">
              <Card className="bg-emerald-500 hover:bg-emerald-600 transition-colors border-none text-white h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
                  <div className="p-2 bg-white/20 rounded-full mb-1">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-sm">Nuevo Cliente</span>
                  <span className="text-xs opacity-70">Tecla F6</span>
                </CardContent>
              </Card>
            </div>

            <div onClick={() => setIsAutomationDialogOpen(true)} className="block cursor-pointer">
              <Card className="bg-emerald-500 hover:bg-emerald-600 transition-colors border-none text-white h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
                  <div className="p-2 bg-white/20 rounded-full mb-1">
                    <Zap className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-sm">Nueva Automatización</span>
                  <span className="text-xs opacity-70">Tecla F7</span>
                </CardContent>
              </Card>
            </div>

            <Link href="/dashboard/chat" className="block">
              <Card className="bg-emerald-500 hover:bg-emerald-600 transition-colors border-none text-white cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
                  <div className="p-2 bg-white/20 rounded-full mb-1">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-sm">Ir al Chat</span>
                  <span className="text-xs opacity-70">Tecla F8</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Stats - Below */}
        <div>
          <ScrollStaggeredChildren className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
            <ScrollStaggerChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Clientes</CardTitle>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <ScrollScaleIn delay={0.5}>
                    <div className="text-xl sm:text-2xl font-bold">{stats.totalClients}</div>
                  </ScrollScaleIn>
                  <p className="text-xs text-muted-foreground">
                    {stats.clientsGrowth > 0 ? "+" : ""}{stats.clientsGrowth.toFixed(0)}% desde el mes pasado
                  </p>
                </CardContent>
              </Card>
            </ScrollStaggerChild>

            <ScrollStaggerChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Bots Activos</CardTitle>
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <ScrollScaleIn delay={0.6}>
                    <div className="text-xl sm:text-2xl font-bold">{stats.activeBots}</div>
                  </ScrollScaleIn>
                  <p className="text-xs text-muted-foreground">de {profile?.max_bots || 1} disponible en tu plan</p>
                </CardContent>
              </Card>
            </ScrollStaggerChild>

            <ScrollStaggerChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Mensajes del Mes</CardTitle>
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <ScrollScaleIn delay={0.7}>
                    <div className="text-xl sm:text-2xl font-bold">{stats.monthlyMessages}</div>
                  </ScrollScaleIn>
                  <p className="text-xs text-muted-foreground">
                    {stats.messagesGrowth > 0 ? "+" : ""}{stats.messagesGrowth.toFixed(0)}% desde el mes pasado
                  </p>
                </CardContent>
              </Card>
            </ScrollStaggerChild>

            <ScrollStaggerChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Conversaciones Activas</CardTitle>
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <ScrollScaleIn delay={0.8}>
                    <div className="text-xl sm:text-2xl font-bold">{stats.activeConversations}</div>
                  </ScrollScaleIn>
                  <p className="text-xs text-muted-foreground">
                    En las últimas 24 horas
                  </p>
                </CardContent>
              </Card>
            </ScrollStaggerChild>

            <ScrollStaggerChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Conversaciones</CardTitle>
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <ScrollScaleIn delay={0.9}>
                    <div className="text-xl sm:text-2xl font-bold">{stats.totalConversations}</div>
                  </ScrollScaleIn>
                  <p className="text-xs text-muted-foreground">
                    Histórico total
                  </p>
                </CardContent>
              </Card>
            </ScrollStaggerChild>

            <ScrollStaggerChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-medium">Tasa de Conversión</CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <ScrollScaleIn delay={1.0}>
                    <div className="text-xl sm:text-2xl font-bold">{stats.conversionRate}%</div>
                  </ScrollScaleIn>
                  <p className="text-xs text-muted-foreground">
                    {stats.conversionGrowth > 0 ? "+" : ""}{stats.conversionGrowth.toFixed(0)}% desde el mes pasado
                  </p>
                </CardContent>
              </Card>
            </ScrollStaggerChild>
          </ScrollStaggeredChildren>
        </div>
      </div>

      <MultiStepBotCreation
        isOpen={isBotDialogOpen}
        onClose={() => setIsBotDialogOpen(false)}
        onBotCreated={() => {
          setIsBotDialogOpen(false)
          fetchStats()
        }}
        userId={user.id}
      />

      <ClientCreationDialog
        isOpen={isClientDialogOpen}
        onClose={() => setIsClientDialogOpen(false)}
        onClientCreated={() => {
          setIsClientDialogOpen(false)
          fetchStats()
        }}
        userId={user.id}
      />

      <MultiStepAutomationCreation
        isOpen={isAutomationDialogOpen}
        onClose={() => setIsAutomationDialogOpen(false)}
        onAutomationCreated={() => {
          setIsAutomationDialogOpen(false)
          fetchStats()
        }}
        userId={user.id}
      />
    </div>
  )
}
