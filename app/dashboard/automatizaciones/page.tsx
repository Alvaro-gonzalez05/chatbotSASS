import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AutomationsManagement } from "@/components/dashboard/automations-management"

export default async function AutomationsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  // Get automations for this user
  const { data: automations } = await supabase
    .from("automations")
    .select(`
      *,
      bots(id, name, platform),
      promotions(id, name)
    `)
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  return <AutomationsManagement initialAutomations={automations || []} userId={data.user.id} />
}
