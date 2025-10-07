import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { to, message, botId, conversationId } = await request.json()

    if (!to || !message || !botId) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message, botId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get WhatsApp integration for the bot
    const { data: integration, error: integrationError } = await supabase
      .from('whatsapp_integrations')
      .select('*')
      .eq('bot_id', botId)
      .eq('is_active', true)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'No active WhatsApp integration found for this bot' },
        { status: 404 }
      )
    }

    // Send message via WhatsApp Business API
    const result = await sendWhatsAppMessage(
      integration.access_token,
      integration.phone_number_id,
      to,
      message
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Store outbound message in database
    if (conversationId) {
      await supabase
        .from('whatsapp_messages')
        .insert({
          integration_id: integration.id,
          conversation_id: conversationId,
          whatsapp_message_id: result.messageId,
          sender_phone: integration.phone_number_id,
          recipient_phone: to,
          message_type: 'text',
          message_content: { type: 'text', text: message },
          direction: 'outbound',
          status: 'sent'
        })

      // Also store in conversations messages table
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: message,
          sender_type: 'assistant',
          platform_message_id: result.messageId
        })
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId 
    })

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
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
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'text',
        text: {
          body: message
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('WhatsApp API Error:', errorData)
      return {
        success: false,
        error: `WhatsApp API error: ${errorData.error?.message || response.statusText}`
      }
    }

    const result = await response.json()
    console.log('WhatsApp message sent successfully:', result)

    return {
      success: true,
      messageId: result.messages[0]?.id
    }

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return {
      success: false,
      error: 'Failed to send WhatsApp message'
    }
  }
}

// GET endpoint to check WhatsApp integration status
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const botId = url.searchParams.get('botId')

    if (!botId) {
      return NextResponse.json(
        { error: 'botId parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: integration, error } = await supabase
      .from('whatsapp_integrations')
      .select('is_active, is_verified, phone_number_id, webhook_verified_at')
      .eq('bot_id', botId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      isActive: integration.is_active,
      isVerified: integration.is_verified,
      phoneNumberId: integration.phone_number_id,
      webhookVerifiedAt: integration.webhook_verified_at
    })

  } catch (error) {
    console.error('Error checking WhatsApp status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}