import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🗑️ WhatsApp data deletion request received:')
    console.log('Request body:', JSON.stringify(body, null, 2))

    const { user_id, confirmation_code } = body

    if (!user_id) {
      return NextResponse.json({ 
        error: 'Missing user_id' 
      }, { status: 400 })
    }

    const supabase = createAdminClient()
    
    // Eliminar conversaciones del usuario de WhatsApp
    await supabase
      .from('conversations')
      .delete()
      .eq('participant_id', user_id)
      .eq('platform', 'whatsapp')

    // Eliminar mensajes relacionados
    await supabase
      .from('messages')
      .delete()
      .eq('sender_type', 'user')
      .like('content', `%${user_id}%`)

    console.log(`✅ Data deletion completed for WhatsApp user: ${user_id}`)

    return NextResponse.json({
      url: `${process.env.NEXTAUTH_URL}/api/whatsapp/data-deletion/status?user_id=${user_id}`,
      confirmation_code: confirmation_code
    })

  } catch (error) {
    console.error('Error processing WhatsApp data deletion request:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const user_id = url.searchParams.get('user_id')

  return NextResponse.json({
    message: `WhatsApp data deletion request processed for user: ${user_id}`,
    status: 'completed',
    timestamp: new Date().toISOString()
  })
}