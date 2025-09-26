"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import ProfileDropdown from "./ProfileDropdown"
import NotificationsDropdown from "./NotificationsDropdown"

interface DashboardHeaderProps {
  user: User
  profile: any
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background border-b border-border">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{profile?.business_name || "Mi Dashboard"}</h1>
          <p className="text-sm text-muted-foreground">Gestiona tus chatbots y clientes</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* User Profile Dropdown */}
        <ProfileDropdown user={user} profile={profile} />
        
        {/* Notifications Dropdown */}
        <NotificationsDropdown />
      </div>
    </header>
  )
}
