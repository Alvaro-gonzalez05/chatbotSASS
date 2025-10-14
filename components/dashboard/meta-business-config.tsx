"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  Facebook,
  MessageSquare,
  Key,
  Webhook,
  Settings,
  CheckCircle,
} from "lucide-react"

interface BotData {
  id: string
  name: string
  platform: "whatsapp" | "instagram" | "email"
  personality_prompt?: string
  features: string[]
  automations: string[]
  gemini_api_key?: string
  is_active: boolean
  created_at: string
}

interface WhatsAppIntegration {
  id: string
  phone_number_id: string
  access_token: string
  webhook_verify_token: string
  business_account_id: string
  is_active: boolean
  is_verified: boolean
}

interface MetaBusinessConfigProps {
  isOpen: boolean
  onClose: () => void
  bot: BotData | null
  onConfigComplete: () => void
}

const configSteps = [
  { id: "business", title: "Configuración de negocio", description: "Configura tu cuenta de Meta Business" },
  { id: "app", title: "Aplicación de WhatsApp", description: "Crear y configurar la aplicación" },
  { id: "webhook", title: "Webhook", description: "Configurar la URL de webhook" },
  { id: "tokens", title: "Tokens de acceso", description: "Obtener y configurar los tokens" },
  { id: "test", title: "Pruebas", description: "Verificar la configuración" }
]

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export function MetaBusinessConfig({ isOpen, onClose, bot, onConfigComplete }: MetaBusinessConfigProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [whatsappIntegration, setWhatsappIntegration] = useState<WhatsAppIntegration | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const supabase = createClient()
  
  // Ref para almacenar el timeout ID
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [formData, setFormData] = useState({
    phone_number_id: "",
    access_token: "",
    business_account_id: "",
  })

  useEffect(() => {
    if (isOpen && bot) {
      fetchWhatsAppIntegration()
    }
  }, [isOpen, bot])

  // Limpieza cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const fetchWhatsAppIntegration = async () => {
    if (!bot) return

    try {
      const { data, error } = await supabase
        .from("whatsapp_integrations")
        .select("*")
        .eq("bot_id", bot.id)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching WhatsApp integration:", error)
        return
      }

      if (data) {
        setWhatsappIntegration(data)
        setFormData({
          phone_number_id: data.phone_number_id === "pending_configuration" ? "" : data.phone_number_id,
          access_token: data.access_token === "pending_configuration" ? "" : data.access_token,
          business_account_id: data.business_account_id === "pending_configuration" ? "" : data.business_account_id,
        })
      }
    } catch (error) {
      console.error("Error fetching integration:", error)
    }
  }

  const handleSaveConfiguration = async () => {
    if (!bot || !whatsappIntegration) return

    setIsLoading(true)

    try {
      const updatedData = {
        phone_number_id: formData.phone_number_id,
        access_token: formData.access_token,
        business_account_id: formData.business_account_id,
        is_active: true,
        is_verified: false // Se verificará cuando se reciba el primer webhook
      }

      console.log("Guardando configuración:", {
        botId: bot.id,
        integrationId: whatsappIntegration.id,
        updatedData
      })

      const { error, data } = await supabase
        .from("whatsapp_integrations")
        .update(updatedData)
        .eq("id", whatsappIntegration.id)
        .select()

      if (error) throw error

      console.log("Configuración guardada exitosamente:", data)

      setIsCompleted(true)

      timeoutRef.current = setTimeout(() => {
        toast.success("Configuración completada", {
          description: "Tu bot de WhatsApp está configurado y listo para recibir mensajes.",
          duration: 4000,
        })
        onConfigComplete()
      }, 2000)
    } catch (error) {
      console.error("Error updating configuration:", error)
      toast.error("Error al guardar la configuración", {
        description: "Inténtalo de nuevo o verifica tus credenciales.",
        duration: 4000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    // Cancelar cualquier timeout pendiente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    // Llamar al callback de cierre (que hará el reload)
    onClose()
  }

  const nextStep = () => {
    if (currentStep < configSteps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 4: // Paso de tokens
        return formData.phone_number_id.trim() !== "" && 
               formData.access_token.trim() !== "" && 
               formData.business_account_id.trim() !== ""
      default:
        return true
    }
  }

  if (isCompleted) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <motion.div 
            className="flex flex-col items-center justify-center py-8 space-y-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
          >
            <div className="relative">
              <motion.div 
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 400 }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
                >
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </motion.div>
              </motion.div>
              
              {/* Animación de confetti */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-green-400 rounded-full"
                  initial={{ 
                    scale: 0,
                    x: 0,
                    y: 0
                  }}
                  animate={{ 
                    scale: [0, 1, 0],
                    x: [0, (Math.random() - 0.5) * 100],
                    y: [0, (Math.random() - 0.5) * 100],
                  }}
                  transition={{ 
                    delay: 0.7 + i * 0.1,
                    duration: 1.5,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>
            <motion.div 
              className="text-center space-y-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              <h3 className="text-lg font-semibold">¡Configuración completada!</h3>
              <p className="text-sm text-muted-foreground">
                Tu bot de WhatsApp está listo para recibir mensajes
              </p>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Configurar Meta Business Suite
          </DialogTitle>
          <DialogDescription>
            Configura la integración de WhatsApp para el bot "{bot?.name}"
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de pasos animado */}
        <div className="flex items-center justify-between mb-6">
          {configSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <motion.div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                  ${currentStep > index + 1 ? "bg-green-500 text-white shadow-lg shadow-green-500/30" : ""}
                  ${currentStep === index + 1 ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110" : ""}
                  ${currentStep < index + 1 ? "bg-gray-200 text-gray-600" : ""}
                `}
                initial={false}
                animate={{
                  scale: currentStep === index + 1 ? 1.1 : 1,
                  backgroundColor: 
                    currentStep > index + 1 ? "#10b981" : 
                    currentStep === index + 1 ? "#3b82f6" : "#e5e7eb"
                }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                whileHover={{ scale: currentStep >= index + 1 ? 1.15 : 1.05 }}
              >
                <motion.div
                  initial={false}
                  animate={{ opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep > index + 1 ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.4, type: "spring" }}
                    >
                      <Check className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <motion.span
                      initial={false}
                      animate={{ scale: currentStep === index + 1 ? 1.1 : 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {index + 1}
                    </motion.span>
                  )}
                </motion.div>
              </motion.div>
              {index < configSteps.length - 1 && (
                <div className="relative w-12 h-0.5 mx-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ 
                      width: currentStep > index + 1 ? "100%" : "0%" 
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contenido del paso actual */}
        <div className="min-h-[400px]">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {currentStep === 1 && (
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración de Meta Business
                </CardTitle>
                <CardDescription>
                  Necesitas tener una cuenta de Meta Business configurada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div 
                  className="bg-blue-50 p-4 rounded-lg"
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <h4 className="font-medium text-blue-900 mb-2">Pasos previos requeridos:</h4>
                  <ol className="text-sm text-blue-800 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-medium">1.</span>
                      <div>
                        Crear cuenta en{" "}
                        <a 
                          href="https://business.facebook.com/" 
                          target="_blank" 
                          className="underline inline-flex items-center gap-1"
                          rel="noreferrer"
                        >
                          Meta Business Manager
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium">2.</span>
                      Registrar tu negocio y verificarlo
                    </li>
            
                  </ol>
                </motion.div>
                
                <motion.div 
                  className="bg-amber-50 p-4 rounded-lg"
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start gap-2">
                    <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    </motion.div>
                    <div>
                      <h4 className="font-medium text-amber-900">Importante</h4>
                      <p className="text-sm text-amber-800 mt-1">
                        Asegúrate de completar estos pasos antes de continuar. 
                        Sin una cuenta de Meta Business verificada, no podrás usar WhatsApp Business API.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Crear Aplicación de WhatsApp
                </CardTitle>
                <CardDescription>
                  Crea una aplicación en el panel de desarrolladores de Meta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Pasos a seguir:</h4>
                    <ol className="text-sm text-blue-800 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="font-medium">1.</span>
                        <div>
                          Ve a{" "}
                          <a 
                            href="https://developers.facebook.com/" 
                            target="_blank" 
                            className="underline inline-flex items-center gap-1"
                            rel="noreferrer"
                          >
                            developers.facebook.com
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">2.</span>
                        Toca "Mis Apps" y luego "Crear App"
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">3.</span>
                        Configurar detalles de la app, como nombre y correo
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">4.</span>
                        En casos de uso, selecciona "OTRO"
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">4.</span>
                        Y en tipo de app selecciona "NEGOCIOS" ,luego completa los detalles de nuevo y asocialo a un portfolio comercial si quieres
                      </li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Configurar Webhook
                </CardTitle>
                <CardDescription>
                  Configura la URL del webhook para recibir mensajes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div 
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.15
                      }
                    }
                  }}
                >
                  <motion.div variants={fadeInUp}>
                    <Label className="text-sm font-medium">URL del Webhook</Label>
                    <motion.div 
                      className="mt-1 p-3 bg-gray-50 rounded-lg border cursor-pointer group"
                      whileHover={{ scale: 1.02, backgroundColor: "#f3f4f6" }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/api/whatsapp/webhook`)
                        toast.success("URL copiada al portapapeles")
                      }}
                    >
                      <code className="text-sm break-all group-hover:text-blue-600 transition-colors">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/api/whatsapp/webhook
                      </code>
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Copia esta URL y pégala en la configuración de webhook de tu aplicación de WhatsApp
                    </p>
                  </motion.div>

                  <motion.div variants={fadeInUp}>
                    <Label className="text-sm font-medium">Token de Verificación</Label>
                    <motion.div 
                      className="mt-1 p-3 bg-gray-50 rounded-lg border cursor-pointer group"
                      whileHover={{ scale: 1.02, backgroundColor: "#f3f4f6" }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => {
                        if (whatsappIntegration?.webhook_verify_token) {
                          navigator.clipboard.writeText(whatsappIntegration.webhook_verify_token)
                          toast.success("Token copiado al portapapeles")
                        }
                      }}
                    >
                      <code className="text-sm break-all group-hover:text-blue-600 transition-colors">
                        {whatsappIntegration?.webhook_verify_token || "Cargando..."}
                      </code>
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Usa este token en el campo "Verify Token" de la configuración del webhook
                    </p>
                  </motion.div>

                  <motion.div 
                    className="bg-blue-50 p-4 rounded-lg"
                    variants={fadeInUp}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h4 className="font-medium text-blue-900 mb-2">En tu aplicación de WhatsApp:</h4>
                    <ol className="text-sm text-blue-800 space-y-1">
                      <li>1. Ve a "Configuration" en el panel de WhatsApp</li>
                      <li>2. Entra a configurar el webhook</li>
                      <li>3. Pega la URL del webhook y el token de verificación</li>
                      <li>4. Selecciona "messages" en los eventos</li>
                      <li>5. Haz clic en "Guardar y continuar"</li>
                    </ol>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Tokens de Acceso
                </CardTitle>
                <CardDescription>
                  Obtén y configura los tokens necesarios para la integración
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900">Obtén estos datos de tu aplicación</h4>
                      <p className="text-sm text-amber-800 mt-1">
                        Ve a la configuración de WhatsApp en tu aplicación de Meta para obtener estos valores.
                      </p>
                      
                    </div>
                    
                  </div>
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-3.5" />
                  <p className="text-sm text-amber-800 mt-1">
                        Puedes usar tokens de acceso temporales o permanentes para esta configuración inicial.
                      </p>
                </div>

                <motion.div 
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                >
                  <motion.div variants={fadeInUp}>
                    <Label htmlFor="phone-id" className="text-sm font-medium">Phone Number ID *</Label>
                    <motion.div
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        id="phone-id"
                        value={formData.phone_number_id}
                        onChange={(e) => setFormData({ ...formData, phone_number_id: e.target.value })}
                        placeholder="Ejemplo: 123456789012345"
                        className="mt-1 transition-all duration-300 focus:shadow-lg focus:shadow-blue-500/10"
                      />
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Encuentra este ID en la configuración del número de teléfono de WhatsApp
                    </p>
                  </motion.div>

                  <motion.div variants={fadeInUp}>
                    <Label htmlFor="access-token" className="text-sm font-medium">Access Token *</Label>
                    <motion.div
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        id="access-token"
                        type="password"
                        value={formData.access_token}
                        onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                        placeholder="EAAx..."
                        className="mt-1 transition-all duration-300 focus:shadow-lg focus:shadow-blue-500/10"
                      />
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Token de acceso temporal de tu aplicación (se puede generar uno permanente después)
                    </p>
                  </motion.div>

                  <motion.div variants={fadeInUp}>
                    <Label htmlFor="business-id" className="text-sm font-medium">Business Account ID *</Label>
                    <motion.div
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        id="business-id"
                        value={formData.business_account_id}
                        onChange={(e) => setFormData({ ...formData, business_account_id: e.target.value })}
                        placeholder="Ejemplo: 987654321098765"
                        className="mt-1 transition-all duration-300 focus:shadow-lg focus:shadow-blue-500/10"
                      />
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ID de tu cuenta de WhatsApp Business
                    </p>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Verificación Final
                </CardTitle>
                <CardDescription>
                  Revisa tu configuración antes de finalizar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Phone Number ID:</div>
                    <div className="text-sm text-gray-600 font-mono">{formData.phone_number_id}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Business Account ID:</div>
                    <div className="text-sm text-gray-600 font-mono">{formData.business_account_id}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Access Token:</div>
                    <div className="text-sm text-gray-600 font-mono">
                      {formData.access_token ? "••••••••••••••••" + formData.access_token.slice(-4) : ""}
                    </div>
                  </div>
                  
                  {whatsappIntegration && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-700 mb-2">Estado de la Integración:</div>
                      <div className="space-y-1 text-xs text-blue-600">
                        <div>• Activa: {whatsappIntegration.is_active ? '✅ Sí' : '❌ No'}</div>
                        <div>• Verificada: {whatsappIntegration.is_verified ? '✅ Sí' : '⏳ Pendiente'}</div>
                        <div>• Webhook URL configurada: ✅ Sí</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-2">Información importante</h4>
                      <p className="text-sm text-yellow-800 mb-2">
                        El <strong>Phone Number ID</strong> debe coincidir exactamente con el que Meta envía en los webhooks.
                      </p>
                      <p className="text-sm text-yellow-800">
                        <strong>ID recibido en webhook:</strong> <code className="bg-yellow-100 px-1 rounded">793528520499781</code>
                      </p>
                      <p className="text-sm text-yellow-800 mt-1">
                        <strong>ID configurado:</strong> <code className="bg-yellow-100 px-1 rounded">{formData.phone_number_id}</code>
                      </p>
                      {formData.phone_number_id !== "793528520499781" && (
                        <p className="text-sm text-red-600 mt-2 font-medium">
                          ⚠️ Los IDs no coinciden. El bot no funcionará hasta que se corrija.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Configuración lista</h4>
                      <p className="text-sm text-green-800 mt-1">
                        Tu bot estará listo para recibir mensajes de WhatsApp una vez que guardes esta configuración.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}
          </motion.div>
        </div>

        {/* Botones de navegación */}
        <motion.div 
          className="flex justify-between pt-4 border-t"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 transition-all duration-300"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
          </motion.div>

          {currentStep < configSteps.length ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={nextStep}
                disabled={currentStep === 4 && !isStepValid()}
                className="flex items-center gap-2 transition-all duration-300"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleSaveConfiguration}
                disabled={isLoading || !isStepValid()}
                className="flex items-center gap-2 transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Finalizar Configuración
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}