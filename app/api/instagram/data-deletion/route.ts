import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🗑️ Instagram data deletion request received:')
    console.log('Request body:', JSON.stringify(body, null, 2))

    // Meta envía típicamente algo como:
    // {
    //   "user_id": "instagram_user_id",
    //   "confirmation_code": "confirmation_string"
    // }

    const { user_id, confirmation_code } = body

    if (!user_id) {
      return NextResponse.json({ 
        error: 'Missing user_id' 
      }, { status: 400 })
    }

    // Aquí deberías:
    // 1. Validar el confirmation_code si es necesario
    // 2. Eliminar todos los datos del usuario de tu base de datos
    // 3. Log de la eliminación para auditoría

    const supabase = createAdminClient()
    
    // Ejemplo: Eliminar conversaciones del usuario de Instagram
    await supabase
      .from('conversations')
      .delete()
      .eq('participant_id', user_id)
      .eq('platform', 'instagram')

    // Ejemplo: Eliminar mensajes relacionados
    await supabase
      .from('messages')
      .delete()
      .eq('sender_type', 'user')
      .like('content', `%${user_id}%`)

    console.log(`✅ Data deletion completed for Instagram user: ${user_id}`)

    // Meta espera una respuesta con URL de confirmación
    return NextResponse.json({
      url: `${process.env.NEXTAUTH_URL}/api/instagram/data-deletion/status?user_id=${user_id}`,
      confirmation_code: confirmation_code
    })

  } catch (error) {
    console.error('Error processing data deletion request:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Endpoint para verificar el estado de eliminación
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const user_id = url.searchParams.get('user_id')

  return NextResponse.json({
    message: `Data deletion request processed for user: ${user_id}`,
    status: 'completed',
    timestamp: new Date().toISOString()
  })
}