import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { to, message, conversationId } = await request.json()

    if (!to || !message || !conversationId) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message, conversationId' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get conversation to find bot and user
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, bots(*)')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Enforce rule: Manual messages only allowed when AI is paused
    if (conversation.status !== 'paused') {
      return NextResponse.json(
        { error: 'Cannot send manual messages while AI is active. Please pause the AI first.' },
        { status: 403 }
      )
    }

    const bot = conversation.bots
    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found for this conversation' },
        { status: 404 }
      )
    }

    const platform = conversation.platform

    // Get integration for the user and platform
    const { data: integrations, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', bot.user_id)
      .eq('platform', platform)
      .eq('is_active', true)

    if (integrationError || !integrations || integrations.length === 0) {
      return NextResponse.json(
        { error: `No active ${platform} integration found` },
        { status: 404 }
      )
    }

    const integration = integrations[0]
    const accessToken = integration.config?.access_token

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Invalid configuration: missing access token' },
        { status: 500 }
      )
    }

    let result;

    if (platform === 'whatsapp') {
        const phoneNumberId = integration.config?.phone_number_id
        if (!phoneNumberId) {
             return NextResponse.json({ error: 'Invalid WhatsApp configuration' }, { status: 500 })
        }
        result = await sendWhatsAppMessage(accessToken, phoneNumberId, to, message)
    } else if (platform === 'instagram') {
        result = await sendInstagramMessage(accessToken, to, message)
    } else {
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Store outbound message in database
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: message,
        sender_type: 'bot', 
        message_type: 'text',
        metadata: {
          platform_message_id: result.messageId,
          sent_by: 'agent'
        }
      })

    if (msgError) {
      console.error('Error storing sent message:', msgError)
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId 
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function sendWhatsAppMessage(
  accessToken: string,
  phoneNumberId: string,
  recipientPhone: string,
  message: string
) {
  try {
    // Normalize phone number for Argentina (remove extra 9)
    let normalizedPhone = recipientPhone
    if (recipientPhone.startsWith('549')) {
      normalizedPhone = '54' + recipientPhone.substring(3)
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizedPhone,
        type: 'text',
        text: { body: message }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('WhatsApp API Error:', data)
      return { success: false, error: data.error?.message || 'Unknown error' }
    }

    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return { success: false, error: 'Network error' }
  }
}

async function sendInstagramMessage(accessToken: string, recipientId: string, message: string) {
    try {
        // Using Graph API for Instagram Messaging
        // We use 'me/messages' which resolves to the Page associated with the Access Token
        const response = await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text: message }
            })
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Instagram API Error:', data)
            return { success: false, error: data.error?.message || 'Unknown error' }
        }

        return { success: true, messageId: data.message_id }
    } catch (error) {
        console.error('Error sending Instagram message:', error)
        return { success: false, error: 'Network error' }
    }
}
