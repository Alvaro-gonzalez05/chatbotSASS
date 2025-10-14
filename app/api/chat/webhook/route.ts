import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { botId, message, conversationId, senderPhone, senderName } = await request.json()

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



    // Get conversation
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single()

    if (conversationError || !conversation) {
      console.error('Conversation not found:', conversationError)
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Generate bot response using the same logic as the main chat API
    const botResponse = await generateBotResponse(supabase, bot, conversation, message, bot.user_id, userProfile, senderName, senderPhone)

    // Save bot response to messages table
    const { error: saveError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        content: botResponse,
        sender_type: 'bot',
        message_type: 'text',
        metadata: { generated_via: 'webhook', sender_phone: senderPhone }
      })

    if (saveError) {
      console.error('Error saving bot message:', saveError)
    }

    // Update conversation last activity
    await supabase
      .from("conversations")
      .update({ 
        last_message_at: new Date().toISOString(),
        status: 'active'
      })
      .eq("id", conversationId)

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
  senderPhone?: string
): Promise<string> {
  try {
    // Get conversation history for context
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
      .limit(20) // Last 20 messages for context

    const conversationHistory = messages?.map((msg: any) => ({
      role: msg.sender_type === 'client' ? 'user' : 'assistant',
      content: msg.content
    })) || []

    // Prepare the enhanced prompt with business information from user_profiles table
    let businessInfo = 'No hay información del negocio disponible.'
    let productsInfo = ''
    let botCapabilities = ''
    let deliveryModesInfo = ''
    
    // Check bot features for orders and reservations
    const botFeatures = bot.features || []
    const canTakeOrders = botFeatures.includes('take_orders')
    const canTakeReservations = botFeatures.includes('take_reservations')
    
    if (userProfile) {
      console.log('🏢 User profile loaded:', userProfile)
      console.log('🤖 Bot features:', botFeatures)
      
      // Format business hours
      let hoursText = 'No especificado'
      if (userProfile.business_hours && typeof userProfile.business_hours === 'object') {
        const openDays = Object.entries(userProfile.business_hours)
          .filter(([_, dayInfo]: [string, any]) => dayInfo?.isOpen)
          .map(([day, dayInfo]: [string, any]) => `${day}: ${dayInfo.open} - ${dayInfo.close}`)
        hoursText = openDays.length > 0 ? openDays.join(', ') : 'Cerrado toda la semana'
      }

      // Format social media
      let socialText = 'No especificado'
      if (userProfile.social_links && typeof userProfile.social_links === 'object') {
        const socialLinks = Object.entries(userProfile.social_links)
          .filter(([_, link]) => link && typeof link === 'string' && link.trim())
          .map(([platform, link]) => `${platform}: ${link}`)
        socialText = socialLinks.length > 0 ? socialLinks.join(', ') : 'No especificado'
      }

      // Try to get additional info from business_info field if individual fields are empty
      const fallbackInfo = userProfile.business_info || {}
      
      // Format menu/catalog information
      const menuLink = userProfile.menu_link || fallbackInfo.menu_link
      const menuText = menuLink ? `Disponible en: ${menuLink}` : 'No especificado'

      businessInfo = `
Nombre del negocio: ${userProfile.business_name || fallbackInfo.business_name || 'No especificado'}
Descripción: ${userProfile.business_description || fallbackInfo.description || 'No especificado'}
Dirección: ${userProfile.location || fallbackInfo.address || 'No especificado'}
Teléfono: ${fallbackInfo.phone || 'No especificado'}
Email: ${fallbackInfo.email || 'No especificado'}
Sitio web: ${fallbackInfo.website || 'No especificado'}
Menú/Catálogo: ${menuText}
Tipo de negocio: ${fallbackInfo.business_type || 'No especificado'}
Horarios de atención: ${hoursText}
Redes sociales: ${socialText}
      `.trim()

      // Get delivery settings if bot can take orders
      if (canTakeOrders) {
        const { data: deliverySettings } = await supabase
          .from("delivery_settings")
          .select("*")
          .eq("user_id", userId)
          .single()

        if (deliverySettings) {
          const availableModes = []
          if (deliverySettings.pickup_enabled) {
            availableModes.push(`• RETIRO EN EL LOCAL: ${deliverySettings.pickup_instructions} (Tiempo estimado: ${deliverySettings.pickup_time_estimate})`)
          }
          if (deliverySettings.delivery_enabled) {
            const deliveryFee = deliverySettings.delivery_fee > 0 ? ` (Costo: $${deliverySettings.delivery_fee})` : ''
            const minOrder = deliverySettings.minimum_order_delivery > 0 ? ` (Pedido mínimo: $${deliverySettings.minimum_order_delivery})` : ''
            availableModes.push(`• ENVÍO A DOMICILIO: ${deliverySettings.delivery_instructions}${deliveryFee}${minOrder} (Tiempo estimado: ${deliverySettings.delivery_time_estimate})`)
          }
          
          if (availableModes.length > 0) {
            deliveryModesInfo = `
MODALIDADES DE ENTREGA DISPONIBLES:
${availableModes.join('\n')}

IMPORTANTE PARA ENVÍOS A DOMICILIO:
- Si el cliente elige envío a domicilio, SIEMPRE pregunta por la dirección completa antes de confirmar el pedido
- La dirección debe incluir calle, número, barrio/zona
- Sin dirección completa NO se puede confirmar el pedido de envío a domicilio
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
      if (canTakeOrders || canTakeReservations) {
        const capabilities = []
        if (canTakeOrders) capabilities.push('tomar pedidos de productos del catálogo')
        if (canTakeReservations) capabilities.push('tomar reservas para mesas')
        
        botCapabilities = `
FUNCIONALIDADES ESPECIALES DEL BOT:
Estás habilitado para: ${capabilities.join(' y ')}.

${canTakeOrders ? `
INSTRUCCIONES PARA PEDIDOS:
- FLUJO: 1) Confirma producto/cantidad 2) Delivery/retiro 3) Solo pide teléfono si no lo tienes 4) "PEDIDO CONFIRMADO" + resumen
- Ya tienes el teléfono del cliente (${senderPhone || 'no disponible'}), NO lo pidas de nuevo
- Cuando tengas: producto + cantidad + delivery/retiro, di "PEDIDO CONFIRMADO" inmediatamente
- Los números simples (1,2,3) son cantidades
` : ''}

${canTakeReservations ? `
INSTRUCCIONES PARA RESERVAS:
- Pide: fecha, hora, cantidad personas, nombre, teléfono
- Al final: "RESERVA CONFIRMADA" con resumen
` : ''}
        `.trim()
      }
    }
    
    // Prepare client information
    const clientInfo = senderName || senderPhone || 'Cliente'
    const hasClientPhone = senderPhone && senderPhone !== conversation.client_phone

    const systemPrompt = `Eres ${bot.name}, un asistente virtual amigable y profesional que representa a un negocio.

INFORMACIÓN DEL NEGOCIO:
${businessInfo}

${productsInfo}

${deliveryModesInfo}

INFORMACIÓN DEL CLIENTE ACTUAL:
- Nombre: ${clientInfo}
${senderPhone ? `- Teléfono: ${senderPhone}` : ''}

${botCapabilities}

PERSONALIDAD:
${bot.personality_prompt || 'Responde de manera útil, cortés y profesional. Siempre mantén un tono amigable y orientado al servicio al cliente.'}

INSTRUCCIONES:
- Recuerda toda la conversación anterior
- Responde como parte del equipo del negocio
- Usa información del negocio proporcionada
- Respuestas cortas, naturales y amigables
- Solo temas del negocio
- Números = cantidades en pedidos

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

    // Generate response using Gemini 2.5 Flash model
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${bot.gemini_api_key}`, {
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
          maxOutputTokens: 1024,
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API error:', response.status, errorData.substring(0, 200))
      return "Disculpa, tengo problemas técnicos. Intenta nuevamente en un momento."
    }

    const data = await response.json()
    
    if (data.candidates && data.candidates[0]) {
      const candidate = data.candidates[0]
      
      // Check if response was cut off due to max tokens
      if (candidate.finishReason === 'MAX_TOKENS') {
        console.warn('Response was cut off due to MAX_TOKENS limit')
        return "Disculpa, mi respuesta fue muy larga. ¿Podrías repetir tu pregunta de forma más específica?"
      }
      
      // Check if we have valid content
      if (candidate.content && 
          candidate.content.parts && 
          candidate.content.parts[0] && 
          candidate.content.parts[0].text) {
        const aiResponse = candidate.content.parts[0].text.trim()

        // Process orders and reservations if bot has those features enabled
        if (canTakeOrders || canTakeReservations) {
          await processOrdersAndReservations(
            supabase, 
            bot, 
            conversation, 
            userMessage, 
            aiResponse, 
            canTakeOrders, 
            canTakeReservations,
            senderName,
            senderPhone
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
  senderPhone?: string
) {
  try {
    // Analyze the conversation to detect completed orders or reservations
    const combinedText = `${userMessage} ${aiResponse}`.toLowerCase()
    
    // Order detection patterns
    if (canTakeOrders) {
      const orderKeywords = [
        'pedido confirmado', 'pedido registrado', 'total del pedido', 
        'resumen del pedido', 'pedido finalizado', 'tu pedido es',
        'el total es', 'total: $', 'confirmo tu pedido'
      ]
      
      const hasOrderConfirmation = orderKeywords.some(keyword => 
        aiResponse.toLowerCase().includes(keyword)
      )
      
      if (hasOrderConfirmation) {
        // Create order directly from confirmed information
        await createOrderFromConfirmedResponse(supabase, bot, conversation, userMessage, aiResponse, senderName, senderPhone)
      }
    }
    
    // Reservation detection patterns
    if (canTakeReservations) {
      const reservationKeywords = [
        'reserva confirmada', 'reserva registrada', 'reserva para',
        'mesa reservada', 'tu reserva', 'reserva finalizada'
      ]
      
      const hasReservationConfirmation = reservationKeywords.some(keyword => 
        aiResponse.toLowerCase().includes(keyword)
      )
      
      if (hasReservationConfirmation) {
        // Extract reservation information
        await processReservationFromConversation(supabase, bot, conversation, userMessage, aiResponse, senderName, senderPhone)
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
        generationConfig: { temperature: 0.1, maxOutputTokens: 512 }
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
          const orderData = JSON.parse(extractionResult)
          
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

    // Use AI to extract structured reservation information
    const extractionPrompt = `
Analiza esta conversación de un bot de restaurante y extrae la información de la reserva si está completa.
Solo responde con un JSON válido o "NO_RESERVATION" si no hay una reserva completa.

Conversación:
${conversationContext}
Usuario: ${userMessage}
Bot: ${aiResponse}

Si hay una reserva completa, responde con este formato JSON:
{
  "hasReservation": true,
  "customerName": "nombre del cliente",
  "customerPhone": "teléfono",
  "reservationDate": "YYYY-MM-DD",
  "reservationTime": "HH:MM",
  "partySize": 4,
  "specialRequests": "solicitudes especiales o null"
}

Si no hay reserva completa, responde: NO_RESERVATION
`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${bot.gemini_api_key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: extractionPrompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 512 }
      })
    })

    if (response.ok) {
      const data = await response.json()
      
      if (!data.candidates || !data.candidates[0]) {
        console.error('Invalid Gemini response for reservation extraction:', data)
        return
      }
      
      const extractionResult = data.candidates[0]?.content?.parts?.[0]?.text?.trim()
      
      if (extractionResult && extractionResult !== 'NO_RESERVATION') {
        try {
          const reservationData = JSON.parse(extractionResult)
          
          if (reservationData.hasReservation) {
            // Save reservation to database
            const { error } = await supabase
              .from("reservations")
              .insert({
                user_id: bot.user_id,
                client_id: conversation.client_id,
                conversation_id: conversation.id,
                customer_name: senderName || reservationData.customerName || conversation.client_name,
                customer_phone: senderPhone || reservationData.customerPhone || conversation.client_phone,
                reservation_date: reservationData.reservationDate,
                reservation_time: reservationData.reservationTime,
                party_size: reservationData.partySize,
                special_requests: reservationData.specialRequests,
                status: 'pending'
              })

            if (!error) {
              console.log('✅ Reservation saved successfully:', reservationData)
            } else {
              console.error('❌ Error saving reservation:', error)
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