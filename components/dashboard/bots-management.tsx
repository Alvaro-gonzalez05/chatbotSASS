"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { MultiStepBotCreation } from "./multi-step-bot-creation"
import {
  Plus,
  Bot,
  MessageSquare,
  Instagram,
  Mail,
  Play,
  Pause,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react"
import { ScrollFadeIn, ScrollSlideUp, ScrollStaggeredChildren, ScrollStaggerChild, ScrollScaleIn } from "@/components/ui/scroll-animations"
import { motion } from "framer-motion"

interface BotData {
  id: string
  name: string
  platform: "whatsapp" | "instagram" | "email"
  personality_prompt?: string
  features: string[]
  automations: string[]
  openai_api_key?: string
  is_active: boolean
  created_at: string
}

interface BotsManagementProps {
  initialBots: BotData[]
  userId: string
}

const platformIcons = {
  whatsapp: MessageSquare,
  instagram: Instagram,
  email: Mail,
}

const platformLabels = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  email: "Email",
}

const availableFeatures = [
  { id: "take_orders", label: "Tomar pedidos" },
  { id: "take_reservations", label: "Tomar reservas" },
  { id: "register_clients", label: "Registro de clientes" },
  { id: "loyalty_points", label: "Consulta de puntos de fidelización" },
  { id: "customer_support", label: "Soporte al cliente" },
  { id: "product_catalog", label: "Catálogo de productos" },
]

export function BotsManagement({ initialBots, userId }: BotsManagementProps) {
  const [bots, setBots] = useState<BotData[]>(initialBots)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedBot, setSelectedBot] = useState<BotData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const supabase = createClient()

  const [userSubscription, setUserSubscription] = useState<any>(null)
  const [canCreateBot, setCanCreateBot] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    platform: "" as "whatsapp" | "instagram" | "email" | "",
    personality_prompt: "",
    features: [] as string[],
    automations: [] as string[],
    openai_api_key: "",
    is_active: false,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      platform: "",
      personality_prompt: "",
      features: [],
      automations: [],
      openai_api_key: "",
      is_active: false,
    })
  }

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("bots")
        .insert([
          {
            ...formData,
            user_id: userId,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setBots([data, ...bots])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success("Bot creado exitosamente", {
        description: `${formData.name} ha sido configurado y está listo para usar.`,
        duration: 4000,
      })
    } catch (error) {
      toast.error("Error al crear bot", {
        description: "No se pudo crear el bot. Inténtalo de nuevo.",
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditBot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBot) return

    setIsLoading(true)

    try {
      const { data, error } = await supabase.from("bots").update(formData).eq("id", selectedBot.id).select().single()

      if (error) throw error

      setBots(bots.map((bot) => (bot.id === selectedBot.id ? data : bot)))
      setIsEditDialogOpen(false)
      setSelectedBot(null)
      resetForm()
      toast.success("Bot actualizado", {
        description: `La configuración de ${data.name} ha sido actualizada exitosamente.`,
        duration: 4000,
      })
    } catch (error) {
      toast.error("Error al actualizar bot", {
        description: "No se pudo actualizar el bot. Inténtalo de nuevo.",
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleBot = async (botId: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from("bots").update({ is_active: isActive }).eq("id", botId)

      if (error) throw error

      setBots(bots.map((bot) => (bot.id === botId ? { ...bot, is_active: isActive } : bot)))
      const botName = bots.find(b => b.id === botId)?.name || "Bot"
      if (isActive) {
        toast.success("Bot activado", {
          description: `${botName} está ahora activo y respondiendo mensajes.`,
          duration: 4000,
        })
      } else {
        toast.info("Bot desactivado", {
          description: `${botName} ha sido pausado y no responderá mensajes.`,
          duration: 4000,
        })
      }
    } catch (error) {
      toast.error("Error al cambiar estado", {
        description: "No se pudo cambiar el estado del bot.",
        duration: 4000,
      })
    }
  }

  const handleDeleteBot = async (botId: string) => {
    try {
      const { error } = await supabase.from("bots").delete().eq("id", botId)

      if (error) throw error

      setBots(bots.filter((bot) => bot.id !== botId))
      const botName = bots.find(b => b.id === botId)?.name || "Bot"
      toast.success("Bot eliminado", {
        description: `${botName} ha sido eliminado permanentemente.`,
        duration: 4000,
      })
    } catch (error) {
      toast.error("Error al eliminar bot", {
        description: "No se pudo eliminar el bot. Inténtalo de nuevo.",
        duration: 4000,
      })
    }
  }

  const openEditDialog = (bot: BotData) => {
    setSelectedBot(bot)
    setFormData({
      name: bot.name,
      platform: bot.platform,
      personality_prompt: bot.personality_prompt || "",
      features: bot.features || [],
      automations: bot.automations || [],
      openai_api_key: bot.openai_api_key || "",
      is_active: bot.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const handleFeatureChange = (featureId: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, features: [...formData.features, featureId] })
    } else {
      setFormData({ ...formData, features: formData.features.filter((f) => f !== featureId) })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES")
  }

  const handleBotCreated = (newBot: BotData) => {
    setBots([newBot, ...bots])
  }

  useEffect(() => {
    fetchUserSubscription()
  }, [userId])

  useEffect(() => {
    checkBotLimits()
  }, [bots, userSubscription])

  const fetchUserSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("subscription_status, plan_type, trial_end_date")
        .eq("id", userId)
        .single()

      if (error) {
        console.log("[v0] Subscription columns not found, using trial defaults:", error.message)
        setUserSubscription({
          subscription_status: "trial",
          plan_type: "trial",
          max_bots: 1,
          max_automations: 0,
        })
        return
      }

      const planLimits = {
        trial: { max_bots: 1, max_automations: 0 },
        basic: { max_bots: 1, max_automations: 1 },
        premium: { max_bots: 5, max_automations: 10 },
        enterprise: { max_bots: -1, max_automations: -1 }, // unlimited
      }

      const limits = planLimits[data.plan_type as keyof typeof planLimits] || planLimits.trial

      setUserSubscription({
        ...data,
        ...limits,
      })
    } catch (error) {
      console.error("Error fetching subscription:", error)
      setUserSubscription({
        subscription_status: "trial",
        plan_type: "trial",
        max_bots: 1,
        max_automations: 0,
      })
    }
  }

  const checkBotLimits = () => {
    if (!userSubscription) return

    const maxBots = userSubscription.max_bots || 1
    setCanCreateBot(bots.length < maxBots)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <ScrollSlideUp>
          <div>
            <h1 className="text-3xl font-bold">Configuración de Bots</h1>
            <p className="text-muted-foreground">Crea y gestiona tus chatbots con IA</p>
            {userSubscription && (
              <p className="text-sm text-muted-foreground mt-1">
                {bots.length}/{userSubscription.max_bots} bots utilizados en tu plan
              </p>
            )}
          </div>
        </ScrollSlideUp>
        <ScrollFadeIn delay={0.2}>
          <div className="flex items-center gap-2">
            {!canCreateBot && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                Límite alcanzado
              </Badge>
            )}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={() => setIsCreateDialogOpen(true)} disabled={!canCreateBot}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Bot
              </Button>
            </motion.div>
          </div>
        </ScrollFadeIn>
      </div>

      {!canCreateBot && (
        <ScrollFadeIn delay={0.3}>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Bot className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Límite de bots alcanzado</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Has alcanzado el límite de {userSubscription?.max_bots || 1} bot(s) para tu plan actual. Actualiza tu
                    suscripción para crear más bots.
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                      Ver Planes
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollFadeIn>
      )}

      {/* Stats */}
      <ScrollStaggeredChildren className="grid gap-4 md:grid-cols-3">
        <ScrollStaggerChild>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ScrollScaleIn delay={0.3}>
                <div className="text-2xl font-bold">{bots.length}</div>
              </ScrollScaleIn>
              <p className="text-xs text-muted-foreground">Bots configurados</p>
            </CardContent>
          </Card>
        </ScrollStaggerChild>

        <ScrollStaggerChild>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bots Activos</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ScrollScaleIn delay={0.4}>
                <div className="text-2xl font-bold">{bots.filter((bot) => bot.is_active).length}</div>
              </ScrollScaleIn>
              <p className="text-xs text-muted-foreground">En funcionamiento</p>
            </CardContent>
          </Card>
        </ScrollStaggerChild>

        <ScrollStaggerChild>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plataformas</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ScrollScaleIn delay={0.5}>
                <div className="text-2xl font-bold">{new Set(bots.map((bot) => bot.platform)).size}</div>
              </ScrollScaleIn>
              <p className="text-xs text-muted-foreground">Conectadas</p>
            </CardContent>
          </Card>
        </ScrollStaggerChild>
      </ScrollStaggeredChildren>

      {/* Bots Grid */}
      <ScrollStaggeredChildren className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bots.length === 0 ? (
          <ScrollStaggerChild>
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No tienes bots aún</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Crea tu primer chatbot para comenzar a automatizar la atención al cliente
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear mi primer bot
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </ScrollStaggerChild>
        ) : (
          bots.map((bot) => {
            const PlatformIcon = platformIcons[bot.platform]
            return (
              <ScrollStaggerChild key={bot.id}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <PlatformIcon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{bot.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(bot)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleBot(bot.id, !bot.is_active)}>
                        {bot.is_active ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Activar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteBot(bot.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={bot.is_active ? "default" : "secondary"}>
                      {bot.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                    <Badge variant="outline">{platformLabels[bot.platform]}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Funcionalidades:</span>
                      <div className="mt-1">
                        {bot.features.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {bot.features.slice(0, 2).map((featureId) => {
                              const feature = availableFeatures.find((f) => f.id === featureId)
                              return (
                                <Badge key={featureId} variant="outline" className="text-xs">
                                  {feature?.label}
                                </Badge>
                              )
                            })}
                            {bot.features.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{bot.features.length - 2} más
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sin funcionalidades</span>
                        )}
                      </div>
                    </div>

                    <div className="text-sm">
                      <span className="font-medium">IA:</span>
                      <span
                        className={`ml-2 text-xs ${bot.openai_api_key ? "text-green-600" : "text-muted-foreground"}`}
                      >
                        {bot.openai_api_key ? "Configurada" : "No configurada"}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">Creado el {formatDate(bot.created_at)}</div>
                  </div>
                  </CardContent>
                  </Card>
                </motion.div>
              </ScrollStaggerChild>
            )
          })
        )}
      </ScrollStaggeredChildren>

      {/* Multi-step Bot Creation Dialog */}
      <MultiStepBotCreation
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onBotCreated={handleBotCreated}
        userId={userId}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Bot</DialogTitle>
            <DialogDescription>Actualiza la configuración de tu chatbot</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditBot}>
            <div className="grid gap-6 py-4">
              {/* Same form fields as create dialog */}
              <div className="space-y-4">
                <h4 className="font-medium">Información Básica</h4>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Nombre del Bot *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-platform">Plataforma *</Label>
                    <Select
                      value={formData.platform}
                      onValueChange={(value: "whatsapp" | "instagram" | "email") =>
                        setFormData({ ...formData, platform: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Personalidad del Bot</h4>
                <div className="grid gap-2">
                  <Label htmlFor="edit-personality">Prompt de Personalidad</Label>
                  <Textarea
                    id="edit-personality"
                    value={formData.personality_prompt}
                    onChange={(e) => setFormData({ ...formData, personality_prompt: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Funcionalidades</h4>
                <div className="grid gap-3">
                  {availableFeatures.map((feature) => (
                    <div key={feature.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${feature.id}`}
                        checked={formData.features.includes(feature.id)}
                        onCheckedChange={(checked) => handleFeatureChange(feature.id, checked as boolean)}
                      />
                      <Label htmlFor={`edit-${feature.id}`} className="text-sm">
                        {feature.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Configuración de IA</h4>
                <div className="grid gap-2">
                  <Label htmlFor="edit-openai_key">API Key de OpenAI</Label>
                  <div className="relative">
                    <Input
                      id="edit-openai_key"
                      type={showApiKey ? "text" : "password"}
                      value={formData.openai_api_key}
                      onChange={(e) => setFormData({ ...formData, openai_api_key: e.target.value })}
                    />
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute right-0 top-0 h-full"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-full px-3"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit-is_active">Bot activo</Label>
              </div>
            </div>
            <DialogFooter>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Actualizando..." : "Actualizar Bot"}
                </Button>
              </motion.div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
