"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import LogoutAnimation from "@/components/ui/logout-animation"
import { useLogoutAnimation } from "@/hooks/use-logout-animation"

interface LogoutButtonProps {
  userName?: string
  userPlan?: string
  redirectTo?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children?: React.ReactNode
}

export default function LogoutButton({
  userName,
  userPlan = "trial",
  redirectTo = "/",
  variant = "outline",
  size = "default",
  className,
  children
}: LogoutButtonProps) {
  const { logout, animationProps } = useLogoutAnimation({
    userName,
    userPlan,
    redirectTo
  })

  const handleClick = async () => {
    await logout()
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
      >
        <LogOut className="w-4 h-4 mr-2" />
        {children || "Cerrar Sesión"}
      </Button>
      
      <LogoutAnimation {...animationProps} />
    </>
  )
}