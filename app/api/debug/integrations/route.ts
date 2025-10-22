import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log("🔍 Obteniendo todas las integraciones...")

    // Obtener todas las integraciones
    const { data: integrations, error: integrationsError } = await supabase
      .from('integrations')
      .select('*')

    if (integrationsError) {
      throw integrationsError
    }

    console.log("📊 Integraciones encontradas:", integrations)

    return NextResponse.json({
      integrations: integrations || [],
      count: integrations?.length || 0
    })
  } catch (error) {
    console.error('❌ Error obteniendo integraciones:', error)
    return NextResponse.json(
      { error: 'Error obteniendo integraciones', details: error },
      { status: 500 }
    )
  }
}