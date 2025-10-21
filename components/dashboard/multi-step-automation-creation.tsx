"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Sparkles,
  Calendar,
  Clock,
  Target,
  MessageSquare,
  Zap,
  Bot,
  Loader2,
  Check,
  Gift,
  UserX,
  Settings,
  Eye,
  Send,
  Users,
} from "lucide-react"

interface AutomationFormData {
  name: string
  trigger_type: "birthday" | "inactive_client" | "new_promotion" | ""
  trigger_config: Record<string, any>
  message_template: string
  template_id?: string
  use_external_template: boolean
  bot_id: string
  is_active: boolean
}

interface MessageTemplate {
  id: string
  name: string
  platform: string
  body_text: string
  variables: string[]
  source: 'local_db' | 'meta_api' | 'sendgrid_api'
}

interface Bot {
  id: string
  name: string
  platform: "whatsapp" | "instagram" | "email"
  is_active: boolean
}

interface UserSubscription {
  subscription_status: string
  plan_type: string
  max_automations: number
}

interface MultiStepAutomationCreationProps {
  isOpen: boolean
  onClose: () => void
  onAutomationCreated: (automation: any) => void
  userId: string
}

const triggerTypes = {
  birthday: {
    icon: Calendar,
    label: "Cumpleaños de Clientes",
    description: "Envía felicitaciones automáticas",
    color: "bg-pink-500",
  },
  inactive_client: {
    icon: UserX,
    label: "Cliente Inactivo",
    description: "Reactiva clientes que no compran",
    color: "bg-orange-500",
  },
  new_promotion: {
    icon: Gift,
    label: "Nueva Promoción",
    description: "Notifica sobre ofertas especiales",
    color: "bg-purple-500",
  },
}

const steps = [
  { id: "basic", title: "Información Básica", description: "Configura los datos principales" },
  { id: "trigger", title: "Disparador", description: "Define cuándo se ejecuta" },
  { id: "message", title: "Mensaje", description: "Personaliza el contenido" },
  { id: "review", title: "Revisión", description: "Confirma la configuración" },
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

export function MultiStepAutomationCreation({ isOpen, onClose, onAutomationCreated, userId }: MultiStepAutomationCreationProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [bots, setBots] = useState<Bot[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null)
  const [currentAutomationCount, setCurrentAutomationCount] = useState(0)
  const [canCreateAutomation, setCanCreateAutomation] = useState(true)
  const supabase = createClient()

  const [formData, setFormData] = useState<AutomationFormData>({
    name: "",
    trigger_type: "",
    trigger_config: {},
    message_template: "",
    template_id: "",
    use_external_template: false,
    bot_id: "",
    is_active: true,
  })

  useEffect(() => {
    if (isOpen && userId) {
      // Resetear formulario cuando se abre el modal
      setFormData({
        name: "",
        trigger_type: "",
        trigger_config: {},
        message_template: "",
        template_id: "",
        use_external_template: false,
        bot_id: "",
        is_active: true,
      })
      setCurrentStep(1)
      setShowSuccess(false)
      
      fetchBots()
      fetchUserSubscription()
      checkAutomationLimits()
    }
  }, [isOpen, userId])

  const fetchBots = async () => {
    try {
      const { data, error } = await supabase
        .from("bots")
        .select("id, name, platform, is_active")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("name")

      if (error) throw error
      setBots(data || [])
    } catch (error) {
      console.error("Error fetching bots:", error)
      setBots([])
    }
  }

  const fetchUserSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("subscription_status, plan_type")
        .eq("id", userId)
        .single()

      if (error) {
        console.log("[v0] Subscription columns not found, using trial defaults:", error.message)
        setUserSubscription({
          subscription_status: "trial",
          plan_type: "trial",
          max_automations: 0,
        })
        return
      }

      const planLimits = {
        trial: { max_automations: 0 },
        basic: { max_automations: 1 },
        premium: { max_automations: 10 },
        enterprise: { max_automations: -1 }, // unlimited
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
        max_automations: 0,
      })
    }
  }

  const checkAutomationLimits = async () => {
    try {
      const { data: automations, error } = await supabase
        .from("automations")
        .select("id")
        .eq("user_id", userId)

      if (error) throw error

      const automationCount = automations?.length || 0
      setCurrentAutomationCount(automationCount)

      const maxAutomations = userSubscription?.max_automations || 0
      setCanCreateAutomation(maxAutomations === -1 || automationCount < maxAutomations)
    } catch (error) {
      console.error("Error checking automation limits:", error)
      setCanCreateAutomation(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      trigger_type: "",
      trigger_config: {},
      message_template: "",
      template_id: "",
      use_external_template: false,
      bot_id: "",
      is_active: true,
    })
    setCurrentStep(1)
    setShowSuccess(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCreateAutomation = async () => {
    if (!canCreateAutomation) {
      toast.error("Límite de automatizaciones alcanzado", {
        description: `Has alcanzado el límite de ${userSubscription?.max_automations || 0} automatización(es) para tu plan. Actualiza tu suscripción.`,
        duration: 4000,
      })
      return
    }

    setIsLoading(true)

    try {
      const automationData = {
        ...formData,
        user_id: userId,
        created_at: new Date().toISOString(),
      }

      const { data: automation, error } = await supabase
        .from("automations")
        .insert([automationData])
        .select()
        .single()

      if (error) throw error

      setShowSuccess(true)

      setTimeout(() => {
        onAutomationCreated(automation)
        handleClose()
        
        toast.success(`Automatización "${automation.name}" creada exitosamente`, {
          description: "Tu automatización está configurada y lista para funcionar.",
          duration: 4000,
        })
      }, 3000)
    } catch (error) {
      console.error("Error creating automation:", error)
      toast.error("Error al crear automatización", {
        description: "No se pudo crear la automatización. Inténtalo de nuevo.",
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== "" && formData.bot_id !== ""
      case 2:
        return formData.trigger_type !== ""
      case 3:
        return formData.message_template.trim() !== ""
      case 4:
        return true
      default:
        return false
    }
  }

  const renderTriggerConfig = () => {
    if (!formData.trigger_type) return null

    switch (formData.trigger_type) {
      case "birthday":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="days_before" className="text-sm font-medium">
                Días antes del cumpleaños
              </Label>
              <Select
                value={formData.trigger_config.days_before?.toString() || "0"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    trigger_config: { ...formData.trigger_config, days_before: parseInt(value) },
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar días" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">El mismo día</SelectItem>
                  <SelectItem value="1">1 día antes</SelectItem>
                  <SelectItem value="3">3 días antes</SelectItem>
                  <SelectItem value="7">7 días antes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "inactive_client":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="inactive_days" className="text-sm font-medium">
                Días de inactividad
              </Label>
              <Select
                value={formData.trigger_config.inactive_days?.toString() || "30"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    trigger_config: { ...formData.trigger_config, inactive_days: parseInt(value) },
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar días" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 días</SelectItem>
                  <SelectItem value="30">30 días</SelectItem>
                  <SelectItem value="60">60 días</SelectItem>
                  <SelectItem value="90">90 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "new_promotion":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="send_immediately"
                checked={formData.trigger_config.send_immediately || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trigger_config: { ...formData.trigger_config, send_immediately: e.target.checked },
                  })
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="send_immediately" className="text-sm">
                Enviar inmediatamente al crear promoción
              </Label>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getPreviewData = () => {
    const triggerConfig = triggerTypes[formData.trigger_type as keyof typeof triggerTypes]
    const selectedBot = bots.find(b => b.id === formData.bot_id)
    
    return {
      triggerConfig,
      selectedBot,
      messagePreview: formData.message_template.replace('{nombre}', 'María'),
    }
  }

  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-6 h-6 text-yellow-500 animate-bounce" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-green-600">¡Automatización Creada!</h3>
              <p className="text-muted-foreground">Tu automatización está lista para funcionar</p>
            </div>
            <div className="w-full bg-green-100 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: "100%" }}></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-base sm:text-lg">Crear Nueva Automatización</span>
            </div>
            <Badge variant="secondary" className="text-xs sm:text-sm w-fit">
              Paso {currentStep} de {steps.length}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {steps[currentStep - 1]?.description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => {
              const stepNumber = index + 1
              const isActive = stepNumber === currentStep
              const isCompleted = stepNumber < currentStep

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center text-xs sm:text-sm font-medium transition-colors",
                    isActive ? "text-primary" : isCompleted ? "text-green-600" : "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-2 text-xs transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "bg-green-600 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : stepNumber}
                  </div>
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              )
            })}
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
              className="space-y-4 sm:space-y-6"
            >
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <motion.div variants={fadeInUp} className="space-y-4 sm:space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                        Información Básica
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Configura el nombre y selecciona el bot que ejecutará la automatización
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="automation-name" className="text-sm font-medium">
                          Nombre de la Automatización *
                        </Label>
                        <Input
                          id="automation-name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ej: Felicitación de Cumpleaños"
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bot-select" className="text-sm font-medium">
                          Seleccionar Bot *
                        </Label>
                        <Select 
                          value={formData.bot_id === "" ? undefined : formData.bot_id} 
                          onValueChange={(value) => {
                            // Solo actualizar si el valor no es el placeholder
                            if (value && value !== "no-bots-available") {
                              setFormData({ ...formData, bot_id: value })
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un bot activo" />
                          </SelectTrigger>
                          <SelectContent>
                            {bots.length === 0 ? (
                              <SelectItem value="no-bots-available" disabled>
                                No hay bots activos disponibles
                              </SelectItem>
                            ) : (
                              bots.map((bot) => (
                                <SelectItem key={bot.id} value={bot.id}>
                                  {bot.name} ({bot.platform})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {bots.length === 0 && (
                          <p className="text-xs text-amber-600">
                            Necesitas al menos un bot activo para crear automatizaciones.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 2: Trigger Configuration */}
              {currentStep === 2 && (
                <motion.div variants={fadeInUp} className="space-y-4 sm:space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                        Disparador de Automatización
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Elige cuándo se debe ejecutar esta automatización
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 sm:gap-4">
                        {Object.entries(triggerTypes).map(([key, config]) => {
                          const Icon = config.icon
                          const isSelected = formData.trigger_type === key

                          return (
                            <motion.div
                              key={key}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Card
                                className={cn(
                                  "cursor-pointer transition-all border-2",
                                  isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-muted hover:border-primary/50"
                                )}
                                onClick={() =>
                                  setFormData({ ...formData, trigger_type: key as any, trigger_config: {} })
                                }
                              >
                                <CardContent className="p-3 sm:p-4">
                                  <div className="flex items-center gap-3">
                                    <div className={cn("p-2 sm:p-3 rounded-lg text-white", config.color)}>
                                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium text-sm sm:text-base">{config.label}</h4>
                                      <p className="text-xs sm:text-sm text-muted-foreground">{config.description}</p>
                                    </div>
                                    {isSelected && (
                                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )
                        })}
                      </div>

                      {formData.trigger_type && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm sm:text-base">Configuración del Disparador</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {renderTriggerConfig()}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Message Template */}
              {currentStep === 3 && (
                <motion.div variants={fadeInUp} className="space-y-4 sm:space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                        Mensaje de la Automatización
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Personaliza el mensaje que se enviará a tus clientes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="message-template" className="text-sm font-medium">
                          Plantilla del Mensaje *
                        </Label>
                        <Textarea
                          id="message-template"
                          value={formData.message_template}
                          onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                          placeholder="¡Hola {nombre}! 🎉 Esperamos que tengas un cumpleaños increíble. Como regalo especial, tienes un 20% de descuento en tu próxima compra."
                          rows={5}
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Usa <code className="bg-muted px-1 rounded">{"{nombre}"}</code> para personalizar con el nombre del cliente
                        </p>
                      </div>

                      {/* Message Preview */}
                      {formData.message_template && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="bg-muted/50">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Vista Previa
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="bg-white p-3 rounded-lg border text-sm">
                                {formData.message_template.replace("{nombre}", "María")}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <motion.div variants={fadeInUp} className="space-y-4 sm:space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                        Revisión Final
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Verifica la configuración antes de crear la automatización
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        const { triggerConfig, selectedBot, messagePreview } = getPreviewData()
                        
                        return (
                          <>
                            <div className="grid gap-4 sm:gap-6">
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">Información General</h4>
                                <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-xs sm:text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Nombre:</span>
                                    <span className="font-medium">{formData.name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Bot:</span>
                                    <span className="font-medium">{selectedBot?.name}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">Disparador</h4>
                                <div className="bg-muted/50 p-3 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    {triggerConfig && (
                                      <>
                                        <div className={cn("p-2 rounded text-white", triggerConfig.color)}>
                                          <triggerConfig.icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                          <div className="font-medium text-sm">{triggerConfig.label}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {formData.trigger_type === "birthday" &&
                                              `${formData.trigger_config.days_before || 0} días antes`}
                                            {formData.trigger_type === "inactive_client" &&
                                              `Después de ${formData.trigger_config.inactive_days || 30} días`}
                                            {formData.trigger_type === "new_promotion" &&
                                              (formData.trigger_config.send_immediately ? "Envío inmediato" : "Envío programado")}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">Vista Previa del Mensaje</h4>
                                <div className="bg-white p-3 border rounded-lg text-sm">
                                  {messagePreview}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-4">
                              <Switch
                                id="is-active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                              />
                              <Label htmlFor="is-active" className="text-sm">
                                Activar automatización inmediatamente
                              </Label>
                            </div>
                          </>
                        )
                      })()}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 sm:pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="text-xs sm:text-sm"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Anterior
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="text-xs sm:text-sm"
              >
                Cancelar
              </Button>

              {currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="text-xs sm:text-sm"
                >
                  Siguiente
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreateAutomation}
                  disabled={isLoading || !isStepValid() || !canCreateAutomation}
                  className="text-xs sm:text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Crear Automatización
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}