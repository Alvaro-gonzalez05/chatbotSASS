"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, CheckCircle, Sparkles, User, Crown, Loader2, Waves } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface LogoutAnimationProps {
  isVisible: boolean
  userName?: string
  userPlan?: string
  onComplete?: () => void
}

export default function LogoutAnimation({
  isVisible,
  userName,
  userPlan = "trial",
  onComplete
}: LogoutAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (!isVisible) return

    const steps = [
      { delay: 500, duration: 800 },    // Aparición inicial
      { delay: 1300, duration: 1000 },  // Ícono de logout animado
      { delay: 2500, duration: 800 },   // Mensaje de despedida
      { delay: 3500, duration: 600 },   // Información final
      { delay: 4300, duration: 800 },   // Preparando redirección
    ]

    const timers = steps.map((step, index) => {
      return setTimeout(() => {
        setCurrentStep(index + 1)
      }, step.delay)
    })

    // Redirección automática después de la animación
    const redirectTimer = setTimeout(() => {
      if (onComplete) {
        onComplete()
      } else {
        router.push('/')
      }
    }, 5500)

    return () => {
      timers.forEach(timer => clearTimeout(timer))
      clearTimeout(redirectTimer)
    }
  }, [isVisible, router, onComplete])

  const getPlanInfo = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'premium':
        return { label: 'Premium', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: Crown }
      case 'pro':
        return { label: 'Pro', color: 'bg-gradient-to-r from-indigo-500 to-purple-500', icon: Crown }
      case 'basic':
        return { label: 'Básico', color: 'bg-gradient-to-r from-blue-500 to-cyan-500', icon: User }
      case 'enterprise':
        return { label: 'Empresarial', color: 'bg-gradient-to-r from-amber-500 to-orange-500', icon: Crown }
      case 'trial':
        return { label: 'Prueba Gratuita', color: 'bg-gradient-to-r from-green-500 to-emerald-500', icon: User }
      default:
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
        exit={{ opacity: 0 }}
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
                  <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto" />
                  <h2 className="text-xl font-semibold text-gray-700">
                    Cerrando sesión...
                  </h2>
                </motion.div>
              )}

              {/* Animated Logout Icon */}
              {currentStep >= 2 && (
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ 
                    scale: 1,
                    rotate: 0
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 10,
                    duration: 1
                  }}
                  className="relative mx-auto w-20 h-20"
                >
                  <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
                  <div className="relative flex items-center justify-center w-full h-full bg-red-500 rounded-full">
                    <LogOut className="w-12 h-12 text-white" />
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
                        <Sparkles className="w-4 h-4 text-orange-400" />
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {/* Farewell Message */}
              {currentStep >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1,
                    y: 0
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Waves className="w-6 h-6 text-gray-600" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      ¡Hasta luego!
                    </h2>
                  </div>
                  <p className="text-lg text-gray-600">
                    Sesión cerrada exitosamente
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
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {userName && (
                    <div className="flex items-center justify-center gap-2">
                      <User className="w-5 h-5 text-gray-500" />
                      <span className="text-lg font-medium text-gray-700">
                        Gracias, {userName}
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

                  <p className="text-sm text-gray-500 mt-4">
                    ¡Esperamos verte pronto de nuevo!
                  </p>
                </motion.div>
              )}

              {/* Redirect Message */}
              {currentStep >= 5 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-3"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="h-1 bg-gradient-to-r from-red-400 to-orange-500 rounded-full mx-auto"
                  />
                  <p className="text-sm text-gray-500">
                    Redirigiendo a la página principal...
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