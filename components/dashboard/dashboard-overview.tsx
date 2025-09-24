"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, Bot, MessageSquare, TrendingUp, Plus, Calendar, Gift, Zap } from "lucide-react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import { ScrollFadeIn, ScrollSlideUp, ScrollStaggeredChildren, ScrollStaggerChild, ScrollScaleIn } from "@/components/ui/scroll-animations"
import { motion } from "framer-motion"

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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <ScrollSlideUp>
          <div>
            <h1 className="text-3xl font-bold text-balance">¡Bienvenido, {profile?.business_name || "emprendedor"}!</h1>
            <p className="text-muted-foreground mt-2">Aquí tienes un resumen de tu negocio y chatbots</p>
          </div>
        </ScrollSlideUp>
        <ScrollFadeIn delay={0.2}>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Calendar className="h-3 w-3 mr-1" />
              {trialDaysLeft} días de prueba
            </Badge>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button asChild>
                <Link href="/dashboard/bots">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Bot
                </Link>
              </Button>
            </motion.div>
          </div>
        </ScrollFadeIn>
      </div>

      {/* Trial Progress */}
      <ScrollFadeIn delay={0.3}>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="h-5 w-5 mr-2 text-primary" />
              Prueba Gratuita Activa
            </CardTitle>
            <CardDescription>Aprovecha al máximo tus {trialDaysLeft} días restantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={((15 - trialDaysLeft) / 15) * 100} className="h-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Día {15 - trialDaysLeft} de 15</span>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/configuracion">Ver Planes</Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </ScrollFadeIn>

      {/* Stats Grid */}
      <ScrollStaggeredChildren className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ScrollStaggerChild>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ScrollScaleIn delay={0.5}>
                <div className="text-2xl font-bold">{stats.totalClients}</div>
              </ScrollScaleIn>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>
        </ScrollStaggerChild>

        <ScrollStaggerChild>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bots Activos</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ScrollScaleIn delay={0.6}>
                <div className="text-2xl font-bold">{stats.activeBots}</div>
              </ScrollScaleIn>
              <p className="text-xs text-muted-foreground">de 1 disponible en tu plan</p>
            </CardContent>
          </Card>
        </ScrollStaggerChild>

        <ScrollStaggerChild>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensajes del Mes</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ScrollScaleIn delay={0.7}>
                <div className="text-2xl font-bold">{stats.monthlyMessages}</div>
              </ScrollScaleIn>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>
        </ScrollStaggerChild>

        <ScrollStaggerChild>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ScrollScaleIn delay={0.8}>
                <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              </ScrollScaleIn>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>
        </ScrollStaggerChild>
      </ScrollStaggeredChildren>

      {/* Quick Actions */}
      <ScrollStaggeredChildren className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ScrollStaggerChild>
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-primary" />
                  Configurar Bot
                </CardTitle>
                <CardDescription>Crea y personaliza tu primer chatbot con IA</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button asChild className="w-full">
                    <Link href="/dashboard/bots">Comenzar</Link>
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
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  Gestionar Clientes
                </CardTitle>
                <CardDescription>Añade y organiza tu base de clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/dashboard/clientes">Ver Clientes</Link>
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
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-primary" />
                  Automatizaciones
                </CardTitle>
                <CardDescription>Configura campañas automáticas de marketing</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/dashboard/automatizaciones">Configurar</Link>
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </ScrollStaggerChild>
      </ScrollStaggeredChildren>

      {/* Getting Started Checklist */}
      <ScrollFadeIn delay={0.4}>
        <Card>
          <CardHeader>
            <CardTitle>Primeros Pasos</CardTitle>
            <CardDescription>Completa estos pasos para aprovechar al máximo tu chatbot</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollStaggeredChildren className="space-y-4">
              <ScrollStaggerChild>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-muted rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Completar información del negocio</span>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/dashboard/negocio">Completar</Link>
                    </Button>
                  </motion.div>
                </div>
              </ScrollStaggerChild>
              <ScrollStaggerChild>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-muted rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Configurar tu primer bot</span>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/dashboard/bots">Configurar</Link>
                    </Button>
                  </motion.div>
                </div>
              </ScrollStaggerChild>
              <ScrollStaggerChild>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-muted rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Añadir tus primeros clientes</span>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/dashboard/clientes">Añadir</Link>
                    </Button>
                  </motion.div>
                </div>
              </ScrollStaggerChild>
              <ScrollStaggerChild>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-muted rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Probar tu bot</span>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/dashboard/prueba-bot">Probar</Link>
                    </Button>
                  </motion.div>
                </div>
              </ScrollStaggerChild>
            </ScrollStaggeredChildren>
          </CardContent>
        </Card>
      </ScrollFadeIn>
    </div>
  )
}
