"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Sparkles, User, Crown, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface AuthSuccessOverlayProps {
  isVisible: boolean
  userName?: string
  userPlan?: string
  isNewUser?: boolean
  onComplete?: () => void
}

export default function AuthSuccessOverlay({
  isVisible,
  userName,
  userPlan = "trial",
  isNewUser = false,
  onComplete
}: AuthSuccessOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (!isVisible) return

    const steps = [
      { delay: 800, duration: 1000 },   // Aparición inicial (más tiempo)
      { delay: 1800, duration: 1200 },  // Check animado (más tiempo)
      { delay: 3200, duration: 800 },   // Mensaje de bienvenida
      { delay: 4200, duration: 600 },   // Información del usuario
      { delay: 5000, duration: 800 },   // Preparando redirección
    ]

    const timers = steps.map((step, index) => {
      return setTimeout(() => {
        setCurrentStep(index + 1)
      }, step.delay)
    })

    // Redirección automática después de la animación (más tiempo)
    const redirectTimer = setTimeout(() => {
      // Prefetch dashboard for faster loading
      router.prefetch('/dashboard')
      
      if (onComplete) {
        onComplete()
      } else {
        // Use replace instead of push to prevent back navigation
        router.replace('/dashboard')
      }
    }, 6200)

    return () => {
      timers.forEach(timer => clearTimeout(timer))
      clearTimeout(redirectTimer)
    }
  }, [isVisible, router, onComplete])

  const getPlanInfo = (plan: string) => {
    console.log('Getting plan info for:', plan) // Debug log
    switch (plan?.toLowerCase()) {
      case 'premium':
        return { label: 'Premium', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: Crown }
      case 'basic':
        return { label: 'Básico', color: 'bg-gradient-to-r from-blue-500 to-cyan-500', icon: User }
      case 'enterprise':
        return { label: 'Empresarial', color: 'bg-gradient-to-r from-amber-500 to-orange-500', icon: Crown }
      case 'trial':
        return { label: 'Prueba Gratuita', color: 'bg-gradient-to-r from-green-500 to-emerald-500', icon: User }
      default:
        console.warn('Unknown plan type:', plan) // Debug warning
        return { label: 'Prueba Gratuita', color: 'bg-gradient-to-r from-gray-500 to-gray-600', icon: User }
    }
  }

  const planInfo = getPlanInfo(userPlan)
  const PlanIcon = planInfo.icon

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 1 }} // Keep opacity 1 on exit to prevent flash
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <Card className="w-full max-w-md mx-4 border-0 shadow-2xl bg-white/95 backdrop-blur">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              
              {/* Loading State */}
              {currentStep === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
                  <h2 className="text-xl font-semibold text-gray-700">
                    {isNewUser ? "Creando tu cuenta..." : "Iniciando sesión..."}
                  </h2>
                </motion.div>
              )}

              {/* Animated Check Icon */}
              {currentStep >= 2 && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ 
                    scale: 1,
                    rotate: 0
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 10,
                    duration: 0.8
                  }}
                  className="relative mx-auto w-20 h-20"
                >
                  <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse" />
                  <div className="relative flex items-center justify-center w-full h-full bg-green-500 rounded-full">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                  
                  {/* Sparkles Animation */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -inset-4"
                  >
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                          x: [0, (Math.cos(i * 60 * Math.PI / 180) * 40)],
                          y: [0, (Math.sin(i * 60 * Math.PI / 180) * 40)]
                        }}
                        transition={{ 
                          duration: 1.5,
                          delay: 0.3 + i * 0.1,
                          repeat: Infinity,
                          repeatDelay: 2
                        }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      >
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {/* Success Message */}
              {currentStep >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1,
                    y: 0
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="space-y-3"
                >
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isNewUser ? "¡Bienvenido!" : "¡Inicio exitoso!"}
                  </h2>
                  <p className="text-lg text-gray-600">
                    {isNewUser 
                      ? "Tu cuenta ha sido creada correctamente"
                      : "Has iniciado sesión correctamente"
                    }
                  </p>
                </motion.div>
              )}

              {/* User Information */}
              {currentStep >= 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1,
                    y: 0
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {userName && (
                    <div className="flex items-center justify-center gap-2">
                      <User className="w-5 h-5 text-gray-500" />
                      <span className="text-lg font-medium text-gray-700">
                        {userName}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-center">
                    <Badge 
                      variant="secondary" 
                      className={`${planInfo.color} text-white border-0 px-4 py-2 text-sm font-medium`}
                    >
                      <PlanIcon className="w-4 h-4 mr-2" />
                      Plan {planInfo.label}
                    </Badge>
                  </div>
                </motion.div>
              )}

              {/* Redirect Message */}
              {currentStep >= 5 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-3"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="h-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mx-auto"
                  />
                  <p className="text-sm text-gray-500">
                    Redirigiendo al dashboard...
                  </p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}