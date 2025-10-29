import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Webhook verification (GET request)
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  console.log('📸 Instagram webhook verification request:')
  console.log('- Full URL:', request.url)
  console.log('- Mode:', mode)
  console.log('- Token received:', token)
  console.log('- Challenge:', challenge)
  console.log('- All URL params:', Object.fromEntries(url.searchParams.entries()))

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
          .eq('platform', 'instagram')
          .eq('id', token)
          .single()
        
        if (!botError && bot) {
          VERIFY_TOKEN = token
          console.log('✅ Found Instagram bot:', bot.name, 'with ID:', bot.id)
        } else {
          console.log('❌ No Instagram bot found with ID:', token)
        }
      }
      
      console.log('📸 Final verification result:')
      console.log('- VERIFY_TOKEN:', VERIFY_TOKEN)
      console.log('- Match:', VERIFY_TOKEN && token === VERIFY_TOKEN)
      
      if (VERIFY_TOKEN && token === VERIFY_TOKEN) {
        console.log('✅ Verification successful, returning challenge')
        return new NextResponse(challenge, { 
          status: 200,
          headers: {
            'Content-Type': 'text/plain'
          }
        })
      } else {
        console.log('❌ Verification failed')
        return new NextResponse('Verification failed', { status: 403 })
      }
    } catch (error) {
      console.error('Error during Instagram webhook verification:', error)
      return new NextResponse('Verification error', { status: 500 })
    }
  }

  console.log('❌ Invalid webhook verification request')
  console.log('- Expected mode: "subscribe", received:', mode)
  console.log('- Has token:', !!token)
  console.log('- Has challenge:', !!challenge)
  
  return new NextResponse(`Invalid request - mode: ${mode}`, { status: 400 })
}

// Handle incoming Instagram messages (POST request)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📸 Instagram webhook received:', JSON.stringify(body, null, 2))

    if (body.object === 'instagram') {
      for (const entry of body.entry) {
        // Instagram usa 'messaging' en lugar de 'changes'
        if (entry.messaging && entry.messaging.length > 0) {
          await processInstagramMessage(entry, request)
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error processing Instagram webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Track processed messages to avoid duplicates (with TTL)
// Use a dedupe key (sender + normalized text) because Instagram may send
// multiple webhook events for the same user message with different mids.
const processedMessages = new Map<string, number>()
const MESSAGE_TTL = 60000 // 1 minute

// Clean old messages periodically
function cleanOldMessages() {
  const now = Date.now()
  for (const [dedupeKey, timestamp] of processedMessages.entries()) {
    if (now - timestamp > MESSAGE_TTL) {
      processedMessages.delete(dedupeKey)
    }
  }
}

// Function to get Instagram username from Instagram ID
async function getInstagramUsername(instagramUserId: string, accessToken: string): Promise<string | null> {
  try {
    console.log('📸 Fetching Instagram username for ID:', instagramUserId)
    
    const response = await fetch(
      `https://graph.instagram.com/${instagramUserId}?fields=username&access_token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Instagram API Error getting username:', errorData)
      return null
    }

    const data = await response.json()
    const username = data.username
    
    if (username) {
      console.log('✅ Got Instagram username:', `@${username}`)
      return username
    }
    
    return null
  } catch (error) {
    console.error('❌ Error fetching Instagram username:', error)
    return null
  }
}

async function processInstagramMessage(entry: any, request: NextRequest) {
  if (!entry.messaging || entry.messaging.length === 0) {
    return
  }

  const supabase = createAdminClient()

  console.log('📸 Processing Instagram entry:', JSON.stringify(entry, null, 2))

  for (const messaging of entry.messaging) {
    try {
      // Extraer datos del mensaje de Instagram
      const senderInstagramId = messaging.sender?.id
      const recipientInstagramId = messaging.recipient?.id
      const timestamp = messaging.timestamp
      const message = messaging.message
      
      if (!message) {
        console.log('📸 No message content, skipping...')
        continue
      }

      // Skip echo messages (messages sent by the bot itself)
      if (message.is_echo) {
        console.log('📸 Skipping echo message from bot')
        continue
      }

      const messageId = message.mid
      const rawText = message.text || ''
      const textContent = rawText.trim() || '[No text]'

      // Build a dedupe key using sender id + normalized text so we avoid
      // replying multiple times when Instagram emits related events.
      const normalizedText = textContent.toLowerCase().replace(/\s+/g, ' ').trim()
      const dedupeKey = `${senderInstagramId}::${normalizedText}`

      // Skip already processed messages using dedupe key
      cleanOldMessages()
      if (processedMessages.has(dedupeKey)) {
        console.log('📸 Skipping already processed message (dedupe):', dedupeKey)
        continue
      }

      // Mark as processed
      processedMessages.set(dedupeKey, Date.now())
      
      console.log('📸 Processing message:')
      console.log('- From:', senderInstagramId)
      console.log('- To:', recipientInstagramId)
      console.log('- Text:', textContent)

      // Find the integration for Instagram with matching instagram_business_account_id
      const { data: integrations, error: integrationsError } = await supabase
        .from('integrations')
        .select('*')
        .eq('platform', 'instagram')
        .eq('is_active', true)

      if (integrationsError || !integrations) {
        console.error('Error fetching Instagram integrations:', integrationsError)
        continue
      }

      console.log('📸 Found integrations:', integrations.length)
      console.log('📸 Looking for recipient ID:', recipientInstagramId)
      console.log('📸 Available integrations:', integrations.map(i => ({
        id: i.id,
        user_id: i.user_id,
        instagram_id: i.config?.instagram_business_account_id,
        config_keys: i.config ? Object.keys(i.config) : [],
        full_config: i.config
      })))

      // Find integration with matching instagram_business_account_id
      const integration = integrations.find(i => 
        i.config?.instagram_business_account_id === recipientInstagramId
      )

      if (!integration) {
        console.log('❌ No active Instagram integration found for recipient:', recipientInstagramId)
        console.log('💡 You need to configure the Instagram Business Account ID in your bot settings.')
        console.log('💡 Use this ID as Instagram Business Account ID:', recipientInstagramId)
        continue
      }

      // Now get the bot for this user
      const { data: bot, error: botError } = await supabase
        .from('bots')
        .select('*')
        .eq('platform', 'instagram')
        .eq('user_id', integration.user_id)
        .single()

      if (botError || !bot) {
        console.error('Error fetching bot for integration:', botError)
        continue
      }

      console.log('📸 Found Instagram bot:', bot.name, 'with ID:', bot.id)

      // Preparar contenido del mensaje
      const messageContent = {
        type: 'text',
        text: textContent
      }

      // Find or create conversation with Instagram ID in the correct field
      let conversation
      let conversationError = null

      // First, try to find existing conversation for this Instagram user and bot
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('bot_id', bot.id)
        .eq('client_instagram_id', senderInstagramId)
        .eq('platform', 'instagram')
        .eq('status', 'active')
        .single()

      if (existingConversation) {
        // Update existing conversation
        const { data: updatedConversation, error: updateError } = await supabase
          .from('conversations')
          .update({
            last_message_at: new Date(parseInt(timestamp)).toISOString()
          })
          .eq('id', existingConversation.id)
          .select()
          .single()
        
        conversation = updatedConversation
        conversationError = updateError
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            bot_id: bot.id,
            user_id: bot.user_id,
            client_instagram_id: senderInstagramId, // Correctly using client_instagram_id for Instagram
            client_name: `@instagram_${senderInstagramId}`, // Temporary name until user provides real name
            platform: 'instagram',
            status: 'active',
            last_message_at: new Date(parseInt(timestamp)).toISOString()
          })
          .select()
          .single()
        
        conversation = newConversation
        conversationError = createError
      }

      if (conversationError) {
        console.error('Error upserting conversation:', conversationError)
        continue
      }

      // Get Instagram username if we don't have it yet
      let instagramUsername = null
      
      // Try to get username if:
      // 1. It's a new conversation OR
      // 2. Existing conversation doesn't have a real username (still has @instagram_ format)
      const needsUsername = !existingConversation || 
        conversation.client_name?.startsWith('@instagram_') || 
        conversation.client_name?.startsWith('Instagram User')
      
      if (needsUsername) {
        console.log('📸 Attempting to get Instagram username...')
        instagramUsername = await getInstagramUsername(senderInstagramId, integration.config.access_token)
        
        if (instagramUsername) {
          // Update conversation with real username
          await supabase
            .from('conversations')
            .update({
              client_name: `@${instagramUsername}`
            })
            .eq('id', conversation.id)
          
          // Update the conversation object for later use
          conversation.client_name = `@${instagramUsername}`
          console.log('✅ Updated conversation with username:', `@${instagramUsername}`)
        }
      } else {
        console.log('📸 Conversation already has username:', conversation.client_name)
      }

      // Store the message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          content: textContent,
          sender_type: 'client',
          message_type: 'text',
          metadata: {
            platform_message_id: messageId,
            sender_instagram_id: senderInstagramId,
            recipient_instagram_id: recipientInstagramId
          },
          created_at: new Date(parseInt(timestamp)).toISOString()
        })

      if (messageError) {
        console.error('Error inserting message:', messageError)
        continue
      }

      // Generate AI response if bot is active
      if (bot.is_active && textContent.trim()) {
        console.log('🤖 Generating AI response for Instagram message...')

        // Get the base URL from the request headers
        const host = request.headers.get('host') || 'localhost:3000'
        const protocol = request.headers.get('x-forwarded-proto') || 'http'
        const baseUrl = `${protocol}://${host}`

        // Call Gemini API with Instagram-specific parameters
        const aiResponse = await fetch(`${baseUrl}/api/chat/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            botId: bot.id,
            message: textContent,
            conversationId: conversation.id,
            senderPhone: null, // Instagram doesn't have phone numbers
            senderName: conversation.client_name, // Use the conversation name (will be updated if user provides real name)
            senderInstagramId: senderInstagramId, // Add Instagram ID as separate parameter
            platform: 'instagram' // Add platform identifier
          })
        })

        if (aiResponse.ok) {
          const aiResponseData = await aiResponse.json()
          
          // Store AI response
          await supabase
            .from('messages')
            .insert({
              conversation_id: conversation.id,
              content: { type: 'text', text: aiResponseData.response },
              text_content: aiResponseData.response,
              sender_type: 'bot',
              created_at: new Date().toISOString()
            })

          // Send response via Instagram API
          try {
            await sendInstagramMessage(
              integration.config.access_token, 
              integration.config.instagram_business_account_id, 
              senderInstagramId, 
              aiResponseData.response
            )
            console.log('✅ Instagram message sent successfully!')
          } catch (error) {
            console.log('⚠️ Instagram message failed to send, but conversation was saved:', (error as Error).message)
          }
        }
      }

    } catch (error) {
      console.error('Error processing individual Instagram message:', error)
    }
  }
}

async function sendInstagramMessage(accessToken: string, instagramBusinessAccountId: string, recipientId: string, message: string) {
  try {
    console.log('📸 Sending Instagram message:')
    console.log('- Business Account ID:', instagramBusinessAccountId)
    console.log('- Recipient ID:', recipientId)
    console.log('- Access Token (first 20 chars):', accessToken.substring(0, 20) + '...')
    console.log('- Message:', message)

    // Try Instagram Graph API endpoint with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`https://graph.instagram.com/v21.0/me/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: JSON.stringify({text: message}),
        recipient: JSON.stringify({id: recipientId})
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Instagram API Error:', errorData)
      
      // Try Facebook Graph API as fallback
      console.log('📸 Trying Facebook Graph API as fallback...')
      
      const fallbackResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramBusinessAccountId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: {
            id: recipientId
          },
          message: {
            text: message
          }
        })
      })
      
      if (!fallbackResponse.ok) {
        const fallbackError = await fallbackResponse.json()
        console.error('Facebook API Error:', fallbackError)
        throw new Error(`Both Instagram and Facebook API failed: ${response.status} / ${fallbackResponse.status}`)
      }
      
      console.log('📸 Message sent via Facebook Graph API fallback')
    } else {
      console.log('📸 Instagram message sent successfully')
    }
  } catch (error) {
    console.error('Error sending Instagram message:', error)
    throw error
  }
}