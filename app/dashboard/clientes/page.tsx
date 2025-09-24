import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClientsManagement } from "@/components/dashboard/clients-management"
import { PageTransition } from "@/components/ui/page-transition"

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  // Get clients for this user
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  return (
    <PageTransition>
      <ClientsManagement initialClients={clients || []} userId={data.user.id} />
    </PageTransition>
  )
}
