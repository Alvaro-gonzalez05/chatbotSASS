"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { motion } from 'framer-motion'
import { MoveRight, Check } from 'lucide-react'
import Image from 'next/image'

export default function CompleteRegistrationPage() {
  const [businessName, setBusinessName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Check if user already has a profile with business_name
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('business_name')
        .eq('id', user.id)
        .single()

      if (profile && profile.business_name && profile.business_name !== 'Mi Negocio') {
        // User already completed registration, redirect to dashboard
        sessionStorage.setItem('loginSuccess', 'true')
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    }
  }

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!businessName.trim()) {
      setError("Por favor ingresa el nombre de tu negocio")
      setIsLoading(false)
      return
    }

    try {
      // Update user profile with business name
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          business_name: businessName.trim(),
          business_info: {} 
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Set login success flag for animation (new user completed registration)
      sessionStorage.setItem('loginSuccess', 'true')
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const buttonVariants = {
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.98 },
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="relative min-h-screen z-10 flex items-center justify-center p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <motion.div variants={itemVariants} className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Image src="/ucobot-logo.png" alt="UcoBot" width={32} height={32} />
              <span className="text-2xl font-bold">UcoBot</span>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-[#3F3F3F] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Green accent gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-transparent to-green-50/20 dark:from-green-900/10 dark:via-transparent dark:to-green-900/5 pointer-events-none" />
            <div className="relative z-10">
              <motion.div variants={itemVariants} className="text-center mb-8">
                <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-2">
                  ¡Casi terminamos!
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Solo necesitamos un dato más para completar tu registro
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-gradient-to-br from-green-50 to-gray-50 dark:from-green-900/20 dark:to-[#1B1B1B] rounded-2xl p-6 border border-green-100 dark:border-green-900/30 mb-6">
                <h4 className="font-medium text-lg mb-4 text-gray-900 dark:text-white flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Tu cuenta de Google está conectada
                </h4>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Email verificado: {user?.email}
                </div>
              </motion.div>

              <form onSubmit={handleCompleteRegistration}>
                <motion.div variants={itemVariants} className="mb-6">
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Nombre de tu negocio"
                    required
                    className="w-full bg-gray-100 dark:bg-[#1B1B1B] border border-gray-300 dark:border-white/20 rounded-full px-6 py-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                  />
                </motion.div>

                {error && (
                  <motion.div 
                    variants={itemVariants}
                    className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl text-center"
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
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 dark:from-green-500 dark:to-green-600 dark:hover:from-green-600 dark:hover:to-green-700 text-white rounded-full px-6 py-4 font-medium transition-all duration-300 flex items-center justify-center group disabled:opacity-50 shadow-lg hover:shadow-green-500/30"
                >
                  {isLoading ? "Completando registro..." : "Comenzar Prueba Gratuita"}
                  {!isLoading && <MoveRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                </motion.button>
              </form>

              <motion.div variants={itemVariants} className="text-center mt-6">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Al continuar, aceptas nuestros términos y condiciones
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}