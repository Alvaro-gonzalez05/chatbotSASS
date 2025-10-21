"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  UserX,
  Gift,
  Bot,
  ShoppingCart,
  CalendarDays,
  Send,
  CheckCircle,
  Sparkles,
  MessageSquare,
  Clock,
  Users,
  Settings,
  Eye,
  Loader2,
} from "lucide-react"

interface Automation {
  id?: string
  name: string
  trigger_type: "birthday" | "inactive_client" | "new_promotion" | "welcome" | "new_order" | "order_ready" | "reservation_reminder"
  trigger_config: Record<string, any>
  template_id: string
  template_variables: Record<string, any>
  bot_id: string
  is_active: boolean
}

interface Bot {
  id: string
  name: string
  platform: string
}

interface MessageTemplate {
  id: string
  name: string
  status: "approved" | "pending" | "rejected"
  category: string
  language: string
  components: {
    type: string
    text?: string
    parameters?: Array<{ type: string; text?: string }>
  }[]
  headerType?: "text" | "image" | "video" | "document"
  headerText?: string
  bodyText: string
  footerText?: string
  buttonText?: string
  variables: string[]
}

interface MultiStepAutomationCreationProps {
  isOpen: boolean
  onClose: () => void
  onAutomationCreated: (automation: any) => void
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

const steps = [
  { id: "basic", title: "Información Básica", icon: Settings },
  { id: "template", title: "Plantilla de Mensaje", icon: MessageSquare },
  { id: "trigger", title: "Configuración de Disparador", icon: Clock },
  { id: "review", title: "Revisar y Confirmar", icon: Eye },
]

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
}

export function MultiStepAutomationCreation({ 
  isOpen, 
  onClose, 
  onAutomationCreated, 
  userId 
}: MultiStepAutomationCreationProps) {
  console.log("MultiStepAutomationCreation renderizado - isOpen:", isOpen);
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [bots, setBots] = useState<Bot[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [formData, setFormData] = useState<Automation>({
    name: "",
    trigger_type: "birthday",
    trigger_config: {},
    template_id: "",
    template_variables: {},
    bot_id: "",
    is_active: true,
  })

  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchBots()
      fetchTemplates()
    }
  }, [isOpen])

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
      toast.error("Error al cargar los bots")
    }
  }

  const fetchTemplates = async () => {
    try {
      // En un entorno real, esto obtendría las plantillas aprobadas de Meta Business API
      // Por ahora simulamos con plantillas del sistema
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "approved")

      if (error) throw error
      
      // Transformar las plantillas a nuestro formato
      const transformedTemplates: MessageTemplate[] = (data || []).map(template => ({
        id: template.id,
        name: template.template_name,
        status: template.status as "approved",
        category: template.category || "marketing",
        language: template.language || "es",
        components: JSON.parse(template.components || "[]"),
        bodyText: template.body_content,
        variables: JSON.parse(template.header_variables || "[]").concat(
          JSON.parse(template.body_variables || "[]")
        )
      }))

      setTemplates(transformedTemplates)
    } catch (error) {
      console.error("Error fetching templates:", error)
      toast.error("Error al cargar las plantillas")
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("automations")
        .insert({
          ...formData,
          user_id: userId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Automatización creada exitosamente")
      onAutomationCreated(data)
      onClose()
      resetForm()
    } catch (error) {
      console.error("Error creating automation:", error)
      toast.error("Error al crear la automatización")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      trigger_type: "birthday",
      trigger_config: {},
      template_id: "",
      template_variables: {},
      bot_id: "",
      is_active: true,
    })
    setCurrentStep(0)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return formData.name && formData.bot_id && formData.trigger_type
      case 1: // Template
        return formData.template_id
      case 2: // Trigger Config
        return true // Las validaciones específicas las haremos en cada render
      case 3: // Review
        return true
      default:
        return false
    }
  }

  const renderBasicInfo = () => (
    <motion.div
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configuremos los detalles básicos de tu automatización
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre de la Automatización *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Mensaje de cumpleaños con descuento"
          />
        </div>

        <div className="space-y-2">
          <Label>Bot a utilizar *</Label>
          <RadioGroup
            value={formData.bot_id}
            onValueChange={(value) => setFormData({ ...formData, bot_id: value })}
          >
            {bots.map((bot) => (
              <div key={bot.id} className="flex items-center space-x-2">
                <RadioGroupItem value={bot.id} id={bot.id} />
                <Label htmlFor={bot.id} className="flex items-center space-x-2 cursor-pointer">
                  <Bot className="h-4 w-4" />
                  <span>{bot.name}</span>
                  <Badge variant="outline">{bot.platform}</Badge>
                </Label>
              </div>
            ))}
          </RadioGroup>
          {bots.length === 0 && (
            <p className="text-sm text-amber-600">
              Necesitas crear al menos un bot para usar automatizaciones
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Tipo de Disparador *</Label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(triggerTypes).map(([key, config]) => {
              const Icon = config.icon
              return (
                <div
                  key={key}
                  className={cn(
                    "p-4 border-2 rounded-lg cursor-pointer transition-colors",
                    formData.trigger_type === key
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                  onClick={() => setFormData({ ...formData, trigger_type: key as any })}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-md ${config.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{config.label}</h4>
                      <p className="text-xs text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderTemplateSelection = () => {
    const availableTemplates = templates.filter(template => 
      formData.trigger_type && template.category === triggerTypes[formData.trigger_type].category
    )

    return (
      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="space-y-6"
      >
        <div>
          <h3 className="text-lg font-semibold mb-4">Plantilla de Mensaje</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Selecciona una plantilla aprobada por Meta para tu mensaje automático
          </p>
        </div>

        <div className="space-y-4">
          {availableTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-medium mb-2">No hay plantillas disponibles</h4>
                <p className="text-sm text-muted-foreground">
                  Necesitas crear y obtener aprobación para plantillas desde Meta Business Manager
                </p>
              </CardContent>
            </Card>
          ) : (
            <RadioGroup
              value={formData.template_id}
              onValueChange={(value) => {
                const template = availableTemplates.find(t => t.id === value)
                setFormData({ 
                  ...formData, 
                  template_id: value,
                  template_variables: template ? 
                    template.variables.reduce((acc, variable) => ({ ...acc, [variable]: "" }), {}) : 
                    {}
                })
              }}
            >
              {availableTemplates.map((template) => (
                <div key={template.id} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={template.id} id={template.id} />
                    <Label htmlFor={template.id} className="cursor-pointer font-medium">
                      {template.name}
                    </Label>
                    <Badge variant={template.status === "approved" ? "default" : "secondary"}>
                      {template.status}
                    </Badge>
                  </div>
                  
                  {formData.template_id === template.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="ml-6 space-y-4"
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Vista previa del mensaje</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-muted/50 p-3 rounded-md text-sm">
                            {template.bodyText}
                          </div>
                        </CardContent>
                      </Card>

                      {template.variables.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Variables de personalización</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {template.variables.map((variable) => (
                              <div key={variable} className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  {variable}
                                </Label>
                                <Input
                                  placeholder={`Valor para ${variable}`}
                                  value={formData.template_variables[variable] || ""}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    template_variables: {
                                      ...formData.template_variables,
                                      [variable]: e.target.value
                                    }
                                  })}
                                />
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  )}
                </div>
              ))}
            </RadioGroup>
          )}
        </div>
      </motion.div>
    )
  }

  const renderTriggerConfig = () => (
    <motion.div
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold mb-4">Configuración del Disparador</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configura cuándo y cómo se activará tu automatización
        </p>
      </div>

      <div className="space-y-4">
        {formData.trigger_type === "birthday" && (
          <div className="space-y-2">
            <Label>Días antes del cumpleaños para enviar mensaje</Label>
            <Select
              value={formData.trigger_config.days_before?.toString() || "0"}
              onValueChange={(value) => setFormData({
                ...formData,
                trigger_config: { ...formData.trigger_config, days_before: parseInt(value) }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">El mismo día</SelectItem>
                <SelectItem value="1">1 día antes</SelectItem>
                <SelectItem value="7">1 semana antes</SelectItem>
                <SelectItem value="30">1 mes antes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.trigger_type === "inactive_client" && (
          <div className="space-y-2">
            <Label>Días de inactividad para considerar cliente inactivo</Label>
            <Select
              value={formData.trigger_config.inactive_days?.toString() || "30"}
              onValueChange={(value) => setFormData({
                ...formData,
                trigger_config: { ...formData.trigger_config, inactive_days: parseInt(value) }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 días</SelectItem>
                <SelectItem value="60">60 días</SelectItem>
                <SelectItem value="90">90 días</SelectItem>
                <SelectItem value="180">6 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.trigger_type === "new_promotion" && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="send_immediately"
                checked={formData.trigger_config.send_immediately || false}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  trigger_config: { ...formData.trigger_config, send_immediately: checked }
                })}
              />
              <Label htmlFor="send_immediately">Enviar inmediatamente cuando se cree una promoción</Label>
            </div>
            
            {!formData.trigger_config.send_immediately && (
              <div className="space-y-2">
                <Label>Retraso antes del envío (horas)</Label>
                <Input
                  type="number"
                  min="1"
                  max="168"
                  value={formData.trigger_config.delay_hours || 24}
                  onChange={(e) => setFormData({
                    ...formData,
                    trigger_config: { ...formData.trigger_config, delay_hours: parseInt(e.target.value) }
                  })}
                />
              </div>
            )}
          </div>
        )}

        {(formData.trigger_type === "new_order" || formData.trigger_type === "order_ready") && (
          <div className="space-y-2">
            <Label>Retraso antes del envío (minutos)</Label>
            <Select
              value={formData.trigger_config.delay_minutes?.toString() || "5"}
              onValueChange={(value) => setFormData({
                ...formData,
                trigger_config: { ...formData.trigger_config, delay_minutes: parseInt(value) }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Inmediato</SelectItem>
                <SelectItem value="5">5 minutos</SelectItem>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.trigger_type === "reservation_reminder" && (
          <div className="space-y-2">
            <Label>Horas antes de la reserva para enviar recordatorio</Label>
            <Select
              value={formData.trigger_config.hours_before?.toString() || "24"}
              onValueChange={(value) => setFormData({
                ...formData,
                trigger_config: { ...formData.trigger_config, hours_before: parseInt(value) }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 horas antes</SelectItem>
                <SelectItem value="6">6 horas antes</SelectItem>
                <SelectItem value="24">24 horas antes</SelectItem>
                <SelectItem value="48">48 horas antes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Activar automatización inmediatamente</Label>
        </div>
      </div>
    </motion.div>
  )

  const renderReview = () => {
    const selectedTemplate = templates.find(t => t.id === formData.template_id)
    const selectedBot = bots.find(b => b.id === formData.bot_id)
    const triggerConfig = triggerTypes[formData.trigger_type]

    return (
      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="space-y-6"
      >
        <div>
          <h3 className="text-lg font-semibold mb-4">Revisar y Confirmar</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Revisa todos los detalles antes de crear tu automatización
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Nombre:</span>
                <span className="text-sm">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Bot:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{selectedBot?.name}</span>
                  <Badge variant="outline">{selectedBot?.platform}</Badge>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Disparador:</span>
                <div className="flex items-center space-x-2">
                  <triggerConfig.icon className="h-4 w-4" />
                  <span className="text-sm">{triggerConfig.label}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Estado:</span>
                <Badge variant={formData.is_active ? "default" : "secondary"}>
                  {formData.is_active ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plantilla de Mensaje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Plantilla:</span>
                  <span className="text-sm">{selectedTemplate?.name}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Mensaje:</span>
                  <div className="mt-1 p-3 bg-muted/50 rounded-md text-sm">
                    {selectedTemplate?.bodyText}
                  </div>
                </div>
                {Object.keys(formData.template_variables).length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Variables:</span>
                    <div className="mt-1 space-y-1">
                      {Object.entries(formData.template_variables).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{key}:</span>
                          <span>{value || "(automático)"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuración del Disparador</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {formData.trigger_type === "birthday" && (
                  <p>Enviará el mensaje {formData.trigger_config.days_before === 0 ? "el mismo día" : `${formData.trigger_config.days_before} días antes`} del cumpleaños</p>
                )}
                {formData.trigger_type === "inactive_client" && (
                  <p>Se activará cuando un cliente esté inactivo por {formData.trigger_config.inactive_days} días</p>
                )}
                {formData.trigger_type === "new_promotion" && (
                  <p>{formData.trigger_config.send_immediately ? "Enviará inmediatamente" : `Enviará después de ${formData.trigger_config.delay_hours} horas`} cuando se cree una promoción</p>
                )}
                {(formData.trigger_type === "new_order" || formData.trigger_type === "order_ready") && (
                  <p>Enviará {formData.trigger_config.delay_minutes === 0 ? "inmediatamente" : `después de ${formData.trigger_config.delay_minutes} minutos`}</p>
                )}
                {formData.trigger_type === "reservation_reminder" && (
                  <p>Enviará recordatorio {formData.trigger_config.hours_before} horas antes de la reserva</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    )
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo()
      case 1:
        return renderTemplateSelection()
      case 2:
        return renderTriggerConfig()
      case 3:
        return renderReview()
      default:
        return null
    }
  }

  console.log("Dialog props - isOpen:", isOpen);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>Crear Nueva Automatización</span>
          </DialogTitle>
          <DialogDescription>
            Configura una automatización en {steps.length} pasos simples
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            return (
              <div key={step.id} className="flex items-center">
                <motion.div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    index <= currentStep
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}
                  animate={{
                    scale: index === currentStep ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {index < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </motion.div>
                <div className="ml-2 hidden sm:block">
                  <p className={cn(
                    "text-sm font-medium",
                    index <= currentStep ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-16 h-px mx-4",
                    index < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                  )} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px] overflow-y-auto">
          <AnimatePresence mode="wait">
            {renderCurrentStep()}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="flex items-center space-x-2">
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Automatización
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}