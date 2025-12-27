"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, MoreHorizontal, Building2, Calendar, Shield } from "lucide-react"
import Link from "next/link"
import { UserActionsMenu } from "./user-actions-menu"

interface UserListCardProps {
  user: any
}

export function UserListCard({ user }: UserListCardProps) {
  // Get initials for avatar
  const initials = user.business_name
    ? user.business_name.substring(0, 2).toUpperCase()
    : "US"

  return (
    <div className="relative mt-6 mb-6 group">
      <div className="absolute -top-5 left-6 z-10">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-background">
          {initials}
        </div>
      </div>
      
      <Card className="pt-8 overflow-visible border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pb-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1 ml-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                {user.business_name || "Sin Nombre"}
                <Badge variant="outline" className="text-xs font-normal">
                  {user.role || 'user'}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground font-mono">{user.id}</p>
            </div>

            <div className="flex flex-wrap gap-3 md:gap-6 text-sm">
              <div className="flex flex-col items-start md:items-end">
                <span className="text-xs text-muted-foreground">Plan</span>
                <Badge variant={user.plan_type === 'pro' ? 'default' : 'secondary'} className="capitalize">
                  {user.plan_type || 'Free'}
                </Badge>
              </div>
              
              <div className="flex flex-col items-start md:items-end">
                <span className="text-xs text-muted-foreground">Estado</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${user.subscription_status === 'active' ? 'bg-green-500' : user.subscription_status === 'suspended' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                  <span className="capitalize font-medium">{user.subscription_status || 'Trial'}</span>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end">
                <span className="text-xs text-muted-foreground">Registro</span>
                <span className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-muted/20 py-2 px-6 flex justify-between items-center border-t">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Building2 className="h-3 w-3" />
            {user.location || "Sin ubicación"}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-green-100 hover:text-green-700" asChild>
              <Link href={`/dashboard/admin/users/${user.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">Ver Detalles</span>
              </Link>
            </Button>
            
            <UserActionsMenu 
              userId={user.id} 
              currentPlan={user.plan_type || 'free'} 
              currentStatus={user.subscription_status || 'trialing'}
              userName={user.business_name || 'Usuario'}
            />
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
