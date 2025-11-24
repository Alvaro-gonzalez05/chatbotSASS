import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BotsManagement } from "@/components/dashboard/bots-management"
import { PageTransition } from "@/components/ui/page-transition"

export default async function BotsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  // Get bots for this user
  const { data: bots } = await supabase
    .from("bots")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  return (
    <BotsManagement initialBots={bots || []} userId={data.user.id} />
  )
}
