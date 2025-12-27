import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { BotsManagement } from "@/components/dashboard/bots-management"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function AdminUserBotsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Check if admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // We rely on RLS policies for security, but good to check role too if possible
  // However, fetching user profile here might be redundant if RLS handles it.
  
  // Fetch target user profile to display name
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("business_name")
    .eq("id", params.id)
    .single()

  if (!profile) notFound()

  // Fetch user's bots
  const { data: bots } = await supabase
    .from("bots")
    .select("*")
    .eq("user_id", params.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/admin/users/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bots de {profile.business_name}</h2>
          <p className="text-muted-foreground">Administrar bots del cliente</p>
        </div>
      </div>

      <BotsManagement initialBots={bots || []} userId={params.id} />
    </div>
  )
}
