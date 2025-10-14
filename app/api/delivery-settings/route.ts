import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: settings, error: settingsError } = await supabase
      .from("delivery_settings")
      .select("*")
      .eq("user_id", data.user.id)
      .single()

    if (settingsError) {
      console.error("Error fetching delivery settings:", settingsError)
      return NextResponse.json({ error: "Error fetching settings" }, { status: 500 })
    }

    return NextResponse.json({ settings })

  } catch (error) {
    console.error("Error in delivery settings GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settingsData = await request.json()

    // Upsert delivery settings
    const { data: settings, error: settingsError } = await supabase
      .from("delivery_settings")
      .upsert(
        {
          user_id: data.user.id,
          ...settingsData,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id'
        }
      )
      .select()
      .single()

    if (settingsError) {
      console.error("Error upserting delivery settings:", settingsError)
      return NextResponse.json({ error: "Error saving settings" }, { status: 500 })
    }

    return NextResponse.json({ settings })

  } catch (error) {
    console.error("Error in delivery settings POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}