"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import ProfileDropdown from "./ProfileDropdown"
import NotificationsDropdown from "./NotificationsDropdown"
import Image from "next/image"

interface DashboardHeaderProps {
  user: User
  profile: any
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  return (
    <header className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-background border-b border-border">
      {/* Left side - Logo and Company Info */}
      <div className="flex items-center space-x-3 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Image
            src="/ucobot-logo.png"
            alt="UcoBot Logo"
            width={32}
            height={32}
            className="w-8 h-8 sm:w-10 sm:h-10"
          />
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-bold text-foreground">UcoBot</span>
            <span className="text-xs sm:text-sm text-muted-foreground/70">CODEA DESARROLLOS</span>
          </div>
        </div>
      </div>

      {/* Center - Business name (hidden on mobile) */}
      <div className="hidden lg:flex items-center justify-center flex-1 min-w-0 mx-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground truncate">
            {profile?.business_name || "Mi Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus chatbots y clientes
          </p>
        </div>
      </div>

      {/* Right side - Profile and notifications */}
      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
        {/* User Profile Dropdown */}
        <ProfileDropdown user={user} profile={profile} />
        
        {/* Notifications Dropdown */}
        <NotificationsDropdown />
      </div>
    </header>
  )
}
