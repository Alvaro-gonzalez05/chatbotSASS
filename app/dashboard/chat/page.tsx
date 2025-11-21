import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatView } from "../../../components/dashboard/chat/chat-view"

export default async function ChatPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/login")
  }

  return (
    <div className="h-[calc(100vh-4rem)] p-4">
      <ChatView userId={data.user.id} />
    </div>
  )
}
