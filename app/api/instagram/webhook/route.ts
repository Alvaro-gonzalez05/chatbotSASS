import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Helper function to find or create conversation
async function findOrCreateConversation(bot: any, clientId: string, platform: string, supabase: any) {
  // Find existing conversation
  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('*')
    .eq('client_phone', clientId) // Using client_phone field for Instagram ID
    .eq('bot_id', bot.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (conversation) {
    return conversation
  }

  // Create new conversation
  const { data: newConversation, error: createError } = await supabase
    .from('conversations')
    .insert({
      user_id: bot.user_id,
      bot_id: bot.id,
      client_phone: clientId, // Using client_phone field for Instagram ID
      client_name: `Instagram User ${clientId}`,
      platform: platform,
      status: 'active'
    })
    .select()
    .single()

  if (createError) {
    console.error('Error creating conversation:', createError)
    throw createError
  }

  return newConversation
}

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
        
        // Manejar comentarios en posts (diferente estructura)
        if (entry.changes && entry.changes.length > 0) {
          for (const change of entry.changes) {
            if (change.field === 'comments') {
              // Comentario en post de Instagram
              await processInstagramComment(change.value, request)
            }
          }
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
      
      // Check for attachments if text is empty
      let textContent = rawText.trim()
      
      if (!textContent && message.attachments && message.attachments.length > 0) {
        // Ignore template attachments or other non-text events that might be duplicates or system events
        const attachmentType = message.attachments[0].type
        if (attachmentType === 'template' || attachmentType === 'fallback') {
          console.log(`📸 Skipping non-text attachment type: ${attachmentType}`)
          continue
        }
        textContent = `[Attachment: ${attachmentType}]`
      }
      
      if (!textContent) {
        console.log('📸 Empty message content and no valid attachments, skipping...')
        continue
      }

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

      // OPTIMIZATION: Parallelize Integration and Duplicate Check
      
      // 1. Find integration directly by instagram_business_account_id
      const integrationPromise = supabase
        .from('integrations')
        .select('*')
        .eq('platform', 'instagram')
        .eq('is_active', true)
        .eq('config->>instagram_business_account_id', recipientInstagramId)
        .maybeSingle()

      // 2. Check for duplicate messages in DB (in addition to memory cache)
      const duplicateCheckPromise = supabase
        .from('messages')
        .select('id')
        .eq('metadata->>platform_message_id', messageId)
        .maybeSingle()

      const [integrationResult, duplicateResult] = await Promise.all([integrationPromise, duplicateCheckPromise])
      
      const integration = integrationResult.data
      const integrationError = integrationResult.error
      const existingMessage = duplicateResult.data

      if (integrationError || !integration) {
        console.log('❌ No active Instagram integration found for recipient:', recipientInstagramId)
        console.log('💡 You need to configure the Instagram Business Account ID in your bot settings.')
        continue
      }

      if (existingMessage) {
        console.log('📸 Skipping duplicate message (DB check):', messageId)
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
        .maybeSingle() // Removed status check to find closed/paused ones too

      if (existingConversation) {
        // Update existing conversation (Fire and forget update if possible, but we need the object)
        // We update last_message_at but don't wait for it if we don't need the result immediately
        // However, we need the conversation object.
        
        conversation = existingConversation
        
        // Update timestamp in background
        supabase
          .from('conversations')
          .update({
            last_message_at: new Date(parseInt(timestamp)).toISOString(),
            // Reactivate if it was closed? Maybe not automatically.
          })
          .eq('id', existingConversation.id)
          .then(({ error }) => {
             if (error) console.error('Error updating conversation timestamp:', error)
          })

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

      // Get Instagram username if we don't have it yet (Background Task)
      const needsUsername = !existingConversation || 
        conversation.client_name?.startsWith('@instagram_') || 
        conversation.client_name?.startsWith('Instagram User')
      
      if (needsUsername) {
        // Run in background, don't await
        getInstagramUsername(senderInstagramId, integration.config.access_token)
          .then(async (username) => {
            if (username) {
              await supabase
                .from('conversations')
                .update({ client_name: `@${username}` })
                .eq('id', conversation.id)
              console.log('✅ Updated conversation with username:', `@${username}`)
            }
          })
          .catch(err => console.error('Error fetching username in background:', err))
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
        // Check if conversation is paused
        if (conversation.status === 'paused') {
           // Check if pause has expired
           if (conversation.paused_until) {
             const pausedUntil = new Date(conversation.paused_until)
             const now = new Date()
             
             if (now > pausedUntil) {
               console.log('▶️ Pause expired, reactivating AI...')
               // Update status to active
               await supabase
                 .from('conversations')
                 .update({ status: 'active', paused_until: null })
                 .eq('id', conversation.id)
               
               // Continue to process message as normal
             } else {
               console.log('⏸️ Conversation is paused until ' + pausedUntil.toISOString() + ', skipping AI response')
               continue
             }
           } else {
             // Indefinite pause
             console.log('⏸️ Conversation is paused indefinitely, skipping AI response')
             continue
           }
        }

        console.log('🤖 Generating AI response for Instagram message...')

        // DEBOUNCE LOGIC: Wait 7 seconds to see if more messages arrive
        // This allows grouping multiple rapid messages into a single AI response
        console.log('⏳ Waiting 7s for potential follow-up messages...')
        await new Promise(resolve => setTimeout(resolve, 7000))

        // Check if any newer messages exist for this conversation
        const { data: newerMessages } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', conversation.id)
          .gt('created_at', new Date(parseInt(timestamp)).toISOString())
          .limit(1)
        
        if (newerMessages && newerMessages.length > 0) {
          console.log('⏭️ Newer message detected, skipping response for this message')
          continue
        }

        console.log('⚡ No newer messages, generating response...')

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

// Función para manejar comentarios en posts
async function processInstagramComment(commentData: any, request: NextRequest) {
  console.log('📸 Processing Instagram comment:', JSON.stringify(commentData, null, 2))
  
  const supabase = createAdminClient()
  
  // Datos del comentario
  const commentId = commentData.id
  const commentText = commentData.text
  const commenterId = commentData.from?.id
  const commenterUsername = commentData.from?.username
  const mediaId = commentData.media?.id // ID del post donde se comentó
  const mediaType = commentData.media?.media_type // IMAGE, VIDEO, etc.

  if (!commenterId || !commentText) {
    console.log('❌ Missing commenter ID or text in comment')
    return
  }

  console.log('📸 Comment details:')
  console.log('- Commenter:', commenterUsername, `(${commenterId})`)
  console.log('- Text:', commentText)
  console.log('- Media ID:', mediaId)

  // Buscar todas las automatizaciones de tipo comment_reply activas
  const { data: automations } = await supabase
    .from('automations')
    .select(`
      *,
      bots!inner(id, user_id, platform, integrations)
    `)
    .eq('trigger_type', 'comment_reply')
    .eq('is_active', true)
    .eq('bots.platform', 'instagram')

  if (!automations || automations.length === 0) {
    console.log('📸 No comment reply automations found')
    return
  }

  for (const automation of automations) {
    try {
      const bot = automation.bots
      const triggerConfig = automation.trigger_config || {}
      
      // Verificar si hay palabras clave configuradas
      const keywords = triggerConfig.comment_keywords
      if (keywords && keywords.trim()) {
        const keywordList = keywords.toLowerCase().split(',').map((k: string) => k.trim())
        const commentLower = commentText.toLowerCase()
        
        // Solo procesar si el comentario contiene alguna palabra clave
        const hasKeyword = keywordList.some((keyword: string) => 
          commentLower.includes(keyword)
        )
        
        if (!hasKeyword) {
          console.log(`📸 Comment doesn't match keywords for bot ${bot.id}:`, keywordList)
          continue
        }
      }

      console.log(`📸 Triggering comment automation for bot ${bot.id}`)

      // Obtener integración de Instagram
      const { data: integration } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', bot.user_id)
        .eq('platform', 'instagram')
        .eq('is_active', true)
        .single()

      if (!integration) {
        console.log('❌ No Instagram integration found for comment automation')
        continue
      }

      // Crear o encontrar conversación
      let conversation = await findOrCreateConversation(bot, commenterId, 'instagram', supabase)
      
      // Actualizar nombre si tenemos username
      if (commenterUsername && conversation.client_name !== `@${commenterUsername}`) {
        await supabase
          .from('conversations')
          .update({ client_name: `@${commenterUsername}` })
          .eq('id', conversation.id)
        
        conversation.client_name = `@${commenterUsername}`
      }

      // Preparar mensaje de respuesta
      let responseMessage = automation.message_template || "¡Hola! Vi tu comentario. Te escribo por mensaje privado 😊"
      
      // Reemplazar variables
      responseMessage = responseMessage
        .replace(/\{client_name\}/g, commenterUsername || 'usuario')
        .replace(/\{comment_text\}/g, commentText)
        .replace(/\{media_id\}/g, mediaId || '')

      // Verificar si debe mover a DM (por defecto true)
      const moveToDM = triggerConfig.move_to_dm !== false

      if (moveToDM) {
        // Enviar mensaje privado
        await sendInstagramDM(integration, commenterId, responseMessage, conversation, supabase)
      }

      // Log de la automatización ejecutada
      await supabase
        .from('automation_executions')
        .insert({
          automation_id: automation.id,
          conversation_id: conversation.id,
          trigger_data: {
            comment_id: commentId,
            comment_text: commentText,
            commenter_id: commenterId,
            commenter_username: commenterUsername,
            media_id: mediaId
          },
          status: 'executed',
          executed_at: new Date().toISOString()
        })

    } catch (error) {
      console.error(`❌ Error processing comment automation for bot ${automation.bots.id}:`, error)
    }
  }
}

// Función para enviar mensaje directo de Instagram
async function sendInstagramDM(integration: any, recipientId: string, message: string, conversation: any, supabase: any) {
  try {
    const response = await fetch(`https://graph.instagram.com/v21.0/${integration.config.instagram_business_account_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.config.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message }
      })
    })

    if (response.ok) {
      console.log('✅ Instagram DM sent successfully')
      
      // Guardar el mensaje en la base de datos
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          content: { type: 'text', text: message },
          text_content: message,
          sender_type: 'bot',
          message_type: 'comment_reply',
          created_at: new Date().toISOString()
        })
    } else {
      const errorText = await response.text()
      console.error('❌ Failed to send Instagram DM:', errorText)
    }
  } catch (error) {
    console.error('❌ Error sending Instagram DM:', error)
  }
}