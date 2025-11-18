import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  try {
    const { botId, message, conversationId, senderPhone, senderName, senderInstagramId, platform } = await request.json()

    if (!botId || !message || !conversationId) {
      return NextResponse.json(
        { error: "Missing required fields: botId, message, conversationId" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get bot configuration first
    const { data: bot, error: botError } = await supabase
      .from("bots")
      .select("*")
      .eq("id", botId)
      .single()

    if (botError || !bot) {
      console.error('Bot not found:', botError)
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    // Define bot features early for use throughout the function
    const botFeatures = bot.features || []
    const canRegisterClients = botFeatures.includes('register_clients')
    const canTakeOrders = botFeatures.includes('take_orders')
    const canTakeReservations = botFeatures.includes('take_reservations')

    // Get user profile information using the bot's user_id
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select(`
        business_name,
        business_description, 
        business_hours,
        social_links,
        location,
        menu_link,
        business_info
      `)
      .eq("id", bot.user_id)
      .single()



    // Handle test conversations differently
    let conversation
    let actualConversationId = conversationId
    
    if (conversationId.startsWith('test-conversation-')) {
      // Generate a consistent UUID based on the test conversation ID
      // This allows multiple test conversations per bot with valid UUIDs
      const crypto = require('crypto')
      const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8' // UUID namespace
      const hash = crypto.createHash('sha1').update(conversationId + botId).digest('hex')
      // Create UUID v5-like format
      actualConversationId = [
        hash.substring(0, 8),
        hash.substring(8, 12),
        '5' + hash.substring(13, 16), // version 5
        hash.substring(16, 20),
        hash.substring(20, 32)
      ].join('-')
      
      console.log(`🧪 Test conversation "${conversationId}" mapped to UUID: ${actualConversationId}`)
      
      // First check if test conversation already exists
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", actualConversationId)
        .single()

      if (existingConversation) {
        conversation = existingConversation
        console.log('✅ Using existing test conversation:', actualConversationId)
      } else {
        // Create a real conversation for testing in the database using bot UUID
        const { data: newConversation, error: createError } = await supabase
          .from("conversations")
          .insert({
            id: actualConversationId,
            user_id: bot.user_id,
            bot_id: botId,
            platform: 'test',
            client_name: senderName || 'Usuario de Prueba',
            client_phone: senderPhone || 'test-user',
            client_id: null,
            status: 'active',
            last_message_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating test conversation:', createError)
          console.error('Attempted conversation data:', {
            id: actualConversationId,
            user_id: bot.user_id,
            bot_id: botId,
            platform: 'test'
          })
          return NextResponse.json({ error: "Error creating test conversation" }, { status: 500 })
        }
        
        conversation = newConversation
        console.log('✅ Created test conversation with bot UUID:', newConversation)
      }
    } else {
      // Get real conversation from database
      const { data: realConversation, error: conversationError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single()

      if (conversationError || !realConversation) {
        console.error('Conversation not found:', conversationError)
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
      }
      conversation = realConversation
    }

    // Bot features already defined above
    
    // Always extract client data (needed for reservations and better UX)
    // But only create/update clients if registration is enabled
    let extractedClientData = null
    extractedClientData = await extractClientDataFromMessage(
      message, 
      senderName, 
      senderPhone, 
      bot, 
      conversation.id, 
      supabase, 
      platform || conversation.platform, // Use platform from request or conversation
      senderInstagramId
    )
    
    // Create/update client record if we have extracted data AND registration is enabled
    if (extractedClientData && canRegisterClients) {
      console.log('🔍 Attempting to create/update client. Conversation client_id:', conversation.client_id)
      console.log('🔍 Extracted client data:', extractedClientData)
      
      // If conversation already has a client, get existing client data to merge
      let existingClientData = null
      if (conversation.client_id) {
        const { data: existingClient } = await supabase
          .from("clients")
          .select("*")
          .eq("id", conversation.client_id)
          .single()
        
        if (existingClient) {
          existingClientData = existingClient
          console.log('🔍 Found existing client in conversation:', existingClient)
          
          // Merge data intelligently: 
          // - Keep real names, don't overwrite with usernames
          // - Update with new extracted data if it's better
          const isNewNameRealName = extractedClientData.name && 
            !extractedClientData.name.startsWith('@') && 
            extractedClientData.name !== 'Usuario de Prueba' &&
            extractedClientData.name !== 'Cliente sin nombre'
          
          const isExistingNameRealName = existingClient.name && 
            !existingClient.name.startsWith('@') && 
            existingClient.name !== 'Usuario de Prueba' &&
            existingClient.name !== 'Cliente sin nombre'
          
          const mergedData = {
            name: isNewNameRealName ? extractedClientData.name : 
                  isExistingNameRealName ? existingClient.name : 
                  extractedClientData.name || existingClient.name,
            phone: extractedClientData.phone || existingClient.phone,
            email: extractedClientData.email || existingClient.email,
            instagram_id: extractedClientData.instagram_id || existingClient.instagram,
            instagram_username: extractedClientData.instagram_username || existingClient.instagram_username
          }
          
          console.log('🔍 Merged client data:', mergedData)
          extractedClientData = mergedData
        }
      }
      
      // For test conversations, only create client if we have both name and phone
      const shouldCreateClient = !conversationId.startsWith('test-conversation-') || 
        (extractedClientData.name && extractedClientData.phone)
      
      console.log('🔍 Should create client:', shouldCreateClient)
      
      if (shouldCreateClient) {
        const clientRecord = await createOrUpdateClient(supabase, bot.user_id, extractedClientData, conversation.id)
        if (clientRecord) {
          console.log('✅ Client created/updated:', clientRecord.id)
          // Update conversation with client_id (even test conversations)
          await supabase
            .from("conversations")
            .update({ client_id: clientRecord.id })
            .eq("id", conversation.id)
        } else {
          console.log('❌ Failed to create/update client')
        }
      }
      
      // Additional check: if we have an existing client with "Cliente sin nombre" 
      // and we can extract a name from bot responses, update it
      if (conversation.client_id) {
        const { data: existingClient } = await supabase
          .from("clients")
          .select("*")
          .eq("id", conversation.client_id)
          .single()
        
        if (existingClient && 
            (existingClient.name === 'Cliente sin nombre' || !existingClient.name)) {
          
          // Get all messages from this conversation to extract name from bot responses
          const { data: allMessages } = await supabase
            .from("messages")
            .select("content, sender_type")
            .eq("conversation_id", conversation.id)
            .order("created_at", { ascending: true })
          
          if (allMessages && allMessages.length > 0) {
            const nameFromBot = extractNameFromBotResponses(allMessages)
            if (nameFromBot) {
              console.log(`🔄 Updating existing client "${existingClient.name}" with name from bot: "${nameFromBot}"`)
              const { data: updatedClient, error } = await supabase
                .from("clients")
                .update({ name: nameFromBot })
                .eq("id", existingClient.id)
                .select()
                .single()
              
              if (!error) {
                console.log('✅ Successfully updated client name:', updatedClient)
              } else {
                console.error('❌ Error updating client name:', error)
              }
            }
          }
        }
      }
    } else {
      console.log('🔍 No extracted client data to process')
    }

    // Generate bot response using the same logic as the main chat API
    const botResponse = await generateBotResponse(
      supabase, 
      bot, 
      conversation, 
      message, 
      bot.user_id, 
      userProfile, 
      senderName, 
      senderPhone, 
      extractedClientData,
      platform || conversation.platform, // Add platform parameter
      senderInstagramId
    )

    // Save bot response to messages table (works for both real and test conversations)
    const { error: saveError } = await supabase
      .from("messages")
      .insert({
        conversation_id: actualConversationId,
        content: botResponse,
        sender_type: 'bot',
        message_type: 'text',
        metadata: { generated_via: 'webhook', sender_phone: senderPhone }
      })

    if (saveError) {
      console.error('Error saving bot message:', saveError)
    }

    // Update conversation last activity (works for all conversations now)
    await supabase
      .from("conversations")
      .update({ 
        last_message_at: new Date().toISOString(),
        status: 'active'
      })
      .eq("id", actualConversationId)

    return NextResponse.json({
      response: botResponse,
      conversationId,
      botId
    })

  } catch (error) {
    console.error("Error in webhook chat:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function generateBotResponse(
  supabase: any,
  bot: any,
  conversation: any,
  userMessage: string,
  userId: string,
  userProfile: any,
  senderName?: string,
  senderPhone?: string,
  extractedClientData?: any,
  platform?: string,
  senderInstagramId?: string
): Promise<string> {
  try {
    // Get conversation history for context (recent messages first)
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(8) // Last 8 messages for better context

    // Reverse to get chronological order for AI
    const recentMessages = messages?.reverse() || []

    const conversationHistory = recentMessages.map((msg: any) => ({
      role: msg.sender_type === 'client' ? 'user' : 'assistant',
      content: msg.content
    }))

    // Prepare the enhanced prompt with business information from user_profiles table
    let businessInfo = 'No hay información del negocio disponible.'
    let productsInfo = ''
    let botCapabilities = ''
    let deliveryModesInfo = ''
    
    if (userProfile) {
      console.log('🏢 User profile loaded:', userProfile)
      console.log('🤖 Bot features:', bot.features || [])
      
      // Format business hours - simplified
      let hoursText = 'No especificado'
      if (userProfile.business_hours && typeof userProfile.business_hours === 'object') {
        const openDays = Object.entries(userProfile.business_hours)
          .filter(([_, dayInfo]: [string, any]) => dayInfo?.isOpen)
        hoursText = openDays.length > 0 ? `${openDays.length} días abierto` : 'Cerrado'
      }

      // Format social media - simplified
      let socialText = 'No especificado'
      if (userProfile.social_links?.whatsapp) {
        socialText = `WhatsApp: ${userProfile.social_links.whatsapp}`
      }

      // Try to get additional info from business_info field if individual fields are empty
      const fallbackInfo = userProfile.business_info || {}
      
      // Format menu/catalog information
      const menuLink = userProfile.menu_link || fallbackInfo.menu_link
      const menuText = menuLink ? `Disponible en: ${menuLink}` : 'No especificado'

      businessInfo = `
${userProfile.business_name || 'Negocio'} - ${userProfile.business_description || 'Restaurante'}
📍 ${userProfile.location || 'No especificado'}
📞 ${fallbackInfo.phone || 'No especificado'}
🍴 Menú: ${menuText}
⏰ ${hoursText}
${socialText ? '📱 ' + socialText : ''}
      `.trim()

      // Get delivery settings if bot can take orders
      if ((bot.features || []).includes('take_orders')) {
        const { data: deliverySettings, error: deliveryError } = await supabase
          .from("delivery_settings")
          .select("*")
          .eq("user_id", userId)
          .single()

        console.log('🚚 Delivery settings:', deliverySettings, 'Error:', deliveryError)

        let finalDeliverySettings = deliverySettings

        // If no delivery settings exist, create default ones
        if (!deliverySettings) {
          console.log('🚚 Creating default delivery settings for user')
          const { data: newSettings, error: createError } = await supabase
            .from("delivery_settings")
            .insert({
              user_id: userId,
              pickup_enabled: true,
              delivery_enabled: false,
              pickup_instructions: 'Retiro en el local',
              delivery_instructions: 'Envío a domicilio',
              delivery_fee: 0,
              minimum_order_delivery: 0,
              delivery_time_estimate: '30-45 minutos',
              pickup_time_estimate: '15-20 minutos'
            })
            .select()
            .single()

          if (!createError && newSettings) {
            finalDeliverySettings = newSettings
            console.log('✅ Default delivery settings created:', newSettings)
          } else {
            console.error('❌ Error creating default delivery settings:', createError)
          }
        }

        if (finalDeliverySettings) {
          const availableModes = []
          const modeOptions = []
          
          if (finalDeliverySettings.pickup_enabled) {
            availableModes.push(`• RETIRO: ${finalDeliverySettings.pickup_time_estimate}`)
            modeOptions.push('retiro')
          }
          if (finalDeliverySettings.delivery_enabled) {
            availableModes.push(`• ENVÍO: ${finalDeliverySettings.delivery_time_estimate}`)
            modeOptions.push('envío')
          }
          
          if (availableModes.length > 0) {
            const modePrompt = modeOptions.length === 1 
              ? `Solo ofrecemos ${modeOptions[0]}` 
              : `Pregunta: "¿Lo querés para ${modeOptions.join(' o ')}?"`
            
            deliveryModesInfo = `
MODALIDADES: ${availableModes.join(', ')}
${modePrompt}
${finalDeliverySettings.delivery_enabled ? 'Para envío: pedir dirección completa' : ''}
            `.trim()
          }
        }

        // Get products catalog
        const { data: products } = await supabase
          .from("products")
          .select("*")
          .eq("user_id", bot.user_id)
          .eq("is_available", true)
          .order("category", { ascending: true })
          .order("name", { ascending: true })

        if (products && products.length > 0) {
          const productsByCategory = products.reduce((acc: Record<string, any[]>, product: any) => {
            const category = product.category || 'Sin categoría'
            if (!acc[category]) acc[category] = []
            acc[category].push(product)
            return acc
          }, {} as Record<string, any[]>)

          const catalogText = Object.entries(productsByCategory)
            .map(([category, items]: [string, any]) => {
              const itemList = items.map((item: any) => 
                `- ${item.name}: $${item.price}${item.description ? ` - ${item.description}` : ''}`
              ).join('\n')
              return `**${category}:**\n${itemList}`
            }).join('\n\n')

          productsInfo = `
CATÁLOGO DE PRODUCTOS DISPONIBLES:
${catalogText}

INFORMACIÓN ADICIONAL PARA RESPUESTAS SOBRE MENÚ:
- Si el cliente pregunta por la carta/menú, muestra el catálogo de productos disponibles
- Menciona los platos destacados según la descripción: ${userProfile.business_description || fallbackInfo.description || ''}
- El enlace del menú completo es: ${menuLink || 'No disponible'}
          `.trim()
        }
      }

      // Define bot capabilities based on features
      const features = bot.features || []
      if (features.includes('take_orders') || features.includes('take_reservations')) {
        const capabilities = []
        if (features.includes('take_orders')) capabilities.push('tomar pedidos de productos del catálogo')
        if (features.includes('take_reservations')) capabilities.push('tomar reservas para mesas')
        
        botCapabilities = `
FUNCIONALIDADES ESPECIALES DEL BOT:
Estás habilitado para: ${capabilities.join(' y ')}.

        ${features.includes('take_orders') ? `
PEDIDOS: producto → modalidad → "PEDIDO CONFIRMADO"
` : ''}${features.includes('take_reservations') ? `
        ${features.includes('take_reservations') ? `
RESERVAS: pedir fecha, hora, personas, nombre, teléfono → "RESERVA CONFIRMADA"
- En el resumen, usa el nombre que te dio el cliente, no "Usuario de Prueba"
- Acepta formatos naturales de fecha: "mañana", "el viernes", "15 de octubre"  
- Acepta formatos naturales de hora: "7 pm", "19:00", "siete de la noche", "20 horas"

MANEJO DE CONTEXTO - MUY IMPORTANTE:
- Antes de hacer cualquier pregunta, LEE los mensajes anteriores de esta conversación
- Si el cliente ya dijo fecha/hora/personas/nombre en mensajes anteriores, NO lo preguntes de nuevo
- Ejemplo: Si en un mensaje anterior dijo "sábado 7pm para 4 personas", ya tienes fecha/hora/personas
- SOLO pregunta la información que realmente te falta según el historial
- Usa TODA la información acumulada de mensajes anteriores para decidir qué preguntar
` : ''}
` : ''}
        `.trim()
      }
    }
    
    // Prepare client information
    const clientInfo = senderName || senderPhone || 'Cliente'
    const hasClientPhone = senderPhone && senderPhone !== 'test-user' && senderPhone !== conversation.client_phone
    const hasExtractedName = extractedClientData?.name && extractedClientData.name !== 'Usuario de Prueba'
    const hasExtractedPhone = extractedClientData?.phone && extractedClientData.phone !== 'test-user'
    
    // Define features for use in template
    const features = bot.features || []

    const systemPrompt = `Eres ${bot.name}, un asistente virtual amigable y profesional que representa a un negocio.

INFORMACIÓN DEL NEGOCIO:
${businessInfo}

TUS CAPACIDADES Y SERVICIOS:
${(() => {
  const capabilities = []
  if (features.includes('take_orders')) capabilities.push('✅ TOMAR PEDIDOS de productos del menú')
  if (features.includes('take_reservations')) capabilities.push('✅ TOMAR RESERVAS de mesas')
  if (features.includes('loyalty_points')) capabilities.push('✅ GESTIONAR PUNTOS de fidelidad')
  
  const result = capabilities.length > 0 
    ? `Puedes hacer lo siguiente:\n${capabilities.join('\n')}\n\nSI te preguntan sobre estos servicios, responde con confianza que SÍ los ofreces.`
    : 'Solo puedes brindar información general del negocio.'
  
  return result
})()}

${productsInfo}

${deliveryModesInfo}

INFORMACIÓN DEL CLIENTE ACTUAL:
${(() => {
  const currentPlatform = platform || conversation.platform
  
  if (currentPlatform === 'instagram') {
    const instagramUsername = extractedClientData?.instagram_username || 
      (senderName?.startsWith('@') && !senderName?.includes('instagram_') ? senderName : null)
    
    return `- Plataforma: Instagram
- Nombre: ${hasExtractedName ? extractedClientData.name : 'No proporcionado'}
- Username: ${instagramUsername || 'No disponible'}
- Instagram ID: ${senderInstagramId || 'No disponible'}
- Estado de datos: ${hasExtractedName && instagramUsername ? 'COMPLETOS (Instagram)' : 'FALTA NOMBRE'}`
  } else {
    return `- Plataforma: WhatsApp
- Nombre: ${hasExtractedName ? extractedClientData.name : clientInfo}
- Teléfono: ${hasExtractedPhone ? extractedClientData.phone : (senderPhone || 'No disponible')}
- Estado de datos: ${hasExtractedName && hasExtractedPhone ? 'COMPLETOS' : hasExtractedName ? 'FALTA TELÉFONO' : 'FALTA NOMBRE Y TELÉFONO'}`
  }
})()}

${botCapabilities}

${features.includes('register_clients') ? `
REGISTRO DE CLIENTES:
${(() => {
  const currentPlatform = platform || conversation.platform
  
  if (currentPlatform === 'instagram') {
    return `- Para Instagram: Si falta NOMBRE, pregunta de manera natural: "¿Cómo te llamas?" o "¿Cuál es tu nombre?"
- Si ya tienes nombre: responde normal y usa el nombre en la conversación`
  } else {
    return `- Para WhatsApp: Si FALTA TELÉFONO: "¡Hola ${hasExtractedName ? extractedClientData.name : 'cliente'}! ¿Me compartís tu teléfono?"
- Si COMPLETOS: responde normal`
  }
})()}
` : ''}

PERSONALIDAD:
${bot.personality_prompt || 'Responde de manera útil, cortés y profesional. Siempre mantén un tono amigable y orientado al servicio al cliente.'}

INSTRUCCIONES:
- LEE Y RECUERDA todo el historial de conversación antes de responder
- Si ya tienes información de mensajes anteriores, úsala - NO la pidas otra vez
- Responde como parte del equipo del negocio  
- Usa información del negocio proporcionada
- Respuestas cortas, naturales y amigables
- Solo temas del negocio
- Números = cantidades en pedidos

DETECCIÓN DE INTENCIONES:
- PEDIDOS: Palabras clave como "quiero", "pedir", "ordenar", "llevar", "comprar", "me das", nombres de productos
- RESERVAS: Palabras clave como "reservar", "mesa", "cita", "apartar", "agendar", "programar", fechas y horas
- EXTRACCIÓN DE DATOS: Si el cliente menciona su nombre o teléfono, tómalo en cuenta para futuras referencias
- Responde proactivamente cuando detectes estas intenciones
- Para pedidos: confirma productos, cantidades y modalidad de entrega
- Para reservas: confirma fecha, hora, cantidad de personas y datos de contacto
- Sé natural al preguntar datos faltantes, no como un formulario

MENÚ/CARTA:
- Si piden carta: saluda + contexto + enlace directo (no hipervínculo) + invitar preguntas
- Tono entusiasta sobre productos`



    const messages_for_ai = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ]

    // Generate response using Gemini
    if (!bot.gemini_api_key) {
      return "Lo siento, no puedo responder en este momento. El bot no está configurado correctamente."
    }

    // Generate response using Gemini 2.5 Flash model with retry logic
    const maxAttempts = 3
    let attempt = 0
    let response: any = null
    
    while (attempt < maxAttempts) {
      attempt++
      
      try {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${bot.gemini_api_key}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\n=== HISTORIAL DE LA CONVERSACIÓN ===\n${conversationHistory.map((m: any) => `${m.role === 'user' ? 'Cliente' : 'Bot'}: ${m.content}`).join('\n')}\n\n=== NUEVO MENSAJE ===\nCliente: ${userMessage}\n\nBot: `
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              topK: 20,
              topP: 0.8,
            }
          })
        })

        if (response.ok) {
          break // Success, exit retry loop
        } else {
          const errorData = await response.text()
          console.error(`Gemini API error (attempt ${attempt}):`, response.status, errorData.substring(0, 200))
          
          // If it's a 503 error (overloaded) and we have more attempts, retry
          if (response.status === 503 && attempt < maxAttempts) {
            const backoff = 500 * Math.pow(2, attempt - 1)
            console.log(`🔄 Retrying Gemini API in ${backoff}ms (attempt ${attempt}/${maxAttempts})...`)
            await new Promise(resolve => setTimeout(resolve, backoff))
            continue
          }
          
          // For other errors or if this is the last attempt, break
          break
        }
      } catch (fetchError) {
        console.error(`Gemini API fetch error (attempt ${attempt}):`, fetchError)
        if (attempt < maxAttempts) {
          const backoff = 500 * Math.pow(2, attempt - 1)
          console.log(`🔄 Retrying Gemini API in ${backoff}ms (attempt ${attempt}/${maxAttempts})...`)
          await new Promise(resolve => setTimeout(resolve, backoff))
          continue
        }
      }
    }

    if (!response || !response.ok) {
      console.error('Gemini API failed after all retry attempts')
      return "Disculpa, tengo problemas técnicos. Intenta nuevamente en un momento."
    }

    const data = await response.json()
    
    if (data.candidates && data.candidates[0]) {
      const candidate = data.candidates[0]
      
      // Log finish reason for debugging
      if (candidate.finishReason) {
        console.log('🔍 Gemini finish reason:', candidate.finishReason)
      }
      
      // Check if we have valid content
      if (candidate.content && 
          candidate.content.parts && 
          candidate.content.parts[0] && 
          candidate.content.parts[0].text) {
        const aiResponse = candidate.content.parts[0].text.trim()

        // Process orders and reservations if bot has those features enabled
        const featuresCheck = bot.features || []
        const takeOrders = featuresCheck.includes('take_orders')
        const takeReservations = featuresCheck.includes('take_reservations')
        if (takeOrders || takeReservations) {
          await processOrdersAndReservations(
            supabase, 
            bot, 
            conversation, 
            userMessage, 
            aiResponse, 
            takeOrders, 
            takeReservations,
            senderName,
            senderPhone,
            extractedClientData
          )
        }

        return aiResponse
      }
    }
    
    console.error('Invalid Gemini response structure:', JSON.stringify(data, null, 2))
    return "Disculpa, no pude generar una respuesta. Intenta con otra pregunta."

  } catch (error) {
    console.error('Error generating bot response:', error)
    return "Disculpa, tengo problemas técnicos en este momento. Intenta nuevamente más tarde."
  }
}

// Function to process and save orders and reservations
async function processOrdersAndReservations(
  supabase: any,
  bot: any,
  conversation: any,
  userMessage: string,
  aiResponse: string,
  canTakeOrders: boolean,
  canTakeReservations: boolean,
  senderName?: string,
  senderPhone?: string,
  extractedClientData?: any
) {
  try {
    // Analyze the conversation to detect completed orders or reservations
    const combinedText = `${userMessage} ${aiResponse}`.toLowerCase()
    
    // Order detection patterns - improved logic
    if (canTakeOrders) {
      const orderKeywords = [
        'pedido confirmado', 'pedido registrado', 'total del pedido', 
        'resumen del pedido', 'pedido finalizado', 'tu pedido es',
        'el total es', 'total: $', 'confirmo tu pedido', 'anotado',
        'ya estamos preparando', 'te esperamos', 'listo el pedido',
        'perfecto, una', 'dale, una', 'excelente elección',
        'tu orden', 'orden confirmada', 'orden registrada',
        'perfecto!', 'listo!', '¡perfecto!', '¡listo!',
        'apuntado', 'tomamos nota', 'muy bien',
        'quedó anotado', 'genial', '¡genial!'
      ]
      
      const hasOrderConfirmation = orderKeywords.some(keyword => 
        aiResponse.toLowerCase().includes(keyword)
      )
      
      // Also check if we have a complete order (product + quantity + delivery method)
      const orderInfo = parseOrderFromResponse(aiResponse, userMessage)
      const hasCompleteOrder = orderInfo.items.length > 0 && (
        combinedText.includes('retir') || 
        combinedText.includes('domicilio') || 
        combinedText.includes('envío') ||
        combinedText.includes('delivery')
      )
      
      // Create order if confirmed OR if we have complete information and bot seems to be acknowledging it
      if (hasOrderConfirmation || (hasCompleteOrder && (
        aiResponse.toLowerCase().includes('dale') ||
        aiResponse.toLowerCase().includes('perfecto') ||
        aiResponse.toLowerCase().includes('excelente') ||
        aiResponse.toLowerCase().includes('anotado') ||
        aiResponse.toLowerCase().includes('listo')
      ))) {
        console.log('🛒 Order detected - creating order. Confirmation:', hasOrderConfirmation, 'Complete:', hasCompleteOrder)
        // Create order directly from confirmed information
        await createOrderFromConfirmedResponse(supabase, bot, conversation, userMessage, aiResponse, senderName, senderPhone)
      }
    }
    
    // Reservation detection patterns
    if (canTakeReservations) {
      const reservationKeywords = [
        'reserva confirmada', 'genial! reserva confirmada', 
        'reserva registrada', 'reserva para', 'mesa reservada', 
        'tu reserva', 'reserva finalizada', 'reserva anotada', 
        'reserva lista', 'cita confirmada', 'cita registrada', 
        'tu cita', 'mesa apartada', 'te esperamos el', 
        'nos vemos el', 'quedaste agendado', 'agendamos tu', 
        'programamos tu', 'tenemos tu mesa',
        'aquí tenés el resumen', 'resumen:', '**fecha:**', '**hora:**',
        'confirmada para', 'listo para', 'anotado para', 'registrado para'
      ]
      
      const hasReservationConfirmation = reservationKeywords.some(keyword => 
        aiResponse.toLowerCase().includes(keyword)
      )
      
      console.log('🔍 Checking reservation confirmation. Found:', hasReservationConfirmation)
      console.log('🤖 AI Response preview:', aiResponse.substring(0, 100))
      console.log('🔍 Full AI Response for debugging:', aiResponse)
      
      if (hasReservationConfirmation) {
        console.log('✅ Reservation confirmation detected - calling processReservationFromConversation')
        // Extract reservation information - passing extracted client data too
        await processReservationFromConversation(supabase, bot, conversation, userMessage, aiResponse, senderName, senderPhone, extractedClientData)
      } else {
        console.log('❌ No reservation confirmation keywords found in response')
      }
    }
  } catch (error) {
    console.error('Error processing orders/reservations:', error)
  }
}

// Function to create order from confirmed response (simplified approach)
async function createOrderFromConfirmedResponse(
  supabase: any,
  bot: any,
  conversation: any,
  userMessage: string,
  aiResponse: string,
  senderName?: string,
  senderPhone?: string
) {
  try {
    console.log('📝 Creating order from confirmed response')
    
    // Parse order information from the confirmed response
    const orderInfo = parseOrderFromResponse(aiResponse, userMessage)
    
    if (orderInfo.items.length > 0) {
      // Check if it's a delivery order without address
      if (orderInfo.orderType === 'delivery') {
        const hasAddressInMessage = /dirección|direccion|calle|número|numero|barrio|zona|vivo en|mi dirección es/i.test(`${userMessage} ${aiResponse}`)
        if (!hasAddressInMessage) {
          console.log('🚫 Delivery order detected but no address provided - not creating order yet')
          return // Don't create order until address is provided
        }
      }
      
      let clientId = conversation.client_id
      
      // Check if we need to find or create a client
      if (!clientId && senderPhone) {
        // Check if client exists by phone number
        const { data: existingClient } = await supabase
          .from("clients")
          .select("id, name, phone")
          .eq("user_id", bot.user_id)
          .eq("phone", senderPhone)
          .single()

        if (existingClient) {
          console.log('📱 Found existing client:', existingClient)
          clientId = existingClient.id
          
          // Update conversation with client_id
          await supabase
            .from("conversations")
            .update({ client_id: clientId })
            .eq("id", conversation.id)
        } else if (bot.features && bot.features.includes('register_clients')) {
          // Auto-register new client if feature is enabled
          console.log('👤 Auto-registering new client')
          const { data: newClient, error: clientError } = await supabase
            .from("clients")
            .insert({
              user_id: bot.user_id,
              name: senderName || `Cliente ${senderPhone}`,
              phone: senderPhone,
              source: 'whatsapp_auto',
              notes: 'Registrado automáticamente via WhatsApp'
            })
            .select()
            .single()

          if (!clientError && newClient) {
            console.log('✅ New client created:', newClient)
            clientId = newClient.id
            
            // Update conversation with new client_id
            await supabase
              .from("conversations")
              .update({ 
                client_id: clientId,
                client_name: newClient.name 
              })
              .eq("id", conversation.id)
          } else {
            console.error('❌ Error creating client:', clientError)
          }
        }
      }

      // Extract address if it's a delivery order
      let deliveryAddress = null
      if (orderInfo.orderType === 'delivery') {
        const addressMatch = `${userMessage} ${aiResponse}`.match(/(?:dirección|direccion|vivo en|mi dirección es|enviar a)[\s:]*([^.!?]+)/i)
        if (addressMatch) {
          deliveryAddress = addressMatch[1].trim()
        } else {
          deliveryAddress = 'Por confirmar'
        }
      }

      const { error } = await supabase
        .from("orders")
        .insert({
          user_id: bot.user_id,
          client_id: clientId,
          conversation_id: conversation.id,
          items: orderInfo.items,
          total_amount: orderInfo.total,
          customer_notes: `Pedido vía WhatsApp: ${userMessage}`,
          delivery_address: deliveryAddress,
          delivery_phone: senderPhone || conversation.client_phone,
          status: 'pending',
          order_type: orderInfo.orderType || 'pickup'
        })

      if (!error) {
        console.log('✅ Order created successfully:', orderInfo)
      } else {
        console.error('❌ Error saving order:', error)
      }
    }
  } catch (error) {
    console.error('Error creating order:', error)
  }
}

// Helper function to parse order information from bot response
function parseOrderFromResponse(aiResponse: string, userMessage: string) {
  const items = []
  let total = 0
  let orderType = 'pickup' // Default
  
  // Detect order type
  const combinedText = `${userMessage} ${aiResponse}`.toLowerCase()
  if (combinedText.includes('delivery') || combinedText.includes('domicilio') || 
      combinedText.includes('envío') || combinedText.includes('envio') || 
      combinedText.includes('llevar') || combinedText.includes('entregar')) {
    orderType = 'delivery'
  } else if (combinedText.includes('retirar') || combinedText.includes('retiro') || 
             combinedText.includes('buscar') || combinedText.includes('pasar')) {
    orderType = 'pickup'
  }
  
  // Product patterns - you can extend this with more products
  const productPatterns = [
    { names: ['big momma'], price: 12500 },
    { names: ['lomo completo'], price: 15000 },
    { names: ['lomo simple'], price: 12000 },
    { names: ['milanesa napolitana'], price: 14000 },
    { names: ['milanesa simple'], price: 11000 },
    { names: ['cheeseburger'], price: 11000 }
  ]
  
  for (const product of productPatterns) {
    for (const name of product.names) {
      if (combinedText.includes(name)) {
        // Try to extract quantity (default to 1)
        let quantity = 1
        const quantityMatch = combinedText.match(new RegExp(`(\\d+)\\s*${name}|${name}\\s*(\\d+)`, 'i'))
        if (quantityMatch) {
          quantity = parseInt(quantityMatch[1] || quantityMatch[2] || '1')
        }
        
        items.push({
          name: product.names[0], // Use first name as canonical
          quantity,
          price: product.price,
          notes: 'Pedido via WhatsApp'
        })
        total += product.price * quantity
        break // Avoid duplicates
      }
    }
  }
  
  return {
    items,
    total,
    orderType
  }
}

// Function to extract and save order information (keeping as fallback)
async function processOrderFromConversation(
  supabase: any,
  bot: any,
  conversation: any,
  userMessage: string,
  aiResponse: string,
  senderName?: string,
  senderPhone?: string
) {
  try {
    // Get recent conversation messages for context
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(10)

    const conversationContext = messages?.map((msg: any) => 
      `${msg.sender_type}: ${msg.content}`
    ).join('\n') || ''

    // Use AI to extract structured order information
    const extractionPrompt = `
Analiza esta conversación de un bot de restaurante y extrae la información del pedido si está completa.
Solo responde con un JSON válido o "NO_ORDER" si no hay un pedido completo.

Conversación:
${conversationContext}
Usuario: ${userMessage}
Bot: ${aiResponse}

Si hay un pedido completo, responde con este formato JSON:
{
  "hasOrder": true,
  "items": [
    {"name": "nombre del producto", "quantity": 2, "price": 15.50, "notes": "opcional"}
  ],
  "total": 31.00,
  "customerName": "nombre del cliente o null",
  "customerPhone": "teléfono o null", 
  "deliveryAddress": "dirección o null",
  "orderType": "delivery" o "pickup",
  "notes": "notas adicionales o null"
}

Si no hay pedido completo, responde: NO_ORDER
`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${bot.gemini_api_key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: extractionPrompt }] }],
        generationConfig: { temperature: 0.1 }
      })
    })

    if (response.ok) {
      const data = await response.json()
      
      if (!data.candidates || !data.candidates[0]) {
        console.error('Invalid Gemini response for order extraction:', data)
        return
      }
      
      const extractionResult = data.candidates[0]?.content?.parts?.[0]?.text?.trim()
      
      if (extractionResult && extractionResult !== 'NO_ORDER') {
        try {
          // Clean up the response text - remove markdown formatting if present
          let cleanedText = extractionResult.trim()
          if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.replace(/```json\s*/, '').replace(/```\s*$/, '')
          }
          if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/```\s*/, '').replace(/```\s*$/, '')
          }
          
          const orderData = JSON.parse(cleanedText)
          
          if (orderData.hasOrder && orderData.items && orderData.items.length > 0) {
            // Save order to database
            const { error } = await supabase
              .from("orders")
              .insert({
                user_id: bot.user_id,
                client_id: conversation.client_id,
                conversation_id: conversation.id,
                items: orderData.items,
                total_amount: orderData.total,
                customer_notes: orderData.notes,
                delivery_address: orderData.deliveryAddress,
                delivery_phone: senderPhone || orderData.customerPhone || conversation.client_phone,
                status: 'pending'
              })

            if (!error) {
              console.log('✅ Order saved successfully:', orderData)
            } else {
              console.error('❌ Error saving order:', error)
            }
          }
        } catch (parseError) {
          console.error('Error parsing order JSON:', parseError)
        }
      }
    }
  } catch (error) {
    console.error('Error extracting order information:', error)
  }
}

// Function to extract and save reservation information
async function processReservationFromConversation(
  supabase: any,
  bot: any,
  conversation: any,
  userMessage: string,
  aiResponse: string,
  senderName?: string,
  senderPhone?: string,
  extractedClientData?: any
) {
  try {
    console.log('🏨 PROCESSING RESERVATION FROM CONVERSATION')
    console.log('🔍 Processing reservation from conversation:', {
      userMessage,
      aiResponse: aiResponse.substring(0, 100) + '...',
      extractedClientData,
      botGeminiKey: bot.gemini_api_key ? 'Present' : 'Missing'
    })
    // Get recent conversation messages for context
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(10)

    const conversationContext = messages?.map((msg: any) => 
      `${msg.sender_type}: ${msg.content}`
    ).join('\n') || ''

    // Use AI to extract structured reservation information
    const extractionPrompt = `
Analiza esta conversación de un bot de restaurante y extrae la información de la reserva si está completa.

Conversación:
${conversationContext}
Usuario: ${userMessage}
Bot: ${aiResponse}

DATOS DEL CLIENTE (ya disponibles):
- Nombre: ${senderName || extractedClientData?.name || 'Usuario de Prueba'}
- Teléfono: ${senderPhone || extractedClientData?.phone || 'test-user'}

INSTRUCCIONES:
1. Si el bot confirma "RESERVA CONFIRMADA", extrae toda la información
2. Para fechas relativas como "este viernes", "mañana", "el sábado" - usa tu conocimiento de la fecha actual
3. Si menciona una fecha específica como "18 de noviembre", usa 2025-11-18
4. Para horas: "22 horas" = "22:00", "8pm" = "20:00"
5. USA el nombre y teléfono del cliente proporcionados arriba

Si hay una reserva completa, responde SOLO con JSON:
{
  "hasReservation": true,
  "customerName": "${senderName || extractedClientData?.name || 'Usuario de Prueba'}",
  "customerPhone": "${senderPhone || extractedClientData?.phone || 'test-user'}",
  "reservationDate": "YYYY-MM-DD",
  "reservationTime": "HH:MM",
  "partySize": número_de_personas,
  "specialRequests": "texto o null"
}

Si NO hay reserva completa, responde: NO_RESERVATION
`

    console.log('🤖 Calling Gemini AI for reservation extraction...')
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${bot.gemini_api_key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: extractionPrompt }] }],
        generationConfig: { 
          temperature: 0.1, 
          topP: 0.8,
          topK: 40
        }
      })
    })

    console.log('🤖 Gemini response status:', response.status)
    if (response.ok) {
      const data = await response.json()
      console.log('🤖 Gemini response data:', JSON.stringify(data, null, 2))
      
      if (!data.candidates || !data.candidates[0]) {
        console.error('❌ Invalid Gemini response for reservation extraction:', data)
        return
      }
      
      const candidate = data.candidates[0]
      let extractionResult = candidate?.content?.parts?.[0]?.text?.trim()
      
      console.log('🤖 AI extraction result for reservation:', extractionResult)
      
      // If Gemini didn't return content due to token limit, try manual extraction
      if (!extractionResult || candidate.finishReason === 'MAX_TOKENS') {
        console.log('⚠️ Gemini response incomplete, trying manual extraction...')
        extractionResult = await manualReservationExtraction(aiResponse, userMessage, conversationContext)
      }
      
      if (extractionResult && extractionResult !== 'NO_RESERVATION') {
        try {
          // Clean up the response text - remove markdown formatting if present
          let cleanedText = extractionResult.trim()
          if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.replace(/```json\s*/, '').replace(/```\s*$/, '')
          }
          if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/```\s*/, '').replace(/```\s*$/, '')
          }
          
          const reservationData = JSON.parse(cleanedText)

          // Confiar completamente en la fecha que extrajo la IA
          console.log('✅ Using AI-extracted reservation data:', reservationData)

          if (reservationData.hasReservation) {
            // Use Gemini extracted reservation data (most reliable)
            let customerName = reservationData.customerName || senderName || conversation.client_name
            let customerPhone = reservationData.customerPhone || senderPhone || conversation.client_phone
            
            // Only use extracted client data as fallback if reservation data is missing
            if (extractedClientData && (!customerName || !customerPhone)) {
              if (!customerName && extractedClientData.name) customerName = extractedClientData.name
              if (!customerPhone && extractedClientData.phone) customerPhone = extractedClientData.phone
            }

            console.log('🏨 Saving reservation with data:', {
              customerName,
              customerPhone,
              date: reservationData.reservationDate,
              time: reservationData.reservationTime,
              partySize: reservationData.partySize
            })

            // Create or update client record with the reservation data
            let clientId = conversation.client_id
            if (customerName && customerPhone && (customerName !== 'Usuario de Prueba' && customerPhone !== 'test-user')) {
              const clientRecord = await createOrUpdateClient(supabase, bot.user_id, {
                name: customerName,
                phone: customerPhone
              }, conversation.id)
              
              if (clientRecord) {
                clientId = clientRecord.id
                // Update conversation with the client_id
                await supabase
                  .from("conversations")
                  .update({ client_id: clientRecord.id })
                  .eq("id", conversation.id)
              }
            }

            // Save reservation to database
            console.log('💾 Inserting reservation into database with data:', {
              user_id: bot.user_id,
              client_id: clientId,
              conversation_id: conversation.id,
              customer_name: customerName,
              customer_phone: customerPhone,
              reservation_date: reservationData.reservationDate,
              reservation_time: reservationData.reservationTime,
              party_size: reservationData.partySize,
              special_requests: reservationData.specialRequests,
              status: 'pending'
            })

            const { data: insertedReservation, error } = await supabase
              .from("reservations")
              .insert({
                user_id: bot.user_id,
                client_id: clientId,
                conversation_id: conversation.id,
                customer_name: customerName,
                customer_phone: customerPhone,
                reservation_date: reservationData.reservationDate,
                reservation_time: reservationData.reservationTime,
                party_size: reservationData.partySize,
                special_requests: reservationData.specialRequests,
                status: 'pending'
              })
              .select()

            if (!error && insertedReservation) {
              console.log('✅ Reservation saved successfully to database!')
              console.log('✅ Inserted reservation ID:', insertedReservation[0]?.id)
              console.log('✅ Full inserted data:', insertedReservation[0])
            } else if (error) {
              console.error('❌ Error saving reservation to database:', error)
              console.error('❌ Error details:', {
                message: error.message,
                code: error.code,
                hint: error.hint,
                details: error.details
              })
            } else {
              console.error('❌ No error but no data returned from insert')
            }
          }
        } catch (parseError) {
          console.error('Error parsing reservation JSON:', parseError)
        }
      }
    }
  } catch (error) {
    console.error('Error extracting reservation information:', error)
  }
}

// Manual extraction fallback for reservations
async function manualReservationExtraction(aiResponse: string, userMessage: string, conversationContext: string): Promise<string> {
  console.log('🔧 Manual extraction from:', { aiResponse, userMessage })
  
  // Check if this looks like a confirmed reservation
  if (aiResponse.toLowerCase().includes('reserva confirmada')) {
    try {
      // Extract basic info from the confirmation message
      const responseLines = aiResponse.split('\n')
      let customerName = 'Usuario de Prueba'
      let reservationDate = new Date().toISOString().split('T')[0] // Today as fallback
      let reservationTime = '20:00'
      let partySize = 2
      
      // Try to extract name from "RESERVA CONFIRMADA para [name]"
      const nameMatch = aiResponse.match(/confirmada para ([^e]+?)(?:el|a las|en)/i)
      if (nameMatch) {
        customerName = nameMatch[1].trim()
      }
      
      // Also try to extract from user message if not found in response
      if (customerName === 'Usuario de Prueba') {
        const userNameMatch = userMessage.match(/soy ([^y]+?)(?:y|quiero|para)/i)
        if (userNameMatch) {
          customerName = userNameMatch[1].trim()
        }
      }
      
      // Try to extract date - more comprehensive day detection
      // Use local time to avoid timezone issues
      const today = new Date()
      const year = today.getFullYear()
      const month = today.getMonth()
      const date = today.getDate()
      const todayDay = today.getDay() // 0=Sunday, 1=Monday, etc
      
      console.log('🗓️ Date calculation - Today:', { 
        year, 
        month: month + 1, // Show human-readable month 
        date, 
        todayDay, 
        dayName: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][todayDay],
        todayISO: today.toISOString().split('T')[0]
      })
      
      if (aiResponse.includes('mañana') || userMessage.includes('mañana')) {
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        reservationDate = tomorrow.toISOString().split('T')[0]
        console.log('🗓️ Mañana calculated:', reservationDate)
      } else if (aiResponse.includes('jueves') || userMessage.includes('jueves')) {
        // Get next thursday (day 4)
        let daysToAdd = (4 - todayDay + 7) % 7
        if (daysToAdd === 0) daysToAdd = 7 // If today is Thursday, get next Thursday
        const nextThursday = new Date(today)
        nextThursday.setDate(nextThursday.getDate() + daysToAdd)
        reservationDate = nextThursday.toISOString().split('T')[0]
        console.log('🗓️ Jueves calculated:', reservationDate, 'daysToAdd:', daysToAdd)
      } else if (aiResponse.includes('miércoles') || userMessage.includes('miércoles')) {
        // Get next wednesday (day 3)
        let daysToAdd = (3 - todayDay + 7) % 7
        if (daysToAdd === 0) daysToAdd = 7 // If today is Wednesday, get next Wednesday
        const nextWednesday = new Date(today)
        nextWednesday.setDate(nextWednesday.getDate() + daysToAdd)
        reservationDate = nextWednesday.toISOString().split('T')[0]
        console.log('🗓️ Miércoles calculated:', reservationDate, 'daysToAdd:', daysToAdd)
      } else if (aiResponse.includes('viernes') || userMessage.includes('viernes')) {
        // Get next friday (day 5)
        let daysToAdd = (5 - todayDay + 7) % 7
        if (daysToAdd === 0) daysToAdd = 7 // If today is Friday, get next Friday
        const nextFriday = new Date(today)
        nextFriday.setDate(nextFriday.getDate() + daysToAdd)
        reservationDate = nextFriday.toISOString().split('T')[0]
        console.log('🗓️ Viernes calculated:', reservationDate, 'daysToAdd:', daysToAdd)
      } else if (aiResponse.includes('sábado') || userMessage.includes('sábado')) {
        // Get next saturday (day 6)
        let daysToAdd = (6 - todayDay + 7) % 7
        if (daysToAdd === 0) daysToAdd = 7
        const nextSaturday = new Date(today)
        nextSaturday.setDate(nextSaturday.getDate() + daysToAdd)
        reservationDate = nextSaturday.toISOString().split('T')[0]
        console.log('🗓️ Sábado calculated:', reservationDate, 'daysToAdd:', daysToAdd)
      } else if (aiResponse.includes('domingo') || userMessage.includes('domingo')) {
        // Get next sunday (day 0) - Find the next Sunday after today
        let daysToAdd = 7 - todayDay // Days until next Sunday
        if (todayDay === 0) daysToAdd = 7 // If today is Sunday, next Sunday is in 7 days
        const nextSunday = new Date(today)
        nextSunday.setDate(nextSunday.getDate() + daysToAdd)
        reservationDate = nextSunday.toISOString().split('T')[0]
        console.log('🗓️ Domingo calculated:', reservationDate, 'daysToAdd:', daysToAdd, 'from day', todayDay, 'miércoles(3) + days =', 15 + daysToAdd)
      }
      
      // Try to extract time (19:00, 20:00, etc) - check both response and user message
      let timeMatch = aiResponse.match(/(\d{1,2}):(\d{2})\s*hs?/i)
      if (!timeMatch) {
        timeMatch = userMessage.match(/(\d{1,2})\s*pm|(\d{1,2})\s*:\s*(\d{2})|(\d{1,2})\s*hs?/i)
        if (timeMatch) {
          if (timeMatch[1]) { // PM format
            let hour = parseInt(timeMatch[1])
            if (hour < 12) hour += 12 // Convert to 24h
            reservationTime = `${hour.toString().padStart(2, '0')}:00`
          } else if (timeMatch[2] && timeMatch[3]) { // HH:MM format
            reservationTime = `${timeMatch[2].padStart(2, '0')}:${timeMatch[3]}`
          } else if (timeMatch[4]) { // Just hour
            reservationTime = `${timeMatch[4].padStart(2, '0')}:00`
          }
        }
      } else {
        reservationTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`
      }
      
      // Try to extract party size - check both response and user message
      let partyMatch = aiResponse.match(/para (\d+) personas?/i)
      if (!partyMatch) {
        partyMatch = userMessage.match(/para (\d+) personas?|(\d+) personas?/i)
      }
      if (partyMatch) {
        partySize = parseInt(partyMatch[1] || partyMatch[2])
      }
      
      const manualResult = {
        hasReservation: true,
        customerName,
        customerPhone: 'test-user',
        reservationDate,
        reservationTime,
        partySize,
        specialRequests: null
      }
      
      console.log('🔧 Manual extraction result:', manualResult)
      return JSON.stringify(manualResult)
    } catch (error) {
      console.error('Error in manual extraction:', error)
      return 'NO_RESERVATION'
    }
  }
  
  return 'NO_RESERVATION'
}

// Function to extract client data from message using AI
async function extractClientDataFromMessage(
  message: string, 
  senderName?: string, 
  senderPhone?: string, 
  bot?: any, 
  conversationId?: string, 
  supabase?: any,
  platform?: string,
  senderInstagramId?: string
): Promise<any> {
  try {
    // Check if bot has auto client detection enabled (assume true for now)
    const autoDetectionEnabled = true // Could be bot.auto_client_detection in future
    if (!autoDetectionEnabled) return null

    // Handle platform-specific initial data
    if (platform === 'instagram') {
      // For Instagram, we have the Instagram ID and possibly the username
      let instagramUsername = null
      
      // Extract username if senderName is in @username format
      if (senderName?.startsWith('@') && !senderName.includes('instagram_')) {
        instagramUsername = senderName.substring(1) // Remove the @ symbol
        
        // If senderName is just a username (starts with @), don't use it as real name
        // Let AI extract the real name from messages instead
        return {
          instagram_id: senderInstagramId,
          instagram_username: instagramUsername
        }
      }
      
      // Skip if sender name is the default Instagram format
      if (senderName?.startsWith('@instagram_') || senderName?.startsWith('Instagram User')) {
        // Don't return early, let AI try to extract real name from message
      } else if (senderName && senderName !== 'Usuario de Prueba') {
        // We have a real name (not a username) for Instagram user
        return { 
          name: senderName, 
          instagram_id: senderInstagramId,
          instagram_username: instagramUsername
        }
      }
    } else if (platform === 'whatsapp') {
      // Skip if we already have both name and phone from WhatsApp
      if (senderName && senderPhone && senderName !== 'Usuario de Prueba' && senderPhone !== 'test-user') {
        return { name: senderName, phone: senderPhone }
      }
    }

    // Get conversation history for better context
    let conversationContext = message
    if (conversationId && supabase) {
      const { data: messages } = await supabase
        .from("messages")
        .select("content, sender_type")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(10)

      if (messages && messages.length > 0) {
        conversationContext = messages.map((msg: any) => 
          `${msg.sender_type === 'client' ? 'Cliente' : 'Bot'}: ${msg.content}`
        ).join('\n') + `\nCliente: ${message}`
        
        // Try to extract name from bot responses first (bot remembers user names)
        const botNameExtraction = extractNameFromBotResponses(messages)
        if (botNameExtraction) {
          console.log('🤖 Extracted name from bot response:', botNameExtraction)
          const result: any = { name: botNameExtraction }
          if (platform === 'instagram' && senderInstagramId) {
            result.instagram_id = senderInstagramId
          } else if (platform === 'whatsapp' && senderPhone) {
            result.phone = senderPhone
          }
          return result
        }
      }
    }

    // Use AI to extract potential client data from the conversation
    const extractionPrompt = `
Analiza la siguiente conversación y extrae SOLO si está EXPLÍCITAMENTE mencionado:
${platform === 'instagram' 
  ? '- Nombre del cliente (nombre de persona, no apodos como "mi amor", "corazón")\n- NO busques números de teléfono (es Instagram)'
  : '- Nombre del cliente (nombre de persona, no apodos como "mi amor", "corazón")\n- Número de teléfono'
}

Plataforma: ${platform || 'WhatsApp'}
Conversación:
${conversationContext}

REGLAS IMPORTANTES:
- Solo extrae información que esté claramente mencionada
- Para nombres: acepta solo nombres propios de personas (ej: "Juan", "María", "Carlos López")
- Para teléfonos: acepta números de 7-15 dígitos, con o sin espacios/guiones (ej: "301234567", "3001234567", "+57301234567", "261 454 0609", "2614-540-609")
- Busca frases como: "mi número es", "mi teléfono es", "me pueden llamar al", "soy del", números que aparezcan solos
- NO extraigas apodos, términos cariñosos, o información implícita
- NO inventes información que no está en el mensaje

Responde SOLO en formato JSON (sin markdown):
${platform === 'instagram' 
  ? '{\n  "name": "nombre extraído o null"\n}'
  : '{\n  "name": "nombre extraído o null",\n  "phone": "teléfono extraído o null"\n}'
}
`

    const genAI = new GoogleGenerativeAI(bot.gemini_api_key)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const result = await model.generateContent(extractionPrompt)
    const responseText = result.response.text()
    
    try {
      // Clean up the response text - remove markdown formatting if present
      let cleanedText = responseText.trim()
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\s*/, '').replace(/```\s*$/, '')
      }
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\s*/, '').replace(/```\s*$/, '')
      }
      
      const extractedData = JSON.parse(cleanedText)
      
      // Validate extracted data based on platform
      const validData: any = {}
      
      if (extractedData.name && typeof extractedData.name === 'string' && extractedData.name.length > 1) {
        validData.name = extractedData.name.trim()
      }
      
      // Only validate phone for WhatsApp platform
      if (platform !== 'instagram' && extractedData.phone && typeof extractedData.phone === 'string') {
        // Clean phone number: remove spaces, dashes, parentheses, but keep + for international
        const cleanPhone = extractedData.phone.trim().replace(/[\s\-\(\)]/g, '')
        // Validate it's a reasonable phone number (7-15 digits, optionally starting with +)
        if (cleanPhone.match(/^\+?[\d]{7,15}$/)) {
          validData.phone = cleanPhone
        }
      }
      
      // For Instagram, add the Instagram ID
      if (platform === 'instagram' && senderInstagramId) {
        validData.instagram_id = senderInstagramId
      }
      
      // Manual fallback extraction if AI didn't work
      if (!validData.name || (platform !== 'instagram' && !validData.phone)) {
        const manualExtraction = extractClientDataManually(conversationContext)
        if (!validData.name && manualExtraction.name) validData.name = manualExtraction.name
        // Only extract phone for non-Instagram platforms
        if (platform !== 'instagram' && !validData.phone && manualExtraction.phone) validData.phone = manualExtraction.phone
      }
      
      // If we have a phone but no valid name, try to find existing client in database
      // This should work regardless of client registration settings for better UX
      const hasValidName = validData.name && 
        !validData.name.includes('quién') && 
        !validData.name.includes('hacemos') && 
        !validData.name.includes('cuál') &&
        validData.name.length < 50 // Reasonable name length
      
      // Search for existing client by phone (WhatsApp) or Instagram ID
      if (supabase && bot.user_id && !hasValidName) {
        if (platform === 'instagram' && senderInstagramId) {
          console.log('🔍 Searching for existing Instagram client:', senderInstagramId)
          const { data: existingClient } = await supabase
            .from("clients")
            .select("name")
            .eq("user_id", bot.user_id)
            .eq("instagram", senderInstagramId)
            .single()
          
          if (existingClient && existingClient.name) {
            validData.name = existingClient.name
            console.log('✅ Found existing Instagram client name from DB:', existingClient.name)
          } else {
            console.log('ℹ️ No existing Instagram client found for ID:', senderInstagramId)
          }
        } else if (validData.phone) {
          console.log('🔍 Searching for existing client by phone:', validData.phone)
          const { data: existingClient } = await supabase
            .from("clients")
            .select("name")
            .eq("user_id", bot.user_id)
            .eq("phone", validData.phone)
            .single()
          
          if (existingClient && existingClient.name) {
            validData.name = existingClient.name
            console.log('✅ Found existing client name from DB:', existingClient.name)
          } else {
            // Clear invalid name if no client found
            if (!hasValidName) {
              validData.name = null
            }
            console.log('ℹ️ No existing client found for phone:', validData.phone)
          }
        }
      }
      
      // Return only if we have something useful
      if (validData.name || validData.phone || validData.instagram_id) {
        console.log('📞 Extracted client data:', validData)
        return validData
      }
      
    } catch (parseError) {
      console.log('Could not parse client data extraction:', parseError)
      // Try manual extraction as fallback
      const manualExtraction = extractClientDataManually(conversationContext)
      if (manualExtraction.name || manualExtraction.phone) {
        // If manual extraction has phone but no valid name, try to find existing client
        const hasValidManualName = manualExtraction.name && 
          !manualExtraction.name.includes('quién') && 
          !manualExtraction.name.includes('hacemos') && 
          !manualExtraction.name.includes('cuál') &&
          manualExtraction.name.length < 50
        
        if (manualExtraction.phone && !hasValidManualName && supabase && bot.user_id) {
          console.log('🔍 Searching for existing client by phone (manual):', manualExtraction.phone)
          const { data: existingClient } = await supabase
            .from("clients")
            .select("name")
            .eq("user_id", bot.user_id)
            .eq("phone", manualExtraction.phone)
            .single()
          
          if (existingClient && existingClient.name) {
            manualExtraction.name = existingClient.name
            console.log('✅ Found existing client name from DB (manual):', existingClient.name)
          } else {
            // Clear invalid name if no client found
            if (!hasValidManualName) {
              manualExtraction.name = null
            }
          }
        }
        
        console.log('📞 Manual extracted client data:', manualExtraction)
        return manualExtraction
      }
    }

    return null
  } catch (error) {
    console.error('Error in client data extraction:', error)
    return null
  }
}

// Function to extract names from bot responses when the bot recognizes the user
function extractNameFromBotResponses(messages: any[]): string | null {
  // Look for bot messages that greet the user by name
  const botMessages = messages.filter(msg => msg.sender_type === 'bot')
  
  for (const botMsg of botMessages) {
    const content = botMsg.content?.toLowerCase() || ''
    
    // Common greeting patterns where bot mentions user's name
    const greetingPatterns = [
      /¡hola,?\s+([a-záéíóúñü][a-záéíóúñü\s]*?)!/i,
      /hola,?\s+([a-záéíóúñü][a-záéíóúñü\s]*?)!/i,
      /¡buenas,?\s+([a-záéíóúñü][a-záéíóúñü\s]*?)!/i,
      /buenas,?\s+([a-záéíóúñü][a-záéíóúñü\s]*?)!/i,
      /¡qué tal,?\s+([a-záéíóúñü][a-záéíóúñü\s]*?)!/i,
      /qué tal,?\s+([a-záéíóúñü][a-záéíóúñü\s]*?)!/i,
      /bienvenido,?\s+([a-záéíóúñü][a-záéíóúñü\s]*?)!/i,
      /¡bienvenido,?\s+([a-záéíóúñü][a-záéíóúñü\s]*?)!/i,
      // Also check for names followed by common phrases
      /([a-záéíóúñü][a-záéíóúñü\s]*?),?\s+¡de nuevo por acá!/i,
      /([a-záéíóúñü][a-záéíóúñü\s]*?),?\s+de nuevo por acá!/i
    ]
    
    for (const pattern of greetingPatterns) {
      const match = botMsg.content.match(pattern)
      if (match && match[1]) {
        const extractedName = match[1].trim()
        // Validate it's a reasonable name (not too long, doesn't contain common phrases)
        if (extractedName.length >= 2 && 
            extractedName.length <= 25 && 
            !extractedName.includes('de nuevo') &&
            !extractedName.includes('por acá') &&
            !extractedName.includes('tal') &&
            !extractedName.includes('cómo') &&
            !/\d/.test(extractedName)) { // No numbers in name
          
          // Capitalize first letter
          const finalName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1).toLowerCase()
          console.log(`🎯 Extracted name from bot greeting: "${finalName}" from message: "${botMsg.content.substring(0, 50)}..."`)
          return finalName
        }
      }
    }
  }
  
  return null
}

// Manual extraction function for client data
function extractClientDataManually(conversationText: string): {name: string | null, phone: string | null} {
  let name = null
  let phone = null
  
  // Extract names - look for "soy [name]", "me llamo [name]", "mi nombre es [name]"
  const namePatterns = [
    /(?:soy|me llamo|mi nombre es|nombre:)\s+([a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]{2,30})/i,
    /a nombre de\s+([a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]{2,30})/i
  ]
  
  for (const pattern of namePatterns) {
    const match = conversationText.match(pattern)
    if (match && match[1]) {
      name = match[1].trim()
      break
    }
  }
  
  // Extract phone numbers - look for various patterns
  const phonePatterns = [
    /(?:mi (?:número|telefono) es|me pueden llamar al|teléfono:|número:)\s*([\+\d\s\-\(\)]{7,20})/i,
    /(\+?[\d]{2,4}[\s\-]?[\d]{3,4}[\s\-]?[\d]{3,4}[\s\-]?[\d]{0,4})/g, // Generic phone pattern
    /(261[\s\-]?[\d]{3}[\s\-]?[\d]{4})/g, // Mendoza area code
    /(\+54[\s\-]?9?[\s\-]?261[\s\-]?[\d]{3}[\s\-]?[\d]{4})/g // Argentina +54 with Mendoza
  ]
  
  for (const pattern of phonePatterns) {
    const match = conversationText.match(pattern)
    if (match && match[1]) {
      // Clean the phone number
      const cleanPhone = match[1].trim().replace(/[\s\-\(\)]/g, '')
      if (cleanPhone.match(/^\+?[\d]{7,15}$/)) {
        phone = cleanPhone
        break
      }
    }
  }
  
  return { name, phone }
}

// Function to create or update client record
async function createOrUpdateClient(supabase: any, userId: string, clientData: any, conversationId?: string): Promise<any> {
  try {
    // Check if client already exists by PHONE NUMBER or INSTAGRAM ID (unique identifiers)
    // Names are NOT unique - multiple people can have the same name
    let existingClient = null
    
    if (clientData.phone) {
      const { data: phoneClient } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", userId)
        .eq("phone", clientData.phone)
        .single()
      
      existingClient = phoneClient
      console.log('🔍 Found existing client by phone:', existingClient ? existingClient.id : 'none')
    } else if (clientData.instagram_id) {
      const { data: instagramClient } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", userId)
        .eq("instagram", clientData.instagram_id)
        .single()
      
      existingClient = instagramClient
      console.log('🔍 Found existing client by Instagram ID:', existingClient ? existingClient.id : 'none')
    } else {
      console.log('🔍 No phone or Instagram ID provided, cannot search for existing client')
    }

    if (existingClient) {
      // Update existing client with new information
      const updatedData: any = {}
      
      // Update name if we have a better name than the existing one
      const shouldUpdateName = clientData.name && 
        clientData.name !== 'Cliente sin nombre' && 
        (existingClient.name === 'Cliente sin nombre' || 
         existingClient.name === null || 
         existingClient.name === '' ||
         !existingClient.name)
      
      if (shouldUpdateName) {
        updatedData.name = clientData.name
        console.log(`🔄 Updating client name from "${existingClient.name}" to "${clientData.name}"`)
      }
      
      if (clientData.phone && !existingClient.phone) updatedData.phone = clientData.phone
      if (clientData.instagram_id && !existingClient.instagram) updatedData.instagram = clientData.instagram_id
      if (clientData.instagram_username && !existingClient.instagram_username) updatedData.instagram_username = clientData.instagram_username
      
      if (Object.keys(updatedData).length > 0) {
        const { data: updated, error } = await supabase
          .from("clients")
          .update(updatedData)
          .eq("id", existingClient.id)
          .select()
          .single()
        
        if (!error) {
          console.log('📝 Updated existing client:', updated)
          return updated
        }
      }
      
      return existingClient
    } else {
      // Create new client record
      const newClientData = {
        user_id: userId,
        name: clientData.name || 'Cliente sin nombre',
        phone: clientData.phone || null,
        instagram: clientData.instagram_id || null,
        instagram_username: clientData.instagram_username || null,
        email: null
      }

      const { data: newClient, error } = await supabase
        .from("clients")
        .insert(newClientData)
        .select()
        .single()

      if (!error) {
        console.log('👤 Created new client:', newClient)
        return newClient
      } else {
        console.error('Error creating client:', error)
      }
    }

    return null
  } catch (error) {
    console.error('Error in createOrUpdateClient:', error)
    return null
  }
}