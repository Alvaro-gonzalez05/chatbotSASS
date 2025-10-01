"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Instagram,
  Mail,
  Bot,
  Key,
  Facebook,
  CheckCircle,
  Sparkles,
  Crown,
  TestTube,
  Check,
  Loader2,
} from "lucide-react"

interface BotFormData {
  name: string
  platform: "whatsapp" | "instagram" | "email" | ""
  personality_prompt: string
  features: string[]
  gemini_api_key: string
  facebook_page_access_token?: string
  facebook_page_id?: string
  facebook_app_id?: string
  facebook_app_secret?: string
  whatsapp_phone_number_id?: string
  whatsapp_access_token?: string
  whatsapp_webhook_verify_token?: string
}

interface UserSubscription {
  subscription_status: string
  plan_type: string
  trial_end_date: string | null
  subscription_end_date: string | null
  max_bots: number
  max_automations: number
}

interface MultiStepBotCreationProps {
  isOpen: boolean
  onClose: () => void
  onBotCreated: (bot: any) => void
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

const steps = [
  { id: "platform", title: "Plataforma" },
  { id: "config", title: "Configuración" },
  { id: "ai", title: "IA" },
  { id: "tokens", title: "Tokens" },
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

export function MultiStepBotCreation({ isOpen, onClose, onBotCreated, userId }: MultiStepBotCreationProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null)
  const [currentBotCount, setCurrentBotCount] = useState(0)
  const [canCreateBot, setCanCreateBot] = useState(true)
  const supabase = createClient()

  const [formData, setFormData] = useState<BotFormData>({
    name: "",
    platform: "",
    personality_prompt: "",
    features: [],
    gemini_api_key: "",
    facebook_page_access_token: "",
    facebook_page_id: "",
    facebook_app_id: "",
    facebook_app_secret: "",
    whatsapp_phone_number_id: "",
    whatsapp_access_token: "",
    whatsapp_webhook_verify_token: "",
  })

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserSubscription()
      checkBotLimits()
    }
  }, [isOpen, userId])

  const fetchUserSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("subscription_status, plan_type, trial_end_date, subscription_end_date")
        .eq("id", userId)
        .single()

      if (error) {
        console.log("[v0] Subscription columns not found, using trial defaults:", error.message)
        setUserSubscription({
          subscription_status: "trial",
          plan_type: "trial",
          trial_end_date: null,
          subscription_end_date: null,
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
        trial_end_date: null,
        subscription_end_date: null,
        max_bots: 1,
        max_automations: 0,
      })
    }
  }

  const checkBotLimits = async () => {
    try {
      const { data: bots, error } = await supabase.from("bots").select("id").eq("user_id", userId)

      if (error) throw error

      const botCount = bots?.length || 0
      setCurrentBotCount(botCount)

      const maxBots = userSubscription?.max_bots || 1
      setCanCreateBot(botCount < maxBots)
    } catch (error) {
      console.error("Error checking bot limits:", error)
      setCanCreateBot(false)
    }
  }

  const hasPaidSubscription = () => {
    return userSubscription?.plan_type !== "trial" && userSubscription?.subscription_status === "active"
  }

  const shouldShowStep4 = () => {
    return hasPaidSubscription() && (formData.platform === "whatsapp" || formData.platform === "instagram")
  }

  const getTotalSteps = () => {
    return shouldShowStep4() ? 4 : 3
  }

  const resetForm = () => {
    setFormData({
      name: "",
      platform: "",
      personality_prompt: "",
      features: [],
      gemini_api_key: "",
      facebook_page_access_token: "",
      facebook_page_id: "",
      facebook_app_id: "",
      facebook_app_secret: "",
      whatsapp_phone_number_id: "",
      whatsapp_access_token: "",
      whatsapp_webhook_verify_token: "",
    })
    setCurrentStep(1)
    setShowSuccess(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const nextStep = () => {
    const totalSteps = getTotalSteps()
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFeatureChange = (featureId: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, features: [...formData.features, featureId] })
    } else {
      setFormData({ ...formData, features: formData.features.filter((f) => f !== featureId) })
    }
  }

  const handleCreateBot = async () => {
    if (!canCreateBot) {
      toast.error("Límite de bots alcanzado", {
        description: `Has alcanzado el límite de ${userSubscription?.max_bots || 1} bot(s) para tu plan. Actualiza tu suscripción para crear más bots.`,
        duration: 4000,
      })
      return
    }

    setIsLoading(true)

    try {
      // Solo enviar campos que existen en la tabla bots
      const botData = {
        name: formData.name,
        platform: formData.platform,
        personality_prompt: formData.personality_prompt,
        features: formData.features,
        gemini_api_key: formData.gemini_api_key,
        user_id: userId,
        is_active: true,
        automations: [], // Por defecto vacío
      }

      const { data, error } = await supabase
        .from("bots")
        .insert([botData])
        .select()
        .single()

      if (error) throw error

      setShowSuccess(true)

      setTimeout(() => {
        onBotCreated(data)
        handleClose()
        toast.success(`Bot "${data.name}" creado exitosamente`, {
          description: "Tu bot está listo para comenzar a atender clientes.",
          duration: 4000,
        })
      }, 3000)
    } catch (error) {
      toast.error("Error al crear el bot", {
        description: "No se pudo crear el bot. Inténtalo de nuevo.",
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.platform !== ""
      case 2:
        return formData.name.trim() !== "" && formData.personality_prompt.trim() !== ""
      case 3:
        return formData.gemini_api_key.trim() !== ""
      default:
        return true
    }
  }

  const canProceedStep1 = formData.platform !== ""
  const canProceedStep2 = formData.name.trim() !== "" && formData.personality_prompt.trim() !== ""
  const canProceedStep3 = formData.gemini_api_key.trim() !== ""

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
              <h3 className="text-xl font-bold text-green-600">¡Bot Creado Exitosamente!</h3>
              <p className="text-muted-foreground">Tu bot está listo para comenzar a trabajar</p>
            </div>
            <div className="w-full bg-green-100 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: "100%" }}></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const totalSteps = getTotalSteps()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-base sm:text-lg">Crear Nuevo Bot</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base">Paso {currentStep} de {totalSteps}</span>
              {userSubscription && (
                <Badge variant={hasPaidSubscription() ? "default" : "secondary"} className="text-xs">
                  {hasPaidSubscription() ? (
                    <>
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </>
                  ) : (
                    <>
                      <TestTube className="h-3 w-3 mr-1" />
                      Prueba
                    </>
                  )}
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Configura tu chatbot paso a paso para obtener los mejores resultados
          </DialogDescription>
          {userSubscription && (
            <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Bots: {currentBotCount}/{userSubscription.max_bots || 1} utilizados
            </div>
          )}
        </DialogHeader>

        {!canCreateBot && (
          <div className="px-4 sm:px-6">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-medium text-red-800">Límite de bots alcanzado</h4>
                    <p className="text-xs sm:text-sm text-red-700 mt-1">
                      Has alcanzado el límite de {userSubscription?.max_bots || 1} bot(s) para tu plan actual. Actualiza
                      tu suscripción para crear más bots.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2 bg-transparent w-full sm:w-auto text-xs sm:text-sm" onClick={handleClose}>
                      Ver Planes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progress indicator */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between mb-2">
            {steps.slice(0, getTotalSteps()).map((step, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center"
                whileHover={{ scale: 1.1 }}
              >
                <motion.div
                  className={cn(
                    "w-4 h-4 rounded-full cursor-pointer transition-colors duration-300",
                    index < currentStep - 1
                      ? "bg-primary"
                      : index === currentStep - 1
                        ? "bg-primary ring-4 ring-primary/20"
                        : "bg-muted",
                  )}
                  onClick={() => {
                    if (index <= currentStep - 1) {
                      setCurrentStep(index + 1)
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                />
                <motion.span
                  className={cn(
                    "text-xs mt-1.5 hidden sm:block",
                    index === currentStep - 1
                      ? "text-primary font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {step.title}
                </motion.span>
              </motion.div>
            ))}
          </div>
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep - 1) / (getTotalSteps() - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border shadow-md rounded-3xl overflow-hidden">
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={contentVariants}
                >
                  {/* Step 1: Platform Selection */}
                  {currentStep === 1 && (
                    <>
                      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                        <CardTitle className="text-lg sm:text-xl">Selecciona la Plataforma</CardTitle>
                        <CardDescription className="text-sm sm:text-base">
                          ¿En qué plataforma quieres que funcione tu bot?
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                        <motion.div variants={fadeInUp} className="space-y-3 sm:space-y-4">
                          <Label className="text-sm sm:text-base font-medium">Selecciona una plataforma</Label>
                          <RadioGroup
                            value={formData.platform}
                            onValueChange={(value) => setFormData({ ...formData, platform: value as any })}
                            className="space-y-2 sm:space-y-3"
                          >
                            {Object.entries(platformLabels).map(([key, label], index) => {
                              const Icon = platformIcons[key as keyof typeof platformIcons]
                              return (
                                <motion.div
                                  key={key}
                                  className={cn(
                                    "flex items-center space-x-2 sm:space-x-3 rounded-md border p-3 sm:p-4 cursor-pointer transition-colors group",
                                    formData.platform === key ? "bg-accent" : "hover:bg-accent"
                                  )}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  transition={{ duration: 0.2 }}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{
                                    opacity: 1,
                                    y: 0,
                                    transition: {
                                      delay: 0.1 * index,
                                      duration: 0.3,
                                    },
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.classList.add('hovered')
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.classList.remove('hovered')
                                  }}
                                  onClick={() => setFormData({ ...formData, platform: key as any })}
                                >
                                  <RadioGroupItem value={key} id={`platform-${key}`} className="flex-shrink-0" />
                                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6 transition-colors flex-shrink-0", formData.platform === key ? "text-white" : "text-primary group-hover:text-white")} />
                                    <div className={cn("flex-1 min-w-0", formData.platform === key ? "text-white" : "group-hover:text-white")}> 
                                      <Label htmlFor={`platform-${key}`} className={cn("cursor-pointer text-sm sm:text-base font-medium transition-colors", formData.platform === key ? "text-white" : "group-hover:text-white")}> 
                                        {label}
                                      </Label>
                                      <p className={cn("text-xs sm:text-sm mt-1 transition-colors", formData.platform === key ? "text-white" : "text-muted-foreground group-hover:text-white")}> 
                                        {key === "whatsapp" && "Ideal para atención al cliente directa"}
                                        {key === "instagram" && "Perfecto para engagement en redes sociales"}
                                        {key === "email" && "Excelente para respuestas automáticas"}
                                      </p>
                                    </div>
                                    {!hasPaidSubscription() && (
                                      <Badge variant="outline" className={cn("text-xs transition-colors flex-shrink-0", formData.platform === key ? "text-white border-white" : "group-hover:text-white group-hover:border-white")}> 
                                        <span className="hidden sm:inline">Solo prueba</span>
                                        <span className="sm:hidden">Prueba</span>
                                      </Badge>
                                    )}
                                  </div>
                                </motion.div>
                              )
                            })}
                          </RadioGroup>
                        </motion.div>

                        {!hasPaidSubscription() && (
                          <motion.div variants={fadeInUp}>
                            <Card className="border-blue-200 bg-blue-50">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <TestTube className="h-5 w-5 text-blue-600 mt-0.5" />
                                  <div>
                                    <h4 className="font-medium text-blue-800">Modo Prueba</h4>
                                    <p className="text-sm text-blue-700 mt-1">
                                      En tu plan gratuito, los bots se crean para prueba interna. Para conectar a plataformas reales,
                                      actualiza tu plan.
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                      </CardContent>
                    </>
                  )}

                  {/* Step 2: Bot Configuration */}
                  {currentStep === 2 && (
                    <>
                      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                        <CardTitle className="text-lg sm:text-xl">Configura tu Bot</CardTitle>
                        <CardDescription className="text-sm sm:text-base">
                          Dale personalidad y nombre a tu asistente virtual
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="bot-name" className="text-sm sm:text-base font-medium">Nombre del Bot *</Label>
                          <Input
                            id="bot-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Asistente Virtual de Mi Negocio"
                            className="text-sm sm:text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </motion.div>

                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="personality" className="text-sm sm:text-base font-medium">Personalidad y Prompt *</Label>
                          <Textarea
                            id="personality"
                            value={formData.personality_prompt}
                            onChange={(e) => setFormData({ ...formData, personality_prompt: e.target.value })}
                            placeholder="Eres un asistente amigable y profesional que ayuda a los clientes de [tu negocio]. Siempre respondes de manera cortés y útil..."
                            rows={4}
                            className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                          />
                          <p className="text-xs text-muted-foreground">
                            Define cómo debe comportarse tu bot, su tono de voz y estilo de comunicación
                          </p>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label className="text-sm sm:text-base font-medium">Funcionalidades del Bot</Label>
                          <div className="grid grid-cols-1 gap-2 sm:gap-3">
                            {availableFeatures.map((feature, index) => (
                              <motion.div
                                key={feature.id}
                                className="flex items-center space-x-2 sm:space-x-3 rounded-md border p-2 sm:p-3 cursor-pointer hover:bg-accent transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                  transition: {
                                    delay: 0.05 * index,
                                    duration: 0.3,
                                  },
                                }}
                                onClick={() =>
                                  handleFeatureChange(feature.id, !formData.features.includes(feature.id))
                                }
                              >
                                <Checkbox
                                  id={feature.id}
                                  checked={formData.features.includes(feature.id)}
                                  onCheckedChange={(checked) => handleFeatureChange(feature.id, checked as boolean)}
                                />
                                <Label htmlFor={feature.id} className="cursor-pointer w-full text-sm">
                                  {feature.label}
                                </Label>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      </CardContent>
                    </>
                  )}

                  {/* Step 3: AI Configuration */}
                  {currentStep === 3 && (
                    <>
                      <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">Configuración de IA</CardTitle>
                        <CardDescription className="text-sm sm:text-base">
                          Conecta tu API de Gemini para que el bot funcione
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                        <motion.div variants={fadeInUp}>
                          <Card className="border-amber-200 bg-amber-50">
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-start gap-2 sm:gap-3">
                                <Key className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                  <h4 className="text-sm sm:text-base font-medium text-amber-800">¿Cómo obtener tu API Key?</h4>
                                  <ol className="text-xs sm:text-sm text-amber-700 mt-2 space-y-1">
                                    <li>
                                      1. Ve a{" "}
                                      <a
                                        href="https://aistudio.google.com/"
                                        target="_blank"
                                        className="underline"
                                        rel="noreferrer"
                                      >
                                        aistudio.google.com
                                      </a>
                                    </li>
                                    <li>2. Inicia sesión o crea una cuenta</li>
                                    <li>3. Ve a "API Keys" y crea una nueva clave</li>
                                    <li>4. Copia la clave y pégala aquí abajo</li>
                                  </ol>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="space-y-2">
                          <Label htmlFor="gemini-key" className="text-sm sm:text-base font-medium">API Key de Gemini *</Label>
                          <Input
                            id="gemini-key"
                            type="password"
                            value={formData.gemini_api_key}
                            onChange={(e) => setFormData({ ...formData, gemini_api_key: e.target.value })}
                            placeholder="AIza..."
                            className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                          <p className="text-xs text-muted-foreground">
                            Tu clave API se almacena de forma segura y solo se usa para tu bot
                          </p>
                        </motion.div>

                        {!hasPaidSubscription() && (
                          <motion.div variants={fadeInUp}>
                            <Card className="border-green-200 bg-green-50">
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                  <h4 className="font-medium text-green-800">¡Casi listo!</h4>
                                  <p className="text-sm text-green-700">
                                    Tu bot se creará para pruebas internas. Podrás probarlo desde la sección de prueba.
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                      </CardContent>
                    </>
                  )}

                  {/* Step 4: Token Configuration */}
                  {currentStep === 4 && shouldShowStep4() && (
                    <>
                      <CardHeader>
                        <CardTitle>
                          Configuración de {platformLabels[formData.platform as keyof typeof platformLabels]}
                        </CardTitle>
                        <CardDescription>
                          {formData.platform === "whatsapp" && "Configura los tokens de WhatsApp Business API"}
                          {formData.platform === "instagram" && "Conecta tu cuenta de Instagram Business"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {formData.platform === "whatsapp" && (
                          <div className="space-y-6">
                            <motion.div variants={fadeInUp}>
                              <Card className="border-green-200 bg-green-50">
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <Facebook className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                      <h4 className="font-medium text-green-800">Configuración de WhatsApp Business</h4>
                                      <p className="text-sm text-green-700 mt-1">
                                        Para conectar WhatsApp, necesitas configurar la API de Meta (Facebook)
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>

                            <div className="space-y-4">
                              <motion.div variants={fadeInUp} className="space-y-2">
                                <Label htmlFor="wa-access-token">WhatsApp Access Token *</Label>
                                <Input
                                  id="wa-access-token"
                                  type="password"
                                  value={formData.whatsapp_access_token}
                                  onChange={(e) => setFormData({ ...formData, whatsapp_access_token: e.target.value })}
                                  placeholder="EAAxxxxx..."
                                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                              </motion.div>

                              <motion.div variants={fadeInUp} className="space-y-2">
                                <Label htmlFor="wa-phone-id">Phone Number ID *</Label>
                                <Input
                                  id="wa-phone-id"
                                  value={formData.whatsapp_phone_number_id}
                                  onChange={(e) => setFormData({ ...formData, whatsapp_phone_number_id: e.target.value })}
                                  placeholder="123456789..."
                                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                              </motion.div>

                              <motion.div variants={fadeInUp} className="space-y-2">
                                <Label htmlFor="wa-verify-token">Webhook Verify Token</Label>
                                <Input
                                  id="wa-verify-token"
                                  value={formData.whatsapp_webhook_verify_token}
                                  onChange={(e) => setFormData({ ...formData, whatsapp_webhook_verify_token: e.target.value })}
                                  placeholder="mi_token_secreto"
                                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                              </motion.div>
                            </div>

                            <motion.div variants={fadeInUp}>
                              <Card className="border-blue-200 bg-blue-50">
                                <CardContent className="p-4">
                                  <div className="text-center">
                                    <TestTube className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                    <h4 className="font-medium text-blue-800">¿No tienes los tokens aún?</h4>
                                    <p className="text-sm text-blue-700 mb-3">
                                      Puedes crear el bot sin tokens y configurarlos después desde la sección de prueba.
                                    </p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          whatsapp_access_token: "",
                                          whatsapp_phone_number_id: "",
                                          whatsapp_webhook_verify_token: "",
                                        })
                                        handleCreateBot()
                                      }}
                                      disabled={isLoading}
                                    >
                                      Crear Bot para Prueba
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          </div>
                        )}

                        {formData.platform === "instagram" && (
                          <div className="space-y-4">
                            <motion.div variants={fadeInUp} className="space-y-2">
                              <Label htmlFor="fb-page-token">Page Access Token *</Label>
                              <Input
                                id="fb-page-token"
                                type="password"
                                value={formData.facebook_page_access_token}
                                onChange={(e) => setFormData({ ...formData, facebook_page_access_token: e.target.value })}
                                placeholder="EAAxxxxx..."
                                className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              />
                            </motion.div>

                            <motion.div variants={fadeInUp} className="space-y-2">
                              <Label htmlFor="fb-page-id">Page ID *</Label>
                              <Input
                                id="fb-page-id"
                                value={formData.facebook_page_id}
                                onChange={(e) => setFormData({ ...formData, facebook_page_id: e.target.value })}
                                placeholder="123456789..."
                                className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              />
                            </motion.div>

                            <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="fb-app-id">App ID</Label>
                                <Input
                                  id="fb-app-id"
                                  value={formData.facebook_app_id}
                                  onChange={(e) => setFormData({ ...formData, facebook_app_id: e.target.value })}
                                  placeholder="123456789"
                                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="fb-app-secret">App Secret</Label>
                                <Input
                                  id="fb-app-secret"
                                  type="password"
                                  value={formData.facebook_app_secret}
                                  onChange={(e) => setFormData({ ...formData, facebook_app_secret: e.target.value })}
                                  placeholder="abc123..."
                                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                              </div>
                            </motion.div>

                            <motion.div variants={fadeInUp}>
                              <Card className="border-blue-200 bg-blue-50">
                                <CardContent className="p-4">
                                  <div className="text-center">
                                    <TestTube className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                    <h4 className="font-medium text-blue-800">¿No tienes los tokens aún?</h4>
                                    <p className="text-sm text-blue-700 mb-3">
                                      Puedes crear el bot sin tokens y configurarlos después desde la sección de prueba.
                                    </p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          facebook_page_access_token: "",
                                          facebook_page_id: "",
                                          facebook_app_id: "",
                                          facebook_app_secret: "",
                                        })
                                        handleCreateBot()
                                      }}
                                      disabled={isLoading}
                                    >
                                      Crear Bot para Prueba
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          </div>
                        )}
                      </CardContent>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 pb-4 px-4 sm:px-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto"
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="flex items-center justify-center gap-1 transition-all duration-300 rounded-2xl w-full sm:w-auto text-sm sm:text-base"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" /> 
                    <span className="hidden sm:inline">Anterior</span>
                    <span className="sm:hidden">Atrás</span>
                  </Button>
                </motion.div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={handleClose}
                    className="w-full sm:w-auto text-sm sm:text-base"
                  >
                    Cancelar
                  </Button>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto"
                  >
                    {currentStep < totalSteps ? (
                      <Button
                        onClick={nextStep}
                        disabled={
                          !canCreateBot ||
                          (currentStep === 1 && !canProceedStep1) ||
                          (currentStep === 2 && !canProceedStep2) ||
                          (currentStep === 3 && !canProceedStep3)
                        }
                        className="flex items-center justify-center gap-1 transition-all duration-300 rounded-2xl w-full sm:w-auto text-sm sm:text-base"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> 
                            <span className="hidden sm:inline">Cargando...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden sm:inline">Siguiente</span>
                            <span className="sm:hidden">Continuar</span>
                            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleCreateBot}
                        disabled={isLoading || !canCreateBot}
                        className="flex items-center justify-center gap-1 transition-all duration-300 rounded-2xl w-full sm:w-auto text-sm sm:text-base"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> 
                            <span className="hidden sm:inline">Creando...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden sm:inline">Crear Bot</span>
                            <span className="sm:hidden">Crear</span>
                            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </motion.div>
                </div>
              </CardFooter>
            </div>
          </Card>
        </motion.div>

        {/* Step indicator */}
        <motion.div
          className="mt-4 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Paso {currentStep} de {totalSteps}: {steps[currentStep - 1]?.title}
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}