import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Endpoint para procesar la cola de mensajes programados
// Se puede llamar manualmente o desde un cron job
export async function POST(request: NextRequest) {
  try {
    const { batch_size = 50, user_id } = await request.json().catch(() => ({}))
    
    console.log('🚀 Processing message queue...', { batch_size, user_id })
    
    const supabase = createAdminClient()

    // Obtener mensajes pendientes para enviar
    let query = supabase
      .from('scheduled_messages')
      .select(`
        *,
        automations!inner(*, bots!inner(*)),
        clients(name, phone)
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: true })
      .order('scheduled_for', { ascending: true })
      .limit(batch_size)

    // Filtrar por usuario si se especifica
    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { data: pendingMessages, error: fetchError } = await query

    if (fetchError) {
      console.error('❌ Error fetching pending messages:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      console.log('ℹ️ No pending messages to process')
      return NextResponse.json({ 
        processed: 0, 
        remaining: 0, 
        message: 'No pending messages' 
      })
    }

    console.log(`📤 Found ${pendingMessages.length} messages to process`)

    let processed = 0
    let failed = 0

    // Procesar cada mensaje
    for (const message of pendingMessages) {
      try {
        // Marcar como procesando
        await supabase
          .from('scheduled_messages')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', message.id)

        // Determinar la plataforma del bot
        const bot = message.automations.bots
        const platform = bot.platform

        // Enviar usando la función unificada multi-plataforma
        console.log(`📤 Processing message for ${platform}:`, {
          recipient: message.recipient_name,
          contact: message.recipient_phone || message.recipient_email || message.recipient_instagram_id,
          automation: message.automations.name
        })

        const result = await sendMessage(message, bot)
        const success = result.success
        const externalMessageId = result.messageId || null
        const errorMessage = result.error || null

        if (success) {
          console.log(`✅ Message sent successfully via ${platform}:`, externalMessageId)
        } else {
          console.error(`❌ Failed to send ${platform} message:`, errorMessage)
        }

        // Actualizar estado del mensaje
        const updateData: any = {
          status: success ? 'sent' : 'failed',
          updated_at: new Date().toISOString()
        }

        if (success) {
          updateData.sent_at = new Date().toISOString()
          updateData.external_message_id = externalMessageId
          processed++
        } else {
          updateData.error_message = errorMessage
          updateData.retry_count = (message.retry_count || 0) + 1
          failed++
        }

        await supabase
          .from('scheduled_messages')
          .update(updateData)
          .eq('id', message.id)

        // Crear log de la ejecución
        await supabase
          .from('automation_logs')
          .insert({
            automation_id: message.automation_id,
            client_id: message.client_id,
            scheduled_message_id: message.id,
            log_type: success ? 'sent' : 'failed',
            message_content: message.message_content,
            recipient_phone: message.recipient_phone,
            success: success,
            error_details: errorMessage,
            external_message_id: externalMessageId
          })

        console.log(`${success ? '✅' : '❌'} Message ${message.id}: ${success ? 'sent' : 'failed'}`)

      } catch (messageError) {
        console.error('💥 Error processing message:', message.id, messageError)
        failed++
        
        // Marcar mensaje como fallido
        await supabase
          .from('scheduled_messages')
          .update({
            status: 'failed',
            error_message: messageError instanceof Error ? messageError.message : 'Unknown error',
            retry_count: (message.retry_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', message.id)
      }
    }

    // Contar mensajes restantes
    const { count: remainingCount } = await supabase
      .from('scheduled_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())

    console.log('📊 Processing completed:', { processed, failed, remaining: remainingCount || 0 })

    return NextResponse.json({
      processed,
      failed,
      remaining: remainingCount || 0,
      success: true
    })

  } catch (error) {
    console.error('💥 Queue processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Función para enviar mensaje según la plataforma
async function sendMessage(message: any, bot: any): Promise<{success: boolean, messageId?: string, error?: string}> {
  try {
    switch (bot.platform) {
      case 'whatsapp':
        return await sendWhatsAppMessage(message, bot)
      case 'instagram':
        return await sendInstagramMessage(message, bot)
      case 'gmail':
        return await sendGmailMessage(message, bot)
      default:
        return { success: false, error: `Unsupported platform: ${bot.platform}` }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown sending error' 
    }
  }
}

// Función para enviar mensaje por WhatsApp
async function sendWhatsAppMessage(message: any, bot: any): Promise<{success: boolean, messageId?: string, error?: string}> {
  try {
    // Obtener configuración de WhatsApp del bot
    const supabase = createAdminClient()
    
    // Buscar primero en whatsapp_integrations (tabla específica que usa bot_id)
    let whatsappConfig = null
    let configError = null
    
    const { data: specificConfig, error: specificError } = await supabase
      .from('whatsapp_integrations')
      .select('*')
      .eq('bot_id', bot.id)
      .eq('is_active', true)
      .single()

    if (specificConfig) {
      whatsappConfig = specificConfig
    } else {
      // Si no está en whatsapp_integrations, buscar en integrations (tabla consolidada que usa user_id)
      const { data: genericConfig, error: genericError } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', message.user_id) // Usar user_id en lugar de bot_id
        .eq('platform', 'whatsapp')
        .eq('is_active', true)
        .single()
      
      if (genericConfig && genericConfig.config) {
        // Extraer la configuración del JSONB
        whatsappConfig = {
          phone_number_id: genericConfig.config.phone_number_id,
          access_token: genericConfig.config.access_token,
          ...genericConfig.config
        }
      } else {
        configError = genericError
      }
    }

    if (!whatsappConfig) {
      console.error('[WhatsApp] Configuration not found:', specificError, configError)
      return { success: false, error: 'WhatsApp integration not found or inactive' }
    }

    // Preparar el mensaje para WhatsApp Business API
    const messagePayload = {
      messaging_product: 'whatsapp',
      to: message.recipient_phone,
      type: 'text',
      text: {
        body: message.message_content
      }
    }

    // Enviar via WhatsApp Business API
    const response = await fetch(`https://graph.facebook.com/v18.0/${whatsappConfig.phone_number_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappConfig.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    })

    const result = await response.json()

    if (response.ok && result.messages && result.messages[0]) {
      return { 
        success: true, 
        messageId: result.messages[0].id 
      }
    } else {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to send WhatsApp message' 
      }
    }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown WhatsApp error' 
    }
  }
}

// Función para enviar mensaje por Instagram
async function sendInstagramMessage(message: any, bot: any): Promise<{success: boolean, messageId?: string, error?: string}> {
  try {
    // Obtener configuración de Instagram del bot
    const supabase = createAdminClient()
    
    // Buscar primero en instagram_integrations (tabla específica que usa bot_id)
    let instagramConfig = null
    
    const { data: specificConfig, error: specificError } = await supabase
      .from('instagram_integrations')
      .select('*')
      .eq('bot_id', bot.id)
      .eq('is_active', true)
      .single()

    if (specificConfig) {
      instagramConfig = specificConfig
    } else {
      // Si no está en instagram_integrations, buscar en integrations (tabla consolidada que usa user_id)
      const { data: genericConfig, error: genericError } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', message.user_id) // Usar user_id en lugar de bot_id
        .eq('platform', 'instagram')
        .eq('is_active', true)
        .single()
      
      if (genericConfig && genericConfig.config) {
        // Extraer la configuración del JSONB
        instagramConfig = {
          page_id: genericConfig.config.page_id,
          access_token: genericConfig.config.access_token,
          ...genericConfig.config
        }
      }
    }

    if (!instagramConfig) {
      console.error('[Instagram] Configuration not found:', specificError)
      return { success: false, error: 'Instagram integration not found or inactive' }
    }

    // Preparar el mensaje para Instagram Messaging API
    const messagePayload = {
      recipient: {
        id: message.recipient_instagram_id // Necesitarás almacenar el Instagram ID del cliente
      },
      message: {
        text: message.message_content
      }
    }

    // Enviar via Instagram Messaging API
    const response = await fetch(`https://graph.facebook.com/v18.0/${instagramConfig.page_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${instagramConfig.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    })

    const result = await response.json()

    if (response.ok && result.message_id) {
      return { 
        success: true, 
        messageId: result.message_id 
      }
    } else {
      return { 
        success: false, 
        error: result.error?.message || 'Failed to send Instagram message' 
      }
    }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown Instagram error' 
    }
  }
}

// Función para enviar Gmail
async function sendGmailMessage(message: any, bot: any): Promise<{success: boolean, messageId?: string, error?: string}> {
  try {
    // Obtener configuración de gmail del bot
    const supabase = createAdminClient()
    const { data: gmailConfig, error: configError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', bot.user_id)
      .eq('platform', 'gmail')
      .eq('is_active', true)
      .single()

    if (configError || !gmailConfig) {
      return { success: false, error: 'Gmail integration not found or inactive' }
    }

    let result: any

    switch (gmailConfig.config.provider) {
      case 'sendgrid':
        result = await sendViaSendGrid(message, gmailConfig.config)
        break
      case 'mailgun':
        result = await sendViaMailgun(message, gmailConfig.config)
        break
      case 'ses':
        result = await sendViaSES(message, gmailConfig.config)
        break
      default:
        return { success: false, error: `Unsupported email provider: ${gmailConfig.config.provider}` }
    }

    return result

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email error' 
    }
  }
}

// Enviar email via SendGrid
async function sendViaSendGrid(message: any, config: any): Promise<{success: boolean, messageId?: string, error?: string}> {
  try {
    const emailPayload = {
      personalizations: [{
        to: [{ email: message.recipient_email }],
        subject: message.subject || 'Mensaje automático'
      }],
      from: { email: config.from_email, name: config.from_name },
      content: [{
        type: 'text/plain',
        value: message.message_content
      }]
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })

    if (response.ok) {
      const messageId = response.headers.get('x-message-id') || 'sendgrid_sent'
      return { success: true, messageId }
    } else {
      const error = await response.text()
      return { success: false, error: `SendGrid error: ${error}` }
    }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'SendGrid sending error' 
    }
  }
}

// Enviar email via Mailgun
async function sendViaMailgun(message: any, config: any): Promise<{success: boolean, messageId?: string, error?: string}> {
  // Implementación similar para Mailgun
  return { success: false, error: 'Mailgun implementation pending' }
}

// Enviar email via Amazon SES
async function sendViaSES(message: any, config: any): Promise<{success: boolean, messageId?: string, error?: string}> {
  // Implementación similar para Amazon SES
  return { success: false, error: 'SES implementation pending' }
}

// Endpoint GET para verificar el estado de la cola
export async function GET() {
  try {
    const supabase = createAdminClient()
    
    // Obtener estadísticas de la cola
    const { data: stats, error } = await supabase
      .from('scheduled_messages')
      .select('status')
    
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
    
    const statusCounts = stats.reduce((acc: any, msg: any) => {
      acc[msg.status] = (acc[msg.status] || 0) + 1
      return acc
    }, {})
    
    return NextResponse.json({
      total: stats.length,
      by_status: statusCounts,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}