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
  template_source: "meta_api" | "local_db" | "create_new" | ""
  selected_template?: MessageTemplate | null
  custom_template?: {
    subject?: string
    body_content: string
    html_content?: string
    variables?: string[]
  }
  bot_id: string
  promotion_id?: string
  is_active: boolean
}

interface MessageTemplate {
  id: string
  name: string
  platform: string
  body_content: string
  subject?: string
  html_content?: string
  variables: string[]
  status: string
  can_use: boolean
  source: 'local_db' | 'meta_api' | 'create_new'
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

interface Promotion {
  id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  is_active: boolean
  image_url?: string
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
  { id: "promotion", title: "Promoción", description: "Vincula una promoción (opcional)" },
  { id: "template", title: "Plantilla", description: "Selecciona o crea el mensaje" },
  { id: "message", title: "Personalización", description: "Ajusta variables del mensaje" },
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
  const [selectedBotPlatform, setSelectedBotPlatform] = useState<string>("")
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loadingPromotions, setLoadingPromotions] = useState(false)
  const [canCreateCustomTemplate, setCanCreateCustomTemplate] = useState(false)
  const [showCustomTemplateForm, setShowCustomTemplateForm] = useState(false)
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
    template_source: "",
    selected_template: null,
    custom_template: {
      body_content: "",
      variables: []
    },
    bot_id: "",
    promotion_id: "",
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
        template_source: "",
        selected_template: null,
        custom_template: {
          body_content: "",
          variables: []
        },
        bot_id: "",
        promotion_id: "",
        is_active: true,
      })
      setCurrentStep(1)
      setShowSuccess(false)
      
      fetchBots()
      fetchPromotions()
      fetchUserSubscription()
      checkAutomationLimits()
    }
  }, [isOpen, userId])

  // Cargar plantillas cuando cambia el bot seleccionado
  useEffect(() => {
    if (formData.bot_id && bots.length > 0) {
      fetchTemplatesForBot(formData.bot_id)
    }
  }, [formData.bot_id, bots])

  // Actualizar el mensaje inicial cuando se selecciona una plantilla
  useEffect(() => {
    if (formData.template_source === "create_new" && formData.custom_template?.body_content) {
      // Para plantillas personalizadas, usar el contenido como base
      setFormData(prev => ({
        ...prev,
        message_template: prev.message_template || formData.custom_template?.body_content || ""
      }))
    } else if (formData.selected_template && formData.template_source !== "create_new") {
      // Para plantillas existentes, limpiar personalización adicional
      setFormData(prev => ({
        ...prev,
        message_template: ""
      }))
    }
  }, [formData.selected_template, formData.template_source, formData.custom_template])

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

  const fetchPromotions = async () => {
    try {
      setLoadingPromotions(true)
      const { data, error } = await supabase
        .from("promotions")
        .select("id, name, description, start_date, end_date, is_active, image_url")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPromotions(data || [])
    } catch (error) {
      console.error("Error fetching promotions:", error)
      setPromotions([])
    } finally {
      setLoadingPromotions(false)
    }
  }

  // Cargar plantillas cuando se selecciona un bot
  // Crear plantilla personalizada de email
  const createCustomTemplate = async (customTemplate: any, botId: string) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bot_id: botId,
          platform: 'email',
          name: `Plantilla_${formData.name}_${Date.now()}`,
          subject: customTemplate.subject,
          body_content: customTemplate.body_content,
          html_content: customTemplate.html_content,
          variables: customTemplate.variables || []
        })
      })

      if (!response.ok) throw new Error('Failed to create template')

      const data = await response.json()
      if (data.success) {
        return data.template.id
      }
      throw new Error('Template creation failed')
    } catch (error) {
      console.error('Error creating custom template:', error)
      throw error
    }
  }

  /* 
   * ESTRUCTURA ESPERADA DE INTEGRATIONS JSONB EN LA TABLA BOTS:
   * 
   * Para WhatsApp:
   * {
   *   "access_token": "EAAjYLYimS1EBPucE3...",
   *   "phone_number_id": "793528520499781",
   *   "business_account_id": "1222850426258356",
   *   "webhook_url": "http://localhost:3000/api/whatsapp/webhook",
   *   "webhook_verify_token": "verify_f3edab4d-a751-4049-a815-1152330bc7dd_1761098514862"
   * }
   *
   * Para Instagram:
   * {
   *   "access_token": "EAAjYLYimS1EBPucE3...",
   *   "instagram_business_account_id": "17841405309211844",
   *   "app_id": "23849583679124",
   *   "app_secret": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
   *   "business_account_id": "1222850426258356", // Opcional, para templates si está conectado a WhatsApp Business
   *   "webhook_url": "http://localhost:3000/api/instagram/webhook",
   *   "webhook_verify_token": "verify_instagram_f3edab4d..."
   * }
   *
   * Para Email:
   * {
   *   "provider": "sendgrid", // o "mailgun", "ses", "smtp"
   *   "api_key": "SG.xyz123...",
   *   "from_email": "noreply@tudominio.com",
   *   "from_name": "Tu Negocio"
   * }
   */
  
  const fetchTemplatesForBot = async (botId: string) => {
    if (!botId) return

    setLoadingTemplates(true)
    try {
      const selectedBot = bots.find(b => b.id === botId)
      if (!selectedBot) return

      setSelectedBotPlatform(selectedBot.platform)
      setCanCreateCustomTemplate(selectedBot.platform === 'email')

      const response = await fetch(`/api/templates?bot_id=${botId}&platform=${selectedBot.platform}`)
      if (!response.ok) throw new Error('Failed to fetch templates')

      const data = await response.json()
      if (data.success) {
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Error al cargar plantillas')
    } finally {
      setLoadingTemplates(false)
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
      template_source: "",
      selected_template: null,
      custom_template: {
        body_content: "",
        variables: []
      },
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
      let templateId = formData.template_id
      
      // Si es una plantilla personalizada de email, crearla primero
      if (formData.template_source === "create_new" && formData.custom_template && selectedBotPlatform === 'email') {
        try {
          templateId = await createCustomTemplate(formData.custom_template, formData.bot_id)
        } catch (error) {
          throw new Error("No se pudo crear la plantilla personalizada")
        }
      }

      // Generar el mensaje final basado en la plantilla y personalización
      let finalMessage = ""
      
      // Agregar personalización adicional si existe
      if (formData.message_template.trim()) {
        finalMessage += formData.message_template.trim() + "\n\n"
      }
      
      // Agregar contenido de la plantilla
      if (formData.template_source === "create_new" && formData.custom_template?.body_content) {
        finalMessage += formData.custom_template.body_content
      } else if (formData.selected_template?.body_content) {
        finalMessage += formData.selected_template.body_content
      }

      const automationData = {
        name: formData.name,
        trigger_type: formData.trigger_type,
        trigger_config: formData.trigger_config,
        message_template: finalMessage.trim(),
        template_id: templateId || formData.selected_template?.id,
        template_variables: {
          source: formData.template_source,
          original_template: formData.selected_template || formData.custom_template,
          customization: formData.message_template
        },
        bot_id: formData.bot_id,
        is_active: formData.is_active,
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
        description: error instanceof Error ? error.message : "No se pudo crear la automatización. Inténtalo de nuevo.",
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
        // Paso 3: Selección de promoción (opcional)
        return true // Siempre válido ya que la promoción es opcional
      case 4:
        // Paso 4: Selección de plantilla
        return formData.template_source !== "" && (
          formData.template_source === "create_new" ? 
            formData.custom_template?.body_content.trim() !== "" : 
            formData.selected_template !== null
        )
      case 5:
        // Paso 5: Personalización de mensaje
        return formData.message_template.trim() !== ""
      case 6:
        // Paso 6: Revisión final
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
    
    // Generar vista previa del mensaje final
    let finalMessage = ""
    
    // Agregar personalización adicional si existe
    if (formData.message_template.trim()) {
      finalMessage += formData.message_template.trim() + "\n\n"
    }
    
    // Agregar contenido de la plantilla
    if (formData.template_source === "create_new" && formData.custom_template?.body_content) {
      finalMessage += formData.custom_template.body_content
    } else if (formData.selected_template?.body_content) {
      finalMessage += formData.selected_template.body_content
    }
    
    // Reemplazar variables comunes para la vista previa
    const messagePreview = finalMessage
      .replace(/\{nombre\}/g, "María")
      .replace(/\{email\}/g, "maria@ejemplo.com")
      .replace(/\{\{1\}\}/g, "María")  // Meta templates
      .replace(/\{\{2\}\}/g, "20%")    // Meta templates
    
    return {
      triggerConfig,
      selectedBot,
      messagePreview: messagePreview.trim() || "No hay mensaje configurado",
      selectedTemplate: formData.selected_template || formData.custom_template,
      templateSource: formData.template_source
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

              {/* Step 3: Promotion Selection (Optional) */}
              {currentStep === 3 && (
                <motion.div variants={fadeInUp} className="space-y-4 sm:space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
                        Promoción (Opcional)
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Vincula una promoción específica con esta automatización. Esto es opcional.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <Label className="text-sm font-medium">Seleccionar Promoción</Label>
                        
                        {/* Option: No promotion */}
                        <div className="space-y-3">
                          <div
                            className={cn(
                              "p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
                              !formData.promotion_id 
                                ? "border-primary bg-primary/5" 
                                : "border-border hover:border-primary/50"
                            )}
                            onClick={() => setFormData({ ...formData, promotion_id: "" })}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                                <Settings className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">Sin promoción específica</h4>
                                <p className="text-xs text-muted-foreground">
                                  La automatización no estará vinculada a ninguna promoción
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Promotions grid */}
                          {loadingPromotions ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <span className="ml-2 text-sm text-muted-foreground">Cargando promociones...</span>
                            </div>
                          ) : promotions.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {promotions.map((promotion) => (
                                <div
                                  key={promotion.id}
                                  className={cn(
                                    "p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
                                    formData.promotion_id === promotion.id
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/50"
                                  )}
                                  onClick={() => setFormData({ ...formData, promotion_id: promotion.id })}
                                >
                                  <div className="space-y-2">
                                    {promotion.image_url && (
                                      <img 
                                        src={promotion.image_url} 
                                        alt={promotion.name}
                                        className="w-full h-24 object-cover rounded"
                                      />
                                    )}
                                    <h4 className="font-medium text-sm truncate">{promotion.name}</h4>
                                    {promotion.description && (
                                      <div className="text-xs text-muted-foreground line-clamp-2">
                                        {promotion.description}
                                      </div>
                                    )}
                                    <Badge 
                                      variant={promotion.is_active ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      {promotion.is_active ? "Activa" : "Inactiva"}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-sm text-muted-foreground">
                                No tienes promociones activas. Puedes crear la automatización sin vincular una promoción.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 4: Template Selection */}
              {currentStep === 4 && (
                <motion.div variants={fadeInUp} className="space-y-4 sm:space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                        Selección de Plantilla
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {selectedBotPlatform === 'email' 
                          ? 'Selecciona una plantilla existente o crea una personalizada'
                          : 'Selecciona una plantilla aprobada de Meta Business'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {loadingTemplates ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <span className="ml-2">Cargando plantillas...</span>
                        </div>
                      ) : (
                        <>
                          {/* Email: opción de crear plantilla personalizada */}
                          {canCreateCustomTemplate && (
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="create-new"
                                  name="template-source"
                                  value="create_new"
                                  checked={formData.template_source === "create_new"}
                                  onChange={(e) => {
                                    setFormData({ 
                                      ...formData, 
                                      template_source: e.target.value as "create_new",
                                      selected_template: null
                                    })
                                    setShowCustomTemplateForm(true)
                                  }}
                                />
                                <Label htmlFor="create-new" className="text-sm font-medium">
                                  Crear plantilla personalizada
                                </Label>
                              </div>
                              
                              {showCustomTemplateForm && formData.template_source === "create_new" && (
                                <Card className="bg-muted/50">
                                  <CardHeader>
                                    <CardTitle className="text-sm">Nueva Plantilla de Email</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div>
                                      <Label htmlFor="email-subject">Asunto del Email</Label>
                                      <Input
                                        id="email-subject"
                                        value={formData.custom_template?.subject || ""}
                                        onChange={(e) => setFormData({
                                          ...formData,
                                          custom_template: {
                                            ...formData.custom_template,
                                            subject: e.target.value,
                                            body_content: formData.custom_template?.body_content || "",
                                            variables: formData.custom_template?.variables || []
                                          }
                                        })}
                                        placeholder="Ej: ¡Feliz Cumpleaños {nombre}!"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="email-body">Contenido del Email</Label>
                                      <Textarea
                                        id="email-body"
                                        rows={6}
                                        value={formData.custom_template?.body_content || ""}
                                        onChange={(e) => setFormData({
                                          ...formData,
                                          custom_template: {
                                            ...formData.custom_template,
                                            subject: formData.custom_template?.subject || "",
                                            body_content: e.target.value,
                                            variables: formData.custom_template?.variables || []
                                          }
                                        })}
                                        placeholder="Hola {nombre}, ¡esperamos que tengas un cumpleaños increíble! Como regalo especial, tienes un 20% de descuento..."
                                      />
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Usa <code className="bg-muted px-1 rounded">{"{nombre}"}</code>, <code className="bg-muted px-1 rounded">{"{email}"}</code> para personalizar
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          )}

                          {/* Lista de plantillas existentes */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="existing-template"
                                name="template-source"
                                value={selectedBotPlatform === 'email' ? "local_db" : "meta_api"}
                                checked={formData.template_source === "local_db" || formData.template_source === "meta_api"}
                                onChange={(e) => {
                                  setFormData({ 
                                    ...formData, 
                                    template_source: e.target.value as any,
                                    custom_template: undefined
                                  })
                                  setShowCustomTemplateForm(false)
                                }}
                              />
                              <Label htmlFor="existing-template" className="text-sm font-medium">
                                {selectedBotPlatform === 'email' 
                                  ? 'Usar plantilla existente' 
                                  : 'Usar plantilla aprobada de Meta'
                                }
                              </Label>
                            </div>

                            {(formData.template_source === "local_db" || formData.template_source === "meta_api") && (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {templates.length === 0 ? (
                                  <div className="text-center py-8 text-muted-foreground">
                                    {selectedBotPlatform === 'email' 
                                      ? 'No tienes plantillas de email. Crea una personalizada arriba.'
                                      : 'No hay plantillas aprobadas. Crea plantillas en Meta Business Manager primero.'
                                    }
                                  </div>
                                ) : (
                                  templates.map((template) => (
                                    <Card 
                                      key={template.id}
                                      className={cn(
                                        "cursor-pointer transition-all border-2",
                                        formData.selected_template?.id === template.id
                                          ? "border-primary bg-primary/5"
                                          : template.can_use 
                                            ? "border-muted hover:border-primary/50"
                                            : "border-red-200 bg-red-50 opacity-60"
                                      )}
                                      onClick={() => {
                                        if (template.can_use) {
                                          setFormData({ 
                                            ...formData, 
                                            selected_template: template,
                                            template_id: template.id
                                          })
                                        }
                                      }}
                                    >
                                      <CardContent className="p-3">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <h4 className="font-medium text-sm">{template.name}</h4>
                                              <Badge 
                                                variant={template.can_use ? "default" : "destructive"}
                                                className="text-xs"
                                              >
                                                {template.status}
                                              </Badge>
                                            </div>
                                            {template.subject && (
                                              <p className="text-xs text-muted-foreground mt-1">
                                                <strong>Asunto:</strong> {template.subject}
                                              </p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                              {template.body_content}
                                            </p>
                                            {template.variables.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mt-2">
                                                {template.variables.map((variable, idx) => (
                                                  <code key={idx} className="bg-muted px-1 rounded text-xs">
                                                    {variable}
                                                  </code>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          {formData.selected_template?.id === template.id && (
                                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))
                                )}
                              </div>
                            )}
                          </div>

                          {/* Información adicional según la plataforma */}
                          {selectedBotPlatform !== 'email' && (
                            <div className="space-y-4">
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <div className="bg-blue-500 rounded-full p-1">
                                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium text-blue-800">Plantillas de Meta Business</h4>
                                    <p className="text-xs text-blue-600 mt-1">
                                      Para {selectedBotPlatform === 'whatsapp' ? 'WhatsApp' : 'Instagram'}, las plantillas deben estar aprobadas por Meta. 
                                    </p>
                                    <div className="text-xs text-blue-600 mt-2">
                                      <strong>Configuración requerida del bot:</strong>
                                      <ul className="list-disc ml-4 mt-1">
                                        <li>Token de acceso (access_token)</li>
                                        {selectedBotPlatform === 'whatsapp' && (
                                          <>
                                            <li>ID del número de teléfono (phone_number_id)</li>
                                            <li>ID de cuenta business (business_account_id)</li>
                                          </>
                                        )}
                                        {selectedBotPlatform === 'instagram' && (
                                          <>
                                            <li>ID de cuenta de Instagram Business (instagram_business_account_id)</li>
                                            <li>ID de la aplicación (app_id)</li>
                                            <li>Clave secreta de la app (app_secret)</li>
                                            <li>ID de cuenta business (business_account_id) - Opcional para templates</li>
                                          </>
                                        )}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Guía para crear plantillas */}
                              {templates.length === 0 && (
                                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                                  <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                      <Sparkles className="h-4 w-4 text-purple-600" />
                                      Cómo crear plantillas en Meta Business Manager
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="space-y-2">
                                      <div className="flex items-start gap-2 text-xs">
                                        <span className="bg-purple-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
                                        <div>
                                          <p className="font-medium">Accede a Meta Business Manager</p>
                                          <p className="text-muted-foreground">Ve a business.facebook.com e inicia sesión</p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-start gap-2 text-xs">
                                        <span className="bg-purple-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
                                        <div>
                                          <p className="font-medium">Navega a las plantillas</p>
                                          <p className="text-muted-foreground">
                                            {selectedBotPlatform === 'whatsapp' 
                                              ? 'WhatsApp Manager → Plantillas de mensaje' 
                                              : 'Configuración → Plantillas de Instagram'
                                            }
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-start gap-2 text-xs">
                                        <span className="bg-purple-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold mt-0.5">3</span>
                                        <div>
                                          <p className="font-medium">Crea una nueva plantilla</p>
                                          <p className="text-muted-foreground">Haz clic en "Crear plantilla" y completa los campos</p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-start gap-2 text-xs">
                                        <span className="bg-purple-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold mt-0.5">4</span>
                                        <div>
                                          <p className="font-medium">Espera la aprobación</p>
                                          <p className="text-muted-foreground">Meta revisará tu plantilla (generalmente 24-48 horas)</p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-start gap-2 text-xs">
                                        <span className="bg-green-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold mt-0.5">5</span>
                                        <div>
                                          <p className="font-medium">Recarga las plantillas</p>
                                          <p className="text-muted-foreground">Una vez aprobada, haz clic en "Actualizar plantillas" aquí</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="pt-2 border-t border-purple-200">
                                      <div className="flex items-center justify-between">
                                        <Button
                                          type="button"
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => fetchTemplatesForBot(formData.bot_id)}
                                          disabled={loadingTemplates}
                                        >
                                          {loadingTemplates ? (
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                          ) : (
                                            <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                          )}
                                          Actualizar plantillas
                                        </Button>
                                        
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={() => window.open('https://business.facebook.com', '_blank')}
                                        >
                                          Ir a Meta Business
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 5: Message Personalization */}
              {currentStep === 5 && (
                <motion.div variants={fadeInUp} className="space-y-4 sm:space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                        Personalización del Mensaje
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {formData.template_source === "create_new" 
                          ? "Revisa y ajusta tu plantilla personalizada"
                          : "Configura las variables de la plantilla seleccionada"
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Mostrar plantilla seleccionada o creada */}
                      {formData.template_source === "create_new" && formData.custom_template ? (
                        <div className="space-y-4">
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Tu Plantilla Personalizada:</h4>
                            {formData.custom_template.subject && (
                              <div className="mb-2">
                                <Label className="text-xs text-muted-foreground">Asunto:</Label>
                                <p className="text-sm font-medium">{formData.custom_template.subject}</p>
                              </div>
                            )}
                            <div>
                              <Label className="text-xs text-muted-foreground">Contenido:</Label>
                              <p className="text-sm whitespace-pre-wrap">{formData.custom_template.body_content}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="final-message" className="text-sm font-medium">
                              Mensaje Final para Automatización *
                            </Label>
                            <Textarea
                              id="final-message"
                              value={formData.message_template}
                              onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                              placeholder={formData.custom_template.body_content}
                              rows={5}
                              className="text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                              Puedes ajustar el contenido de la plantilla para esta automatización específica
                            </p>
                          </div>
                        </div>
                      ) : formData.selected_template ? (
                        <div className="space-y-4">
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Plantilla Seleccionada:</h4>
                            <p className="text-sm font-medium">{formData.selected_template.name}</p>
                            {formData.selected_template.subject && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <strong>Asunto:</strong> {formData.selected_template.subject}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {formData.selected_template.body_content}
                            </p>
                            {formData.selected_template.variables.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                <span className="text-xs text-muted-foreground">Variables:</span>
                                {formData.selected_template.variables.map((variable, idx) => (
                                  <code key={idx} className="bg-background px-1 rounded text-xs">
                                    {variable}
                                  </code>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="final-message" className="text-sm font-medium">
                              Personalización Adicional
                            </Label>
                            <Textarea
                              id="final-message"
                              value={formData.message_template}
                              onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                              placeholder="Agrega texto personalizado adicional (opcional)"
                              rows={3}
                              className="text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                              Texto adicional que se agregará antes de la plantilla principal
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Selecciona una plantilla en el paso anterior</p>
                        </div>
                      )}

                      {/* Vista previa del mensaje final */}
                      {(formData.template_source === "create_new" || formData.selected_template) && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="bg-muted/50">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Vista Previa del Mensaje Final
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="bg-white p-3 rounded-lg border text-sm space-y-2">
                                {selectedBotPlatform === 'email' && formData.template_source === "create_new" && formData.custom_template?.subject && (
                                  <div>
                                    <strong>Asunto:</strong> {formData.custom_template.subject.replace("{nombre}", "María")}
                                  </div>
                                )}
                                <div className="whitespace-pre-wrap">
                                  {(() => {
                                    let finalMessage = ""
                                    
                                    // Agregar personalización adicional si existe
                                    if (formData.message_template.trim()) {
                                      finalMessage += formData.message_template.trim() + "\n\n"
                                    }
                                    
                                    // Agregar contenido de la plantilla
                                    if (formData.template_source === "create_new" && formData.custom_template?.body_content) {
                                      finalMessage += formData.custom_template.body_content
                                    } else if (formData.selected_template?.body_content) {
                                      finalMessage += formData.selected_template.body_content
                                    }
                                    
                                    // Reemplazar variables comunes para la vista previa
                                    return finalMessage
                                      .replace(/\{nombre\}/g, "María")
                                      .replace(/\{email\}/g, "maria@ejemplo.com")
                                      .replace(/\{\{1\}\}/g, "María")  // Meta templates
                                      .replace(/\{\{2\}\}/g, "20%")    // Meta templates
                                  })()}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 6: Review */}
              {currentStep === 6 && (
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