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
} from "lucide-react"
import { ScrollFadeIn, ScrollSlideUp, ScrollStaggeredChildren, ScrollStaggerChild, ScrollScaleIn } from "@/components/ui/scroll-animations"
import { motion } from "framer-motion"

interface Automation {
  id: string
  name: string
  trigger_type: "birthday" | "inactive_client" | "new_promotion"
  trigger_config: Record<string, any>
  message_template: string
  is_active: boolean
  created_at: string
}

interface AutomationsManagementProps {
  initialAutomations: Automation[]
  userId: string
}

const triggerTypes = {
  birthday: {
    label: "Cumpleaños",
    icon: Calendar,
    description: "Envía mensajes antes del cumpleaños del cliente",
    color: "bg-blue-500",
  },
  inactive_client: {
    label: "Cliente Inactivo",
    icon: UserX,
    description: "Reactiva clientes que no han comprado en un tiempo",
    color: "bg-orange-500",
  },
  new_promotion: {
    label: "Nueva Promoción",
    icon: Gift,
    description: "Notifica sobre nuevas promociones disponibles",
    color: "bg-green-500",
  },
}

export function AutomationsManagement({ initialAutomations, userId }: AutomationsManagementProps) {
  const [automations, setAutomations] = useState<Automation[]>(initialAutomations)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const [userSubscription, setUserSubscription] = useState<any>(null)
  const [canCreateAutomation, setCanCreateAutomation] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    trigger_type: "" as "birthday" | "inactive_client" | "new_promotion" | "",
    trigger_config: {} as Record<string, any>,
    message_template: "",
    is_active: true,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      trigger_type: "",
      trigger_config: {},
      message_template: "",
      is_active: true,
    })
  }

  useEffect(() => {
    fetchUserSubscription()
  }, [userId])

  useEffect(() => {
    checkAutomationLimits()
  }, [automations, userSubscription])

  const fetchUserSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("subscription_status, plan_type, max_bots, max_automations")
        .eq("id", userId)
        .single()

      if (error) throw error
      setUserSubscription(data)
    } catch (error) {
      console.error("Error fetching subscription:", error)
    }
  }

  const checkAutomationLimits = () => {
    if (!userSubscription) return

    const maxAutomations = userSubscription.max_automations || 0
    setCanCreateAutomation(automations.length < maxAutomations)
  }

  const handleCreateAutomation = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canCreateAutomation) {
      toast.error("Límite de automatizaciones alcanzado", {
        description: `Has alcanzado el límite de ${userSubscription?.max_automations || 0} automatización(es) para tu plan. Actualiza tu suscripción para crear más.`,
        duration: 4000,
      })
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("automations")
        .insert([
          {
            ...formData,
            user_id: userId,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setAutomations([data, ...automations])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success(`Automatización "${formData.name}" creada`, {
        description: "La automatización ha sido creada exitosamente y está lista para usar.",
        duration: 4000,
      })
    } catch (error) {
      toast.error("Error al crear automatización", {
        description: "No se pudo crear la automatización. Verifica los datos e inténtalo de nuevo.",
        duration: 4000,
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
        .select()
        .single()

      if (error) throw error

      setAutomations(automations.map((automation) => (automation.id === selectedAutomation.id ? data : automation)))
      setIsEditDialogOpen(false)
      setSelectedAutomation(null)
      resetForm()
      toast.success(`Automatización "${formData.name}" actualizada`, {
        description: "Los cambios en la automatización han sido guardados correctamente.",
        duration: 4000,
      })
    } catch (error) {
      toast.error("Error al actualizar automatización", {
        description: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAutomation = async (automationId: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from("automations").update({ is_active: isActive }).eq("id", automationId)

      if (error) throw error

      setAutomations(
        automations.map((automation) =>
          automation.id === automationId ? { ...automation, is_active: isActive } : automation,
        ),
      )
      const automation = automations.find(a => a.id === automationId);
      toast.success(`Automatización ${isActive ? 'activada' : 'desactivada'}`, {
        description: `"${automation?.name || 'La automatización'}" ha sido ${isActive ? "activada" : "desactivada"} exitosamente.`,
        duration: 4000,
      })
    } catch (error) {
      toast.error("Error al cambiar estado", {
        description: "No se pudo cambiar el estado de la automatización. Inténtalo de nuevo.",
        duration: 4000,
      })
    }
  }

  const handleDeleteAutomation = async (automationId: string) => {
    try {
      const { error } = await supabase.from("automations").delete().eq("id", automationId)

      if (error) throw error

      setAutomations(automations.filter((automation) => automation.id !== automationId))
      const automation = automations.find(a => a.id === automationId);
      toast.success("Automatización eliminada", {
        description: `"${automation?.name || 'La automatización'}" ha sido eliminada permanentemente.`,
        duration: 4000,
      })
    } catch (error) {
      toast.error("Error al eliminar automatización", {
        description: "No se pudo eliminar la automatización. Inténtalo de nuevo.",
        duration: 4000,
      })
    }
  }

  const openEditDialog = (automation: Automation) => {
    setSelectedAutomation(automation)
    setFormData({
      name: automation.name,
      trigger_type: automation.trigger_type,
      trigger_config: automation.trigger_config,
      message_template: automation.message_template,
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

  const renderTriggerConfig = () => {
    switch (formData.trigger_type) {
      case "birthday":
        return (
          <div className="grid gap-2">
            <Label htmlFor="days_before">Días antes del cumpleaños</Label>
            <Input
              id="days_before"
              type="number"
              min="1"
              max="30"
              value={formData.trigger_config.days_before || 7}
              onChange={(e) => handleTriggerConfigChange("days_before", Number.parseInt(e.target.value) || 7)}
            />
            <p className="text-xs text-muted-foreground">Cuántos días antes del cumpleaños enviar el mensaje</p>
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
            <p className="text-xs text-muted-foreground">Días sin compras para considerar cliente inactivo</p>
          </div>
        )
      case "new_promotion":
        return (
          <div className="grid gap-2">
            <Label htmlFor="send_immediately">Envío inmediato</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="send_immediately"
                checked={formData.trigger_config.send_immediately || false}
                onCheckedChange={(checked) => handleTriggerConfigChange("send_immediately", checked)}
              />
              <Label htmlFor="send_immediately" className="text-sm">
                Enviar inmediatamente cuando se cree una promoción
              </Label>
            </div>
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
