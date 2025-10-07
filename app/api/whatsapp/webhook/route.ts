import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Webhook verification (GET request)
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  console.log('WhatsApp Webhook Verification:', { mode, token, challenge })

  // Verify the webhook
  if (mode === 'subscribe') {
    // Get the verify token from database or environment
    const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'your-verify-token'
    
    if (token === VERIFY_TOKEN) {
      console.log('WhatsApp webhook verified successfully')
      return new NextResponse(challenge, { status: 200 })
    } else {
      console.log('WhatsApp webhook verification failed - invalid token')
      return new NextResponse('Verification failed', { status: 403 })
    }
  }

  return new NextResponse('Bad request', { status: 400 })
}

// Webhook event handler (POST request)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('WhatsApp Webhook Event:', JSON.stringify(body, null, 2))

    // Verify webhook signature (recommended for production)
    // const signature = request.headers.get('x-hub-signature-256')
    // TODO: Implement signature verification

    // Process webhook events
    if (body.entry && body.entry.length > 0) {
      for (const entry of body.entry) {
        if (entry.changes && entry.changes.length > 0) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              await processWhatsAppMessage(change.value)
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processWhatsAppMessage(messageData: any) {
  console.log('Processing WhatsApp message:', messageData)

  if (!messageData.messages || messageData.messages.length === 0) {
    console.log('No messages in webhook data')
    return
  }

  const supabase = await createClient()

  for (const message of messageData.messages) {
    try {
      // Extract message details
      const {
        id: whatsappMessageId,
        from: senderPhone,
        timestamp,
        type: messageType,
        text,
        image,
        document,
        audio,
        video
      } = message

      const recipientPhone = messageData.metadata?.phone_number_id || messageData.metadata?.display_phone_number

      // Find the WhatsApp integration for this phone number
      const { data: integration, error: integrationError } = await supabase
        .from('whatsapp_integrations')
        .select(`
          *,
          bots (
            id,
            name,
            personality,
            instructions,
            features
          )
        `)
        .eq('phone_number_id', messageData.metadata?.phone_number_id)
        .eq('is_active', true)
        .single()

      if (integrationError || !integration) {
        console.log('No active integration found for phone number:', messageData.metadata?.phone_number_id)
        continue
      }

      // Check if we already processed this message
      const { data: existingMessage } = await supabase
        .from('whatsapp_messages')
        .select('id')
        .eq('whatsapp_message_id', whatsappMessageId)
        .single()

      if (existingMessage) {
        console.log('Message already processed:', whatsappMessageId)
        continue
      }

      // Extract message content based on type
      let messageContent: any = { type: messageType }
      let textContent = ''

      switch (messageType) {
        case 'text':
          textContent = text?.body || ''
          messageContent = { ...messageContent, text: text?.body }
          break
        case 'image':
          messageContent = { ...messageContent, image }
          textContent = image?.caption || '[Image]'
          break
        case 'document':
          messageContent = { ...messageContent, document }
          textContent = document?.caption || `[Document: ${document?.filename}]`
          break
        case 'audio':
          messageContent = { ...messageContent, audio }
          textContent = '[Audio message]'
          break
        case 'video':
          messageContent = { ...messageContent, video }
          textContent = video?.caption || '[Video]'
          break
        default:
          textContent = `[${messageType} message]`
      }

      // Find or create conversation
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_phone', senderPhone)
        .eq('bot_id', integration.bots.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let conversationId = conversation?.id

      if (!conversation) {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            bot_id: integration.bots.id,
            client_phone: senderPhone,
            client_name: senderPhone, // We'll update this when we get the contact info
            platform: 'whatsapp',
            status: 'active'
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating conversation:', createError)
          continue
        }

        conversationId = newConversation.id
      }

      // Store the WhatsApp message
      const { error: messageError } = await supabase
        .from('whatsapp_messages')
        .insert({
          integration_id: integration.id,
          conversation_id: conversationId,
          whatsapp_message_id: whatsappMessageId,
          sender_phone: senderPhone,
          recipient_phone: recipientPhone,
          message_type: messageType,
          message_content: messageContent,
          direction: 'inbound',
          whatsapp_timestamp: parseInt(timestamp)
        })

      if (messageError) {
        console.error('Error storing WhatsApp message:', messageError)
        continue
      }

      // Store the message in conversations table
      const { error: conversationMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: textContent,
          sender_type: 'user',
          platform_message_id: whatsappMessageId
        })

      if (conversationMessageError) {
        console.error('Error storing conversation message:', conversationMessageError)
        continue
      }

      // Only process AI response for text messages (for now)
      if (messageType === 'text' && textContent.trim()) {
        await generateAndSendAIResponse(integration, conversationId, senderPhone, textContent)
      }

    } catch (error) {
      console.error('Error processing individual message:', error)
    }
  }
}

async function generateAndSendAIResponse(
  integration: any,
  conversationId: string,
  senderPhone: string,
  userMessage: string
) {
  try {
    // Generate AI response using existing chat API logic
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userMessage,
        conversationId,
        botId: integration.bots.id
      })
    })

    if (!response.ok) {
      console.error('Error generating AI response:', response.statusText)
      return
    }

    const aiResponse = await response.json()
    
    if (aiResponse.response) {
      // Send response via WhatsApp
      await sendWhatsAppMessage(integration.access_token, senderPhone, aiResponse.response)
    }

  } catch (error) {
    console.error('Error generating AI response:', error)
  }
}

async function sendWhatsAppMessage(accessToken: string, recipientPhone: string, message: string) {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    
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
      return
    }

    const result = await response.json()
    console.log('WhatsApp message sent successfully:', result)

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
  }
}