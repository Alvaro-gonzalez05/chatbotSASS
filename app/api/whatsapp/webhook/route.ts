import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Webhook verification (GET request)
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  // Verify the webhook
  if (mode === 'subscribe') {
    try {
      // Check database for user's bot tokens
      let VERIFY_TOKEN = null
      
      if (token) {
        // Use admin client for webhook operations to bypass RLS
        const supabase = createAdminClient()
        
        // Search for bot by ID (token is the bot ID)
        const { data: bot, error: botError } = await supabase
          .from('bots')
          .select('id, name, user_id')
          .eq('platform', 'whatsapp')
          .eq('id', token)
          .single()
        
        if (!botError && bot) {
          VERIFY_TOKEN = token
          console.log('✅ Found WhatsApp bot with ID:', bot.id)
        } else {
          console.log('❌ No WhatsApp bot found with ID:', token)
        }
      }
      
      if (VERIFY_TOKEN && token === VERIFY_TOKEN) {
        return new NextResponse(challenge, { 
          status: 200,
          headers: {
            'Content-Type': 'text/plain'
          }
        })
      } else {
        return new NextResponse('Verification failed', { status: 403 })
      }
    } catch (error) {
      console.error('Error during webhook verification:', error)
      return new NextResponse('Verification error', { status: 500 })
    }
  }

  console.log('Invalid webhook verification request - missing mode or not subscribe')
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
  if (!messageData.messages || messageData.messages.length === 0) {
    return
  }

  const supabase = createAdminClient()

  // Extract contact information if available
  const contacts = messageData.contacts || []
  const contactInfo = contacts.length > 0 ? contacts[0] : null
  const senderName = contactInfo?.profile?.name || null

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

      // Find the integration for WhatsApp with matching phone_number_id
      const { data: integrations, error: integrationsError } = await supabase
        .from('integrations')
        .select('*, bots!inner(*)')
        .eq('platform', 'whatsapp')
        .eq('is_active', true)

      if (integrationsError || !integrations) {
        console.error('Error fetching WhatsApp integrations:', integrationsError)
        continue
      }

      // Find integration with matching phone_number_id
      const integration = integrations.find(i => 
        i.config?.phone_number_id === messageData.metadata?.phone_number_id
      )

      if (!integration || !integration.bots) {
        console.log('No active WhatsApp integration found for phone number:', messageData.metadata?.phone_number_id)
        continue
      }

      const bot = integration.bots

      console.log('🔍 Found bot:', bot.name, 'with ID:', bot.id)

      // Mark integration as verified if this is the first successful webhook
      if (!integration.is_verified) {
        const updatedIntegrations = {
          ...integration,
          is_verified: true,
          webhook_verified_at: new Date().toISOString()
        }
        
        await supabase
          .from('bots')
          .update({ integrations: updatedIntegrations })
          .eq('id', bot.id)
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

      // Check if we already processed this message
      // Check for duplicate messages
      const { data: existingMessage } = await supabase
        .from('whatsapp_messages')
        .select('id')
        .eq('whatsapp_message_id', whatsappMessageId)
        .maybeSingle()

      if (existingMessage) {
        continue // Skip duplicate messages
      }

      // Find or create conversation
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_phone', senderPhone)
        .eq('bot_id', bot.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let conversationId = conversation?.id

      if (!conversation) {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            user_id: bot.user_id,
            bot_id: bot.id,
            client_phone: senderPhone,
            client_name: senderName || senderPhone, // Use actual name from WhatsApp profile
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
      } else {
        // Update conversation name if we have a better name and current name is just the phone
        if (senderName && conversation.client_name === senderPhone) {
          await supabase
            .from('conversations')
            .update({ client_name: senderName })
            .eq('id', conversation.id)
        }
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

      // Store the WhatsApp message using UPSERT to handle race conditions
      const { data: insertedMessage, error: whatsappMessageError } = await supabase
        .from('whatsapp_messages')
        .upsert({
          whatsapp_message_id: whatsappMessageId,
          integration_id: integration.id,
          conversation_id: conversationId,
          sender_phone: senderPhone,
          recipient_phone: recipientPhone,
          message_type: messageType,
          message_content: messageContent,
          direction: 'inbound',
          whatsapp_timestamp: parseInt(timestamp)
        }, {
          onConflict: 'whatsapp_message_id',
          ignoreDuplicates: false
        })
        .select()

      if (whatsappMessageError) {
        console.error('Error storing WhatsApp message:', whatsappMessageError)
        continue
      }

      // Check if this is a new message or if it was already processed
      if (!insertedMessage || insertedMessage.length === 0) {
        continue // Message already processed
      }

      // Store the message in conversations table for AI context
      const { error: conversationMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: textContent,
          sender_type: 'client',
          message_type: messageType,
          metadata: { whatsapp_message_id: whatsappMessageId }
        })

      if (conversationMessageError) {
        console.error('Error storing conversation message:', conversationMessageError)
        continue
      }

      // Only process AI response for text messages (for now)
      if (messageType === 'text' && textContent.trim()) {
        await generateAndSendAIResponse(integration, conversationId, senderPhone, textContent, bot.id, senderName)
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
  userMessage: string,
  botId: string,
  senderName?: string
) {
  try {
    // Generate AI response using webhook-specific chat API
    const chatApiUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat/webhook`
    
    const response = await fetch(chatApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userMessage,
        conversationId,
        botId: botId,
        senderPhone,
        senderName
      })
    })

    if (!response.ok) {
      console.error('Error generating AI response:', response.statusText)
      return
    }

    const aiResponse = await response.json()
    
    if (aiResponse.response) {
      // Send response via WhatsApp
      await sendWhatsAppMessage(integration.access_token, integration.phone_number_id, senderPhone, aiResponse.response)
    }

  } catch (error) {
    console.error('Error generating AI response:', error)
  }
}

async function sendWhatsAppMessage(accessToken: string, phoneNumberId: string, recipientPhone: string, message: string) {
  try {
    // Normalize phone number for Argentina (remove extra 9)
    let normalizedPhone = recipientPhone
    if (recipientPhone.startsWith('549')) {
      normalizedPhone = '54' + recipientPhone.substring(3)
    }
    
    // Clean message to avoid encoding issues
    const cleanMessage = message
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[^\x00-\xFF]/g, '')
      .trim()
    
    const tokenToUse = accessToken.trim()

    const requestBody = {
      messaging_product: 'whatsapp',
      to: normalizedPhone,
      type: 'text',
      text: {
        body: cleanMessage
      }
    }
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenToUse}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('WhatsApp API Error:', errorData)
      return
    }

    await response.json()

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
  }
}