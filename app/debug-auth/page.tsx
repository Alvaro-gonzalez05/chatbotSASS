import { createClient } from "@/lib/supabase/client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DebugAuthPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthChange = async () => {
      console.log("Checking auth state...")
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log("User:", user)
      console.log("Error:", error)
      
      if (user) {
        console.log("User is logged in, redirecting to dashboard")
        router.push('/dashboard')
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth event:", event)
        console.log("Session:", session)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log("User signed in, redirecting to dashboard")
          router.push('/dashboard')
        }
      }
    )

    handleAuthChange()

    return () => subscription.unsubscribe()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl mb-4">Debug Auth</h1>
        <p>Check the console for auth debug info</p>
      </div>
    </div>
  )
}