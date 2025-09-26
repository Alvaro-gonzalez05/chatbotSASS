"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('Error getting user:', userError)
          router.push('/login?error=auth_failed')
          return
        }

        // Check if this is a new user by looking at their profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('business_name, created_at')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError)
          // If there's an error but not "not found", still try to complete registration
          router.push('/register/complete')
          return
        }

        // Check if user needs to complete registration
        if (!profile || !profile.business_name || profile.business_name === 'Mi Negocio') {
          // New user or incomplete profile - redirect to complete registration
          router.push('/register/complete')
        } else {
          // Existing user with complete profile - redirect to dashboard
          router.push('/dashboard')
        }

      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        router.push('/login?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [router, supabase])

  return (
    <div className="w-full min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Completando tu registro...
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Te estamos redirigiendo, por favor espera.
        </p>
      </div>
    </div>
  )
}