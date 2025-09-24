import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PromotionsManagement } from "@/components/dashboard/promotions-management"

export default async function PromotionsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  // Get promotions and rewards for this user
  const [{ data: promotions }, { data: rewards }] = await Promise.all([
    supabase.from("promotions").select("*").eq("user_id", data.user.id).order("created_at", { ascending: false }),
    supabase.from("rewards").select("*").eq("user_id", data.user.id).order("created_at", { ascending: false }),
  ])

  return (
    <PromotionsManagement initialPromotions={promotions || []} initialRewards={rewards || []} userId={data.user.id} />
  )
}
