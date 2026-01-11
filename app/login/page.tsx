"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { motion, easeOut } from 'framer-motion'
import { MoveRight } from 'lucide-react'
import Image from 'next/image'
import AuthSuccessOverlay from '@/components/ui/auth-success-overlay'

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)
  const [userInfo, setUserInfo] = useState<{name?: string, plan?: string}>({})
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()
      
      // Check if user is already logged in
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if user has completed profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('business_name')
          .eq('id', user.id)
          .single()

        if (profile && profile.business_name && profile.business_name !== 'Mi Negocio') {
          // Mostrar animación de éxito para login con Google también
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('business_name, plan_type, subscription_status')
            .eq('id', user.id)
            .single()
            
          console.log('Google login - User profile data:', userProfile) // Debug log
          if (profileError) {
            console.error('Google login - Error fetching profile:', profileError)
          }
            
          setUserInfo({
            name: userProfile?.business_name || user.email?.split('@')[0],
            plan: userProfile?.plan_type || 'trial'
          })
          
          // Prefetch dashboard while animation is preparing
          router.prefetch('/dashboard')
          
          setShowSuccessOverlay(true)
        } else {
          router.push('/register/complete')
        }
      }
    }

    // Listen for auth state changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        handleAuthCallback()
      }
    })

    // Check current auth state
    handleAuthCallback()

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      if (user) {
        // Obtener información del usuario para la animación
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('business_name, plan_type, subscription_status')
          .eq('id', user.id)
          .single()

        console.log('User profile data:', profile) // Debug log
        if (profileError) {
          console.error('Error fetching profile:', profileError)
        }

        setUserInfo({
          name: profile?.business_name || user.email?.split('@')[0],
          plan: profile?.plan_type || 'trial'
        })
        
        // Prefetch dashboard while animation is preparing
        router.prefetch('/dashboard')
        
        setShowSuccessOverlay(true)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // Detectar si estamos en producción o desarrollo
      const currentOrigin = window.location.origin
      const redirectUrl = currentOrigin.includes('localhost') 
        ? `${currentOrigin}/login` 
        : `${currentOrigin}/auth/callback`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        }
      })
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: easeOut },
    },
  }

  const buttonVariants = {
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.98 },
  }

  return (
    <div className="w-full min-h-screen bg-[#2e2e2e]">
      <div className="relative min-h-screen z-10 flex items-center justify-center p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <motion.div variants={itemVariants} className="text-center mb-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Image 
                src="/ucobot-logo.png" 
                alt="UcoBot" 
                width={64} 
                height={64} 
                className="grayscale invert contrast-125"
              />
              <span className="text-5xl font-bold text-white tracking-tighter">UcoBot</span>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Green accent gradient removed for neutral/white theme */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
            <div className="relative z-10">
            <motion.div variants={itemVariants} className="text-center mb-8">
              <h1 className="text-3xl font-light text-white mb-2">
                Bienvenido de vuelta
              </h1>
              <p className="text-gray-400 text-sm">Inicia sesión en tu cuenta</p>
            </motion.div>

            <form onSubmit={handleLogin}>
              <motion.div variants={itemVariants} className="mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ingresa tu email"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-full px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition-all duration-200"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="mb-6">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-full px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition-all duration-200"
                />
              </motion.div>

              {error && (
                <motion.div 
                  variants={itemVariants}
                  className="mb-4 text-sm text-red-400 bg-red-900/20 p-3 rounded-2xl text-center"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-black rounded-full px-6 py-4 font-medium transition-all duration-300 flex items-center justify-center group disabled:opacity-50 shadow-lg hover:shadow-white/20"
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                {!isLoading && <MoveRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
              </motion.button>
            </form>

            <motion.div variants={itemVariants} className="flex items-center my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-zinc-800" />
              <span className="px-4 text-gray-400 text-sm">O</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/20 to-zinc-800" />
            </motion.div>

            <motion.div variants={itemVariants} className="mb-6">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full px-6 py-4 text-white flex items-center justify-between hover:bg-zinc-800 transition-colors group disabled:opacity-50"
              >
                <div className="flex items-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continuar con Google</span>
                </div>
                <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center">
              <p className="text-gray-400 text-sm">
                ¿No tienes una cuenta?{" "}
                <Link
                  href="/register"
                  className="text-white hover:text-gray-300 transition-colors underline"
                >
                  Regístrate
                </Link>
              </p>
            </motion.div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
              ← Volver al inicio
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Auth Success Overlay */}
      <AuthSuccessOverlay
        isVisible={showSuccessOverlay}
        userName={userInfo.name}
        userPlan={userInfo.plan}
        isNewUser={false}
        onComplete={() => {
          setShowSuccessOverlay(false)
          setIsLoading(false)
          router.push('/dashboard')
        }}
      />
    </div>
  )
}
