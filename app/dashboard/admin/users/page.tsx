import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserListCard } from "@/components/dashboard/admin/user-list-card"

import Link from "next/link"

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">Administra los perfiles y suscripciones de los clientes.</p>
        </div>
      </div>

      <div className="space-y-8">
        {users?.map((user) => (
          <UserListCard key={user.id} user={user} />
        ))}
        
        {(!users || users.length === 0) && (
          <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
            No hay usuarios registrados.
          </div>
        )}
      </div>
    </div>
  )
}
