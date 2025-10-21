"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Plus,
  Zap,
  Calendar,
  UserX,
  Gift,
  Play,
  Pause,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  MessageSquare,
  Bot,
  ShoppingCart,
  CalendarDays,
  Activity,
  TrendingUp,
  Send,
} from "lucide-react"
import { ScrollFadeIn, ScrollSlideUp, ScrollStaggeredChildren, ScrollStaggerChild, ScrollScaleIn } from "@/components/ui/scroll-animations"
import { motion } from "framer-motion"

interface Automation {
  id: string
  name: string
  trigger_type: "birthday" | "inactive_client" | "new_promotion" | "welcome" | "new_order" | "order_ready" | "reservation_reminder"
  trigger_config: Record<string, any>
  message_template: string
  template_id?: string
  template_variables?: Record<string, any>
  bot_id: string
  is_active: boolean
  created_at: string
  bots?: {
    id: string
    name: string
    platform: string
  }
}

interface Bot {
  id: string
  name: string
  platform: string
}

interface SystemTemplate {
  id: string
  template_key: string
  name: string
  description: string
  body_content: string
  variables_used: string[]
  automation_types: string[]
}

interface MessageTemplate {
  id: string
  template_name: string
  body_content: string
  status: string
  platform: string
}

interface AutomationStats {
  total_automations: number
  active_automations: number
  pending_messages: number
  sent_today: number
}

interface AutomationsManagementProps {
  initialAutomations: Automation[]
  userId: string
}

const triggerTypes = {
  birthday: {
    label: "Cumpleaños",
    icon: Calendar,
    description: "Envía mensajes automáticos en el cumpleaños del cliente",
    color: "bg-blue-500",
    category: "marketing"
  },
  inactive_client: {
    label: "Cliente Inactivo",
    icon: UserX,
    description: "Reactiva clientes que no han comprado en un tiempo",
    color: "bg-orange-500",
    category: "marketing"
  },
  new_promotion: {
    label: "Nueva Promoción",
    icon: Gift,
    description: "Notifica sobre nuevas promociones disponibles",
    color: "bg-green-500",
    category: "marketing"
  },
  welcome: {
    label: "Bienvenida",
    icon: Bot,
    description: "Mensaje automático para nuevos clientes",
    color: "bg-purple-500",
    category: "utility"
  },
  new_order: {
    label: "Nuevo Pedido",
    icon: ShoppingCart,
    description: "Confirmación automática de pedidos",
    color: "bg-indigo-500",
    category: "utility"
  },
  order_ready: {
    label: "Pedido Listo",
    icon: Send,
    description: "Notifica cuando el pedido está listo",
    color: "bg-cyan-500",
    category: "utility"
  },
  reservation_reminder: {
    label: "Recordatorio de Reserva",
    icon: CalendarDays,
    description: "Recordatorios automáticos de reservas",
    color: "bg-pink-500",
    category: "utility"
  },
}

export function AutomationsManagement({ initialAutomations, userId }: AutomationsManagementProps) {
  const [automations, setAutomations] = useState<Automation[]>(initialAutomations)
  const [bots, setBots] = useState<Bot[]>([])
  const [systemTemplates, setSystemTemplates] = useState<SystemTemplate[]>([])
  const [userTemplates, setUserTemplates] = useState<MessageTemplate[]>([])
  const [stats, setStats] = useState<AutomationStats>({
    total_automations: 0,
    active_automations: 0,
    pending_messages: 0,
    sent_today: 0
  })
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    trigger_type: "" as keyof typeof triggerTypes | "",
    trigger_config: {} as Record<string, any>,
    message_template: "",
    template_id: "",
    template_variables: {} as Record<string, any>,
    bot_id: "",
    is_active: true,
  })

  useEffect(() => {
    fetchBots()
    fetchSystemTemplates()
    fetchUserTemplates()
    fetchStats()
  }, [userId])

  useEffect(() => {
    updateStats()
  }, [automations])

  const fetchBots = async () => {
    try {
      const { data, error } = await supabase
        .from("bots")
        .select("id, name, platform")
        .eq("user_id", userId)
        .eq("is_active", true)

      if (error) throw error
      setBots(data || [])
    } catch (error) {
      console.error("Error fetching bots:", error)
    }
  }

  const fetchSystemTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("system_templates")
        .select("*")
        .order("is_popular", { ascending: false })
        .order("sort_order", { ascending: true })

      if (error) throw error
      setSystemTemplates(data || [])
    } catch (error) {
      console.error("Error fetching system templates:", error)
    }
  }

  const fetchUserTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("message_templates")
        .select("id, template_name, body_content, status, platform")
        .eq("user_id", userId)
        .eq("status", "approved")

      if (error) throw error
      setUserTemplates(data || [])
    } catch (error) {
      console.error("Error fetching user templates:", error)
    }
  }

  const fetchStats = async () => {
    try {
      // Obtener estadísticas básicas
      const { data: queueStats } = await fetch('/api/automations/process-queue', {
        method: 'GET'
      }).then(res => res.json()).catch(() => ({ by_status: {} }))

      const { data: logsToday, error: logsError } = await supabase
        .from("automation_logs")
        .select("id")
        .gte("created_at", new Date().toISOString().split('T')[0])
        .eq("success", true)

      setStats({
        total_automations: automations.length,
        active_automations: automations.filter(a => a.is_active).length,
        pending_messages: queueStats?.by_status?.pending || 0,
        sent_today: logsToday?.length || 0
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const updateStats = () => {
    setStats(prev => ({
      ...prev,
      total_automations: automations.length,
      active_automations: automations.filter(a => a.is_active).length
    }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      trigger_type: "",
      trigger_config: {},
      message_template: "",
      template_id: "",
      template_variables: {},
      bot_id: "",
      is_active: true,
    })
  }

  const handleCreateAutomation = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validaciones
      if (!formData.bot_id) {
        toast.error("Selecciona un bot")
        return
      }

      if (!formData.trigger_type) {
        toast.error("Selecciona un tipo de disparador")
        return
      }

      const { data, error } = await supabase
        .from("automations")
        .insert([
          {
            ...formData,
            user_id: userId,
          },
        ])
        .select(`
          *,
          bots!inner(id, name, platform)
        `)
        .single()

      if (error) throw error

      setAutomations([data, ...automations])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success(`Automatización "${formData.name}" creada`, {
        description: "La automatización ha sido creada exitosamente.",
      })
    } catch (error) {
      console.error("Error creating automation:", error)
      toast.error("Error al crear automatización", {
        description: "No se pudo crear la automatización. Inténtalo de nuevo.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditAutomation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAutomation) return

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("automations")
        .update(formData)
        .eq("id", selectedAutomation.id)
        .select(`
          *,
          bots!inner(id, name, platform)
        `)
        .single()

      if (error) throw error

      setAutomations(automations.map((automation) => 
        automation.id === selectedAutomation.id ? data : automation
      ))
      setIsEditDialogOpen(false)
      setSelectedAutomation(null)
      resetForm()
      toast.success(`Automatización "${formData.name}" actualizada`)
    } catch (error) {
      console.error("Error updating automation:", error)
      toast.error("Error al actualizar automatización")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAutomation = async (automationId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("automations")
        .update({ is_active: isActive })
        .eq("id", automationId)

      if (error) throw error

      setAutomations(
        automations.map((automation) =>
          automation.id === automationId ? { ...automation, is_active: isActive } : automation,
        ),
      )
      
      const automation = automations.find(a => a.id === automationId)
      toast.success(`Automatización ${isActive ? 'activada' : 'desactivada'}`, {
        description: `"${automation?.name}" ha sido ${isActive ? "activada" : "desactivada"}.`,
      })
    } catch (error) {
      console.error("Error toggling automation:", error)
      toast.error("Error al cambiar estado de la automatización")
    }
  }

  const handleDeleteAutomation = async (automationId: string) => {
    try {
      const { error } = await supabase
        .from("automations")
        .delete()
        .eq("id", automationId)

      if (error) throw error

      setAutomations(automations.filter((automation) => automation.id !== automationId))
      const automation = automations.find(a => a.id === automationId)
      toast.success("Automatización eliminada", {
        description: `"${automation?.name}" ha sido eliminada.`,
      })
    } catch (error) {
      console.error("Error deleting automation:", error)
      toast.error("Error al eliminar automatización")
    }
  }

  const openEditDialog = (automation: Automation) => {
    setSelectedAutomation(automation)
    setFormData({
      name: automation.name,
      trigger_type: automation.trigger_type,
      trigger_config: automation.trigger_config,
      message_template: automation.message_template,
      template_id: automation.template_id || "",
      template_variables: automation.template_variables || {},
      bot_id: automation.bot_id,
      is_active: automation.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const handleTriggerConfigChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      trigger_config: {
        ...formData.trigger_config,
        [key]: value,
      },
    })
  }

  const handleTemplateSelect = (templateId: string, isSystem = false) => {
    if (isSystem) {
      const template = systemTemplates.find(t => t.id === templateId)
      if (template) {
        setFormData({
          ...formData,
          message_template: template.body_content,
          template_id: "",
        })
      }
    } else {
      const template = userTemplates.find(t => t.id === templateId)
      if (template) {
        setFormData({
          ...formData,
          message_template: template.body_content,
          template_id: templateId,
        })
      }
    }
  }

  const renderTriggerConfig = () => {
    switch (formData.trigger_type) {
      case "birthday":
        return (
          <div className="grid gap-2">
            <Label htmlFor="days_before">Días antes del cumpleaños</Label>
            <Input
              id="days_before"
              type="number"
              min="0"
              max="30"
              value={formData.trigger_config.days_before || 0}
              onChange={(e) => handleTriggerConfigChange("days_before", Number.parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              0 = el día del cumpleaños, 1 = un día antes, etc.
            </p>
          </div>
        )
      case "inactive_client":
        return (
          <div className="grid gap-2">
            <Label htmlFor="inactive_days">Días de inactividad</Label>
            <Input
              id="inactive_days"
              type="number"
              min="1"
              max="365"
              value={formData.trigger_config.inactive_days || 30}
              onChange={(e) => handleTriggerConfigChange("inactive_days", Number.parseInt(e.target.value) || 30)}
            />
            <p className="text-xs text-muted-foreground">
              Días sin compras para considerar cliente inactivo
            </p>
          </div>
        )
      case "welcome":
        return (
          <div className="grid gap-2">
            <Label htmlFor="delay_minutes">Retraso (minutos)</Label>
            <Input
              id="delay_minutes"
              type="number"
              min="0"
              max="1440"
              value={formData.trigger_config.delay_minutes || 5}
              onChange={(e) => handleTriggerConfigChange("delay_minutes", Number.parseInt(e.target.value) || 5)}
            />
            <p className="text-xs text-muted-foreground">
              Minutos después del registro para enviar bienvenida
            </p>
          </div>
        )
      case "new_order":
      case "order_ready":
        return (
          <div className="grid gap-2">
            <Label htmlFor="send_immediately">Envío inmediato</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="send_immediately"
                checked={formData.trigger_config.send_immediately !== false}
                onCheckedChange={(checked) => handleTriggerConfigChange("send_immediately", checked)}
              />
              <Label htmlFor="send_immediately" className="text-sm">
                Enviar inmediatamente cuando cambie el estado
              </Label>
            </div>
          </div>
        )
      case "reservation_reminder":
        return (
          <div className="grid gap-2">
            <Label htmlFor="hours_before">Horas antes de la reserva</Label>
            <Input
              id="hours_before"
              type="number"
              min="1"
              max="168"
              value={formData.trigger_config.hours_before || 24}
              onChange={(e) => handleTriggerConfigChange("hours_before", Number.parseInt(e.target.value) || 24)}
            />
            <p className="text-xs text-muted-foreground">
              Horas antes de la reserva para enviar recordatorio
            </p>
          </div>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES")
  }

  const getMessagePreview = (template: string) => {
    return template.length > 100 ? template.substring(0, 100) + "..." : template
  }

  const getAvailableTemplates = () => {
    if (!formData.trigger_type) return []
    
    return systemTemplates.filter(template => 
      template.automation_types.includes(formData.trigger_type)
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <ScrollSlideUp>
          <div>
            <h1 className="text-3xl font-bold">Automatizaciones de Marketing</h1>
            <p className="text-muted-foreground">Crea campañas automáticas para mejorar la experiencia del cliente</p>
          </div>
        </ScrollSlideUp>
        <ScrollFadeIn delay={0.2}>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Automatización
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Automatización</DialogTitle>
                <DialogDescription>
                  Configura una campaña automática para mejorar la experiencia de tus clientes
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAutomation}>
                <div className="grid gap-6 py-4">
                  {/* Información Básica */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Información Básica</h4>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nombre de la Automatización *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ej: Mensaje de cumpleaños con descuento"
                          required
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="bot_id">Bot a utilizar *</Label>
                        <Select
                          value={formData.bot_id}
                          onValueChange={(value) => setFormData({ ...formData, bot_id: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un bot" />
                          </SelectTrigger>
                          <SelectContent>
                            {bots.map((bot) => (
                              <SelectItem key={bot.id} value={bot.id}>
                                <div className="flex items-center gap-2">
                                  <Bot className="h-4 w-4" />
                                  {bot.name} ({bot.platform})
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {bots.length === 0 && (
                          <p className="text-xs text-amber-600">
                            Necesitas crear al menos un bot para usar automatizaciones
                          </p>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="trigger_type">Tipo de Disparador *</Label>
                        <Select
                          value={formData.trigger_type}
                          onValueChange={(value) => setFormData({ 
                            ...formData, 
                            trigger_type: value as keyof typeof triggerTypes,
                            message_template: "" // Reset template when changing trigger
                          })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un disparador" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(triggerTypes).map(([key, config]) => {
                              const Icon = config.icon
                              return (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded ${config.color}`}>
                                      <Icon className="h-3 w-3 text-white" />
                                    </div>
                                    <div>
                                      <div className="font-medium">{config.label}</div>
                                      <div className="text-xs text-muted-foreground">{config.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Configuración del Disparador */}
                  {formData.trigger_type && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Configuración del Disparador</h4>
                      {renderTriggerConfig()}
                    </div>
                  )}

                  {/* Plantilla del Mensaje */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Plantilla del Mensaje</h4>
                    
                    {/* Plantillas Predefinidas */}
                    {getAvailableTemplates().length > 0 && (
                      <div className="grid gap-2">
                        <Label>Plantillas predefinidas (opcional)</Label>
                        <div className="grid gap-2 max-h-32 overflow-y-auto">
                          {getAvailableTemplates().map((template) => (
                            <div
                              key={template.id}
                              className="p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => handleTemplateSelect(template.id, true)}
                            >
                              <div className="font-medium text-sm">{template.name}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {getMessagePreview(template.body_content)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="message_template">Mensaje personalizado *</Label>
                      <Textarea
                        id="message_template"
                        value={formData.message_template}
                        onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                        placeholder="Escribe tu mensaje personalizado aquí..."
                        rows={4}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Puedes usar variables como {"{{client_name}}"}, {"{{business_name}}"}, etc.
                      </p>
                    </div>
                  </div>

                  {/* Activación */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Activar automatización inmediatamente</Label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading || bots.length === 0}>
                    {isLoading ? "Creando..." : "Crear Automatización"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </ScrollFadeIn>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="automations">Automatizaciones</TabsTrigger>
          <TabsTrigger value="analytics">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <ScrollStaggeredChildren className="grid gap-4 md:grid-cols-4">
            <ScrollStaggerChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_automations}</div>
                  <p className="text-xs text-muted-foreground">Automatizaciones</p>
                </CardContent>
              </Card>
            </ScrollStaggerChild>
            
            <ScrollStaggerChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Activas</CardTitle>
                  <Play className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.active_automations}</div>
                  <p className="text-xs text-muted-foreground">En funcionamiento</p>
                </CardContent>
              </Card>
            </ScrollStaggerChild>
            
            <ScrollStaggerChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pending_messages}</div>
                  <p className="text-xs text-muted-foreground">Mensajes en cola</p>
                </CardContent>
              </Card>
            </ScrollStaggerChild>
            
            <ScrollStaggerChild>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enviados Hoy</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.sent_today}</div>
                  <p className="text-xs text-muted-foreground">Mensajes enviados</p>
                </CardContent>
              </Card>
            </ScrollStaggerChild>
          </ScrollStaggeredChildren>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Automatización
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ver Cola de Mensajes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automatizaciones Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {automations.slice(0, 3).map((automation) => {
                  const config = triggerTypes[automation.trigger_type]
                  const Icon = config.icon
                  return (
                    <div key={automation.id} className="flex items-center gap-3 py-2">
                      <div className={`p-2 rounded-md ${config.color}`}>
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{automation.name}</p>
                        <p className="text-xs text-muted-foreground">{config.label}</p>
                      </div>
                      <Badge variant={automation.is_active ? "default" : "secondary"}>
                        {automation.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                  )
                })}
                {automations.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No hay automatizaciones creadas aún
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automations" className="space-y-6">
          {/* Automatizaciones Grid */}
          <ScrollStaggeredChildren className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {automations.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tienes automatizaciones aún</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Crea tu primera automatización para comenzar a mejorar la experiencia de tus clientes
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear primera automatización
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              automations.map((automation) => {
                const triggerConfig = triggerTypes[automation.trigger_type]
                const TriggerIcon = triggerConfig.icon
                return (
                  <ScrollStaggerChild key={automation.id}>
                    <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-md ${triggerConfig.color}`}>
                              <TriggerIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{automation.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{triggerConfig.label}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(automation)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleAutomation(automation.id, !automation.is_active)}
                              >
                                {automation.is_active ? (
                                  <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteAutomation(automation.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Estado</span>
                              <Badge variant={automation.is_active ? "default" : "secondary"}>
                                {automation.is_active ? "Activa" : "Inactiva"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Bot</span>
                              <span className="text-sm">{automation.bots?.name || "Sin bot"}</span>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Mensaje</span>
                              <p className="text-sm mt-1 line-clamp-2">{getMessagePreview(automation.message_template)}</p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Creada: {formatDate(automation.created_at)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </ScrollStaggerChild>
                )
              })
            )}
          </ScrollStaggeredChildren>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas Detalladas</CardTitle>
              <CardDescription>
                Próximamente: análisis completo del rendimiento de tus automatizaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Panel de análisis en desarrollo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Automatización</DialogTitle>
            <DialogDescription>Modifica la configuración de tu automatización</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditAutomation}>
            <div className="grid gap-6 py-4">
              {/* Similar form structure as create dialog */}
              <div className="grid gap-2">
                <Label htmlFor="edit_name">Nombre *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit_message_template">Mensaje *</Label>
                <Textarea
                  id="edit_message_template"
                  value={formData.message_template}
                  onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit_is_active">Automatización activa</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES")
  }

  const getMessagePreview = (template: string) => {
    return template.length > 100 ? template.substring(0, 100) + "..." : template
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <ScrollSlideUp>
          <div>
            <h1 className="text-3xl font-bold">Automatizaciones de Marketing</h1>
            <p className="text-muted-foreground">Crea campañas automáticas para fidelizar clientes</p>
            {userSubscription && (
              <p className="text-sm text-muted-foreground mt-1">
                {automations.length}/{userSubscription.max_automations} automatizaciones utilizadas en tu plan
              </p>
            )}
          </div>
        </ScrollSlideUp>
        <ScrollFadeIn delay={0.2}>
          <div className="flex items-center gap-2">
            {!canCreateAutomation && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                Límite alcanzado
              </Badge>
            )}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button disabled={!canCreateAutomation}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Automatización
                  </Button>
                </motion.div>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Automatización</DialogTitle>
                <DialogDescription>Configura una campaña automática de marketing</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAutomation}>
                <div className="grid gap-6 py-4">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Información Básica</h4>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nombre de la Automatización *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Felicitación de Cumpleaños"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="trigger_type">Tipo de Disparador *</Label>
                        <Select
                          value={formData.trigger_type}
                          onValueChange={(value: "birthday" | "inactive_client" | "new_promotion") =>
                            setFormData({ ...formData, trigger_type: value, trigger_config: {} })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un disparador" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(triggerTypes).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center space-x-2">
                                  <config.icon className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">{config.label}</div>
                                    <div className="text-xs text-muted-foreground">{config.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Trigger Configuration */}
                  {formData.trigger_type && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Configuración del Disparador</h4>
                      {renderTriggerConfig()}
                    </div>
                  )}

                  {/* Message Template */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Plantilla del Mensaje</h4>
                    <div className="grid gap-2">
                      <Label htmlFor="message_template">Mensaje *</Label>
                      <Textarea
                        id="message_template"
                        value={formData.message_template}
                        onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                        placeholder="¡Hola {nombre}! 🎉 Esperamos que tengas un cumpleaños increíble. Como regalo, tienes un 20% de descuento en tu próxima compra."
                        rows={4}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Usa {"{nombre}"} para personalizar con el nombre del cliente
                      </p>
                    </div>
                  </div>

                  {/* Activation */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Activar automatización inmediatamente</Label>
                  </div>
                </div>
                <DialogFooter>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button type="submit" disabled={isLoading || !canCreateAutomation}>
                      {isLoading ? "Creando..." : "Crear Automatización"}
                    </Button>
                  </motion.div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </ScrollFadeIn>
      </div>

      {!canCreateAutomation && (
        <ScrollFadeIn delay={0.3}>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Límite de automatizaciones alcanzado</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Has alcanzado el límite de {userSubscription?.max_automations || 0} automatización(es) para tu plan
                    actual. Actualiza tu suscripción para crear más automatizaciones.
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
              <CardTitle className="text-sm font-medium">Total Automatizaciones</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ScrollScaleIn delay={0.3}>
                <div className="text-2xl font-bold">{automations.length}</div>
              </ScrollScaleIn>
              <p className="text-xs text-muted-foreground">Campañas configuradas</p>
            </CardContent>
          </Card>
        </ScrollStaggerChild>

        <ScrollStaggerChild>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activas</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ScrollScaleIn delay={0.4}>
                <div className="text-2xl font-bold">{automations.filter((a) => a.is_active).length}</div>
              </ScrollScaleIn>
              <p className="text-xs text-muted-foreground">En funcionamiento</p>
            </CardContent>
          </Card>
        </ScrollStaggerChild>

        <ScrollStaggerChild>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensajes Enviados</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ScrollScaleIn delay={0.5}>
                <div className="text-2xl font-bold">0</div>
              </ScrollScaleIn>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>
        </ScrollStaggerChild>
      </ScrollStaggeredChildren>

      {/* Automations Grid */}
      <ScrollStaggeredChildren className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {automations.length === 0 ? (
          <ScrollStaggerChild>
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No tienes automatizaciones aún</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Crea tu primera automatización para comenzar a fidelizar clientes automáticamente
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button onClick={() => setIsCreateDialogOpen(true)} disabled={!canCreateAutomation}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear mi primera automatización
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </ScrollStaggerChild>
        ) : (
          automations.map((automation) => {
            const triggerConfig = triggerTypes[automation.trigger_type]
            const TriggerIcon = triggerConfig.icon
            return (
              <ScrollStaggerChild key={automation.id}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-md ${triggerConfig.color}`}>
                      <TriggerIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{automation.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{triggerConfig.label}</p>
                    </div>
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
                      <DropdownMenuItem onClick={() => openEditDialog(automation)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleAutomation(automation.id, !automation.is_active)}>
                        {automation.is_active ? (
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
                      <DropdownMenuItem
                        onClick={() => handleDeleteAutomation(automation.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={automation.is_active ? "default" : "secondary"}>
                      {automation.is_active ? "Activa" : "Inactiva"}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(automation.created_at)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Configuración:</span>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {automation.trigger_type === "birthday" &&
                          `${automation.trigger_config.days_before || 7} días antes`}
                        {automation.trigger_type === "inactive_client" &&
                          `${automation.trigger_config.inactive_days || 30} días inactivo`}
                        {automation.trigger_type === "new_promotion" &&
                          (automation.trigger_config.send_immediately ? "Envío inmediato" : "Envío programado")}
                      </div>
                    </div>

                    <div className="text-sm">
                      <span className="font-medium">Mensaje:</span>
                      <div className="mt-1 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        {getMessagePreview(automation.message_template)}
                      </div>
                    </div>
                  </div>
                  </CardContent>
                  </Card>
                </motion.div>
              </ScrollStaggerChild>
            )
          })
        )}
      </ScrollStaggeredChildren>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Automatización</DialogTitle>
            <DialogDescription>Actualiza la configuración de tu automatización</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditAutomation}>
            <div className="grid gap-6 py-4">
              {/* Same form fields as create dialog */}
              <div className="space-y-4">
                <h4 className="font-medium">Información Básica</h4>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Nombre de la Automatización *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-trigger_type">Tipo de Disparador *</Label>
                    <Select
                      value={formData.trigger_type}
                      onValueChange={(value: "birthday" | "inactive_client" | "new_promotion") =>
                        setFormData({ ...formData, trigger_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(triggerTypes).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center space-x-2">
                              <config.icon className="h-4 w-4" />
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {formData.trigger_type && (
                <div className="space-y-4">
                  <h4 className="font-medium">Configuración del Disparador</h4>
                  {renderTriggerConfig()}
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-medium">Plantilla del Mensaje</h4>
                <div className="grid gap-2">
                  <Label htmlFor="edit-message_template">Mensaje *</Label>
                  <Textarea
                    id="edit-message_template"
                    value={formData.message_template}
                    onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit-is_active">Automatización activa</Label>
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
                  {isLoading ? "Actualizando..." : "Actualizar Automatización"}
                </Button>
              </motion.div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
