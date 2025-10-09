"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, Bot, MessageSquare, TrendingUp, Plus, Calendar, Gift, Zap } from "lucide-react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { ScrollFadeIn, ScrollSlideUp, ScrollStaggeredChildren, ScrollStaggerChild, ScrollScaleIn } from "@/components/ui/scroll-animations"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface DashboardOverviewProps {
  user: User
  profile: any
}

export function DashboardOverview({ user, profile }: DashboardOverviewProps) {

  // Mock data - in real app, this would come from the database
  const stats = {
    totalClients: 0,
    activeBots: 0,
    monthlyMessages: 0,
    conversionRate: 0,
  }

  const trialDaysLeft = 15 // This would be calculated based on user creation date



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
        <ScrollFadeIn delay={0.2}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs sm:text-sm w-fit">
              <Calendar className="h-3 w-3 mr-1" />
              {trialDaysLeft} días de prueba
            </Badge>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button asChild size="sm" className="w-full sm:w-auto">
                <Link href="/dashboard/bots">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Crear Bot</span>
                  <span className="sm:hidden">Bot</span>
                </Link>
              </Button>
            </motion.div>
          </div>
        </ScrollFadeIn>
      </div>

      {/* Trial Progress */}
      <ScrollFadeIn delay={0.3}>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Gift className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
              Prueba Gratuita Activa
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Aprovecha al máximo tus {trialDaysLeft} días restantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <Progress value={((15 - trialDaysLeft) / 15) * 100} className="h-2" />
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                <span className="text-muted-foreground text-xs sm:text-sm">Día {15 - trialDaysLeft} de 15</span>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <Link href="/dashboard/configuracion">Ver Planes</Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </ScrollFadeIn>

      {/* Stats Grid */}
      <ScrollStaggeredChildren className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
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
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
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
              <p className="text-xs text-muted-foreground">de 1 disponible en tu plan</p>
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
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
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
              <ScrollScaleIn delay={0.8}>
                <div className="text-xl sm:text-2xl font-bold">{stats.conversionRate}%</div>
              </ScrollScaleIn>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>
        </ScrollStaggerChild>
      </ScrollStaggeredChildren>

      {/* Quick Actions */}
      <ScrollStaggeredChildren className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <ScrollStaggerChild>
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                  Primeros pasos
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Guía interactiva para configurar tu app y empezar a usar el bot</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="flex flex-col gap-4 sm:gap-6">
                  {/* Multi-step onboarding visual */}
                  {[{
                    label: "Completar información del negocio",
                    action: "Completar",
                    href: "/dashboard/negocio",
                  }, {
                    label: "Configurar tu primer bot",
                    action: "Configurar",
                    href: "/dashboard/bots",
                  }, {
                    label: "Añadir tus primeros clientes",
                    action: "Añadir",
                    href: "/dashboard/clientes",
                  }, {
                    label: "Probar tu bot",
                    action: "Probar",
                    href: "/dashboard/pruebas",
                  }].map((step, idx) => (
                    <div key={step.label} className="flex items-center gap-2 sm:gap-4 mb-2">
                      <motion.div
                        className={cn(
                          "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg border-2 transition-colors",
                          "bg-primary text-white border-primary"
                        )}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 * idx }}
                      >
                        {idx + 1}
                      </motion.div>
                      <span className="flex-1 text-xs sm:text-sm font-medium">{step.label}</span>
                      <Button asChild size="sm" variant="outline" className="text-xs sm:text-sm">
                        <Link href={step.href}>{step.action}</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </ScrollStaggerChild>

        <ScrollStaggerChild>
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                  Gestionar Clientes
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Añade y organiza tu base de clientes</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button asChild variant="outline" className="w-full bg-transparent text-sm sm:text-base">
                    <Link href="/dashboard/clientes">
                      <span className="hidden sm:inline">Ver Clientes</span>
                      <span className="sm:hidden">Clientes</span>
                    </Link>
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </ScrollStaggerChild>

        <ScrollStaggerChild>
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                  Automatizaciones
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Configura campañas automáticas de marketing</CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button asChild variant="outline" className="w-full bg-transparent text-sm sm:text-base">
                    <Link href="/dashboard/automatizaciones">
                      <span className="hidden sm:inline">Configurar</span>
                      <span className="sm:hidden">Configurar</span>
                    </Link>
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </ScrollStaggerChild>
      </ScrollStaggeredChildren>
    </div>
  )
}
