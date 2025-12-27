import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { ChatView } from "@/components/dashboard/chat/chat-view"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function AdminUserChatPage({ 
  params,
  searchParams 
}: { 
  params: { id: string }
  searchParams: { from?: string }
}) {
  const supabase = await createClient()

  // Check if admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Determine back link
  const backLink = searchParams.from === 'list' 
    ? '/dashboard/admin/users' 
    : `/dashboard/admin/users/${params.id}`

  // Fetch target user profile to display name
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("business_name")
    .eq("id", params.id)
    .single()

  if (!profile) notFound()

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center gap-4 p-4 border-b bg-background">
        <Button variant="ghost" size="icon" asChild>
          <Link href={backLink}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-lg font-semibold">Chats de {profile.business_name}</h2>
          <p className="text-xs text-muted-foreground">Visualizando como administrador</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatView userId={params.id} />
      </div>
    </div>
  )
}
