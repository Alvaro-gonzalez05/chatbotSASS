"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface UseLogoutAnimationProps {
  userName?: string
  userPlan?: string
  redirectTo?: string
}

export function useLogoutAnimation({ 
  userName, 
  userPlan = "trial", 
  redirectTo = "/" 
}: UseLogoutAnimationProps = {}) {
  const [showLogoutAnimation, setShowLogoutAnimation] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const logout = async () => {
    setShowLogoutAnimation(true)
    
    // Hacer el logout real en background
    await supabase.auth.signOut()
  }

  const handleAnimationComplete = () => {
    setShowLogoutAnimation(false)
    router.push(redirectTo)
  }

  return {
    showLogoutAnimation,
    logout,
    handleAnimationComplete,
    animationProps: {
      isVisible: showLogoutAnimation,
      userName,
      userPlan,
      onComplete: handleAnimationComplete
    }
  }
}