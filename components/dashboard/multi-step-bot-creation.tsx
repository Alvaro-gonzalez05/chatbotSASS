"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
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
} from "lucide-react"

interface BotFormData {
  name: string
  platform: "whatsapp" | "instagram" | "email" | ""
  personality_prompt: string
  features: string[]
  openai_api_key: string
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
    openai_api_key: "",
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
      openai_api_key: "",
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
        openai_api_key: formData.openai_api_key,
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

  const canProceedStep1 = formData.platform !== ""
  const canProceedStep2 = formData.name.trim() !== "" && formData.personality_prompt.trim() !== ""
  const canProceedStep3 = formData.openai_api_key.trim() !== ""

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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Crear Nuevo Bot - Paso {currentStep} de {totalSteps}
            {userSubscription && (
              <Badge variant={hasPaidSubscription() ? "default" : "secondary"} className="ml-2">
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
          </DialogTitle>
          <DialogDescription>
            Configura tu chatbot paso a paso para obtener los mejores resultados
            {userSubscription && (
              <div className="mt-2 text-sm">
                Bots: {currentBotCount}/{userSubscription.max_bots || 1} utilizados
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {!canCreateBot && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Bot className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Límite de bots alcanzado</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Has alcanzado el límite de {userSubscription?.max_bots || 1} bot(s) para tu plan actual. Actualiza
                    tu suscripción para crear más bots.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={handleClose}>
                    Ver Planes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>

        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Selecciona la Plataforma</h3>
              <p className="text-muted-foreground">¿En qué plataforma quieres que funcione tu bot?</p>
            </div>

            <div className="grid gap-4">
              {Object.entries(platformLabels).map(([key, label]) => {
                const Icon = platformIcons[key as keyof typeof platformIcons]
                return (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      formData.platform === key ? "ring-2 ring-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setFormData({ ...formData, platform: key as any })}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <Icon className="h-8 w-8 text-primary" />
                      <div className="flex-1">
                        <h4 className="font-medium">{label}</h4>
                        <p className="text-sm text-muted-foreground">
                          {key === "whatsapp" && "Ideal para atención al cliente directa"}
                          {key === "instagram" && "Perfecto para engagement en redes sociales"}
                          {key === "email" && "Excelente para respuestas automáticas"}
                        </p>
                      </div>
                      {!hasPaidSubscription() && (
                        <Badge variant="outline" className="text-xs">
                          Solo prueba
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {!hasPaidSubscription() && (
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
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Configura tu Bot</h3>
              <p className="text-muted-foreground">Dale personalidad y nombre a tu asistente virtual</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bot-name">Nombre del Bot *</Label>
                <Input
                  id="bot-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Asistente Virtual de Mi Negocio"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personality">Personalidad y Prompt *</Label>
                <Textarea
                  id="personality"
                  value={formData.personality_prompt}
                  onChange={(e) => setFormData({ ...formData, personality_prompt: e.target.value })}
                  placeholder="Eres un asistente amigable y profesional que ayuda a los clientes de [tu negocio]. Siempre respondes de manera cortés y útil..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Define cómo debe comportarse tu bot, su tono de voz y estilo de comunicación
                </p>
              </div>

              <div className="space-y-3">
                <Label>Funcionalidades del Bot</Label>
                <div className="grid gap-3">
                  {availableFeatures.map((feature) => (
                    <div key={feature.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature.id}
                        checked={formData.features.includes(feature.id)}
                        onCheckedChange={(checked) => handleFeatureChange(feature.id, checked as boolean)}
                      />
                      <Label htmlFor={feature.id} className="text-sm">
                        {feature.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Configuración de IA</h3>
              <p className="text-muted-foreground">Conecta tu API de OpenAI para que el bot funcione</p>
            </div>

            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">¿Cómo obtener tu API Key?</h4>
                    <ol className="text-sm text-amber-700 mt-2 space-y-1">
                      <li>
                        1. Ve a{" "}
                        <a
                          href="https://platform.openai.com/api-keys"
                          target="_blank"
                          className="underline"
                          rel="noreferrer"
                        >
                          platform.openai.com
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

            <div className="space-y-2">
              <Label htmlFor="openai-key">API Key de OpenAI *</Label>
              <Input
                id="openai-key"
                type="password"
                value={formData.openai_api_key}
                onChange={(e) => setFormData({ ...formData, openai_api_key: e.target.value })}
                placeholder="sk-..."
              />
              <p className="text-xs text-muted-foreground">
                Tu clave API se almacena de forma segura y solo se usa para tu bot
              </p>
            </div>

            {!hasPaidSubscription() && (
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
            )}
          </div>
        )}

        {currentStep === 4 && shouldShowStep4() && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Configuración de {platformLabels[formData.platform as keyof typeof platformLabels]}
              </h3>
              <p className="text-muted-foreground">
                {formData.platform === "whatsapp" && "Configura los tokens de WhatsApp Business API"}
                {formData.platform === "instagram" && "Conecta tu cuenta de Instagram Business"}
              </p>
            </div>

            {formData.platform === "whatsapp" && (
              <div className="space-y-6">
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

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wa-access-token">WhatsApp Access Token *</Label>
                    <Input
                      id="wa-access-token"
                      type="password"
                      value={formData.whatsapp_access_token}
                      onChange={(e) => setFormData({ ...formData, whatsapp_access_token: e.target.value })}
                      placeholder="EAAxxxxx..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wa-phone-id">Phone Number ID *</Label>
                    <Input
                      id="wa-phone-id"
                      value={formData.whatsapp_phone_number_id}
                      onChange={(e) => setFormData({ ...formData, whatsapp_phone_number_id: e.target.value })}
                      placeholder="123456789..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wa-verify-token">Webhook Verify Token</Label>
                    <Input
                      id="wa-verify-token"
                      value={formData.whatsapp_webhook_verify_token}
                      onChange={(e) => setFormData({ ...formData, whatsapp_webhook_verify_token: e.target.value })}
                      placeholder="mi_token_secreto"
                    />
                  </div>
                </div>

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
              </div>
            )}

            {formData.platform === "instagram" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fb-page-token">Page Access Token *</Label>
                  <Input
                    id="fb-page-token"
                    type="password"
                    value={formData.facebook_page_access_token}
                    onChange={(e) => setFormData({ ...formData, facebook_page_access_token: e.target.value })}
                    placeholder="EAAxxxxx..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fb-page-id">Page ID *</Label>
                  <Input
                    id="fb-page-id"
                    value={formData.facebook_page_id}
                    onChange={(e) => setFormData({ ...formData, facebook_page_id: e.target.value })}
                    placeholder="123456789..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fb-app-id">App ID</Label>
                    <Input
                      id="fb-app-id"
                      value={formData.facebook_app_id}
                      onChange={(e) => setFormData({ ...formData, facebook_app_id: e.target.value })}
                      placeholder="123456789"
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
                    />
                  </div>
                </div>

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
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={
                  !canCreateBot ||
                  (currentStep === 1 && !canProceedStep1) ||
                  (currentStep === 2 && !canProceedStep2) ||
                  (currentStep === 3 && !canProceedStep3)
                }
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleCreateBot} disabled={isLoading || !canCreateBot}>
                {isLoading ? "Creando Bot..." : "Crear Bot"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
