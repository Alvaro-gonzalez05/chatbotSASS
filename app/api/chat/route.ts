import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { botId, message, clientPhone, clientName, platform = "test" } = await request.json()

    if (!botId || !message || !clientPhone) {
      return NextResponse.json(
        { error: "Missing required fields: botId, message, clientPhone" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get bot configuration
    const { data: bot, error: botError } = await supabase
      .from("bots")
      .select("*")
      .eq("id", botId)
      .eq("user_id", user.id)
      .single()

    if (botError || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    // Get or create conversation
    let conversation = await getOrCreateConversation(supabase, user.id, botId, clientPhone, clientName, platform)

    // Save user message
    await saveMessage(supabase, conversation.id, "client", message)

    // Generate bot response
    const botResponse = await generateBotResponse(supabase, bot, conversation, message, user.id)

    // Save bot response
    await saveMessage(supabase, conversation.id, "bot", botResponse)

    // Update conversation last activity
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation.id)

    return NextResponse.json({
      success: true,
      response: botResponse,
      conversationId: conversation.id
    })

  } catch (error) {
    console.error("Chat API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function getOrCreateConversation(supabase: any, userId: string, botId: string, clientPhone: string, clientName: string | null, platform: string) {
  // Check for existing conversation
  const { data: existingConversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("bot_id", botId)
    .eq("client_phone", clientPhone)
    .eq("status", "active")
    .single()

  if (existingConversation) {
    return existingConversation
  }

  // Create new conversation
  const { data: newConversation, error } = await supabase
    .from("conversations")
    .insert([{
      user_id: userId,
      bot_id: botId,
      client_phone: clientPhone,
      client_name: clientName,
      platform: platform,
      status: "active",
      context: {}
    }])
    .select()
    .single()

  if (error) throw error
  return newConversation
}

async function saveMessage(supabase: any, conversationId: string, senderType: string, content: string) {
  const { error } = await supabase
    .from("messages")
    .insert([{
      conversation_id: conversationId,
      sender_type: senderType,
      content: content,
      message_type: "text"
    }])

  if (error) throw error
}

async function generateBotResponse(supabase: any, bot: any, conversation: any, userMessage: string, userId: string) {
  // Get business information
  const businessData = await getBusinessData(supabase, userId)
  
  // Get conversation history for context
  const conversationHistory = await getConversationHistory(supabase, conversation.id)
  
  // Get dynamic features data
  const featuresData = await getFeaturesData(supabase, userId, bot.features)
  
  // Handle automatic client registration if feature is enabled
  if (bot.features.includes("register_clients")) {
    await handleClientRegistration(supabase, userId, conversation)
  }
  
  // Handle loyalty points query if feature is enabled and user asks about points
  let pointsInfo = null
  if (bot.features.includes("loyalty_points") && 
      (userMessage.toLowerCase().includes("puntos") || 
       userMessage.toLowerCase().includes("fidelización") ||
       userMessage.toLowerCase().includes("recompensa"))) {
    pointsInfo = await getClientPoints(supabase, userId, conversation.client_phone)
  }
  
  // Build dynamic prompt
  const systemPrompt = await buildDynamicPrompt(bot, businessData, conversationHistory, featuresData, pointsInfo)
  
  // Generate AI response
  if (bot.gemini_api_key) {
    return await callGeminiAPI(systemPrompt, userMessage, bot.gemini_api_key)
  } else {
    return await simulateIntelligentResponse(systemPrompt, userMessage, bot, businessData, pointsInfo)
  }
}

async function getBusinessData(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (!profile) return null

  // Process business info from the profile
  const businessInfo = profile.business_info
  if (businessInfo) {
    let processedHours = null
    if (businessInfo.opening_hours) {
      const openDays: string[] = []
      const closedDays: string[] = []

      Object.keys(businessInfo.opening_hours).forEach(day => {
        const dayInfo = businessInfo.opening_hours[day]
        const dayNameSpanish = {
          monday: 'Lunes',
          tuesday: 'Martes', 
          wednesday: 'Miércoles',
          thursday: 'Jueves',
          friday: 'Viernes',
          saturday: 'Sábado',
          sunday: 'Domingo'
        }[day] || day

        if (dayInfo.isOpen) {
          openDays.push(`${dayNameSpanish}: ${dayInfo.open} - ${dayInfo.close}`)
        } else {
          closedDays.push(dayNameSpanish)
        }
      })

      processedHours = {
        open_days: openDays,
        closed_days: closedDays,
        summary: `DÍAS ABIERTOS: ${openDays.join(' | ')}${closedDays.length > 0 ? ` | DÍAS CERRADOS: ${closedDays.join(', ')}` : ''}`
      }
    }

    return {
      business_name: businessInfo.business_name || profile.business_name,
      business_description: businessInfo.description,
      business_hours: processedHours,
      location: businessInfo.address,
      phone: businessInfo.phone,
      email: businessInfo.email,
      website: businessInfo.website,
      business_type: businessInfo.business_type
    }
  }

  return profile
}

async function getConversationHistory(supabase: any, conversationId: string) {
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(10) // Last 10 messages for context

  return messages || []
}

async function getFeaturesData(supabase: any, userId: string, features: string[]) {
  const featuresData: any = {}

  // Get products if "tomar_pedidos" is enabled
  if (features.includes("tomar_pedidos")) {
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", userId)
      .eq("is_available", true)
      .order("category", { ascending: true })

    featuresData.products = products || []
  }

  // Get recent orders if needed
  if (features.includes("tomar_pedidos")) {
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)

    featuresData.recent_orders = recentOrders || []
  }

  // Get reservations if "tomar_reservas" is enabled
  if (features.includes("tomar_reservas")) {
    const today = new Date().toISOString().split('T')[0]
    const { data: todayReservations } = await supabase
      .from("reservations")
      .select("*")
      .eq("user_id", userId)
      .eq("reservation_date", today)
      .eq("status", "confirmed")

    featuresData.today_reservations = todayReservations || []
  }

  return featuresData
}

async function handleClientRegistration(supabase: any, userId: string, conversation: any) {
  // Check if client already exists
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", userId)
    .eq("phone", conversation.client_phone)
    .single()

  if (!existingClient && conversation.client_name) {
    // Register new client automatically
    await supabase
      .from("clients")
      .insert([{
        user_id: userId,
        name: conversation.client_name,
        phone: conversation.client_phone,
        points: 0, // Start with 0 points
        total_purchases: 0
      }])

    // Update conversation to link the client
    const { data: newClient } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", userId)
      .eq("phone", conversation.client_phone)
      .single()

    if (newClient) {
      await supabase
        .from("conversations")
        .update({ client_id: newClient.id })
        .eq("id", conversation.id)
    }
  }
}

async function getClientPoints(supabase: any, userId: string, clientPhone: string) {
  const { data: client } = await supabase
    .from("clients")
    .select("name, points, total_purchases")
    .eq("user_id", userId)
    .eq("phone", clientPhone)
    .single()

  return client
}

async function buildDynamicPrompt(bot: any, businessData: any, conversationHistory: any[], featuresData: any, pointsInfo?: any) {
  let prompt = `Eres ${bot.name}, un asistente virtual inteligente para ${businessData?.business_name || 'un negocio'}.

PERSONALIDAD: ${bot.personality_prompt}

INFORMACIÓN DEL NEGOCIO:
- Nombre: ${businessData?.business_name || 'No especificado'}
- Tipo: ${businessData?.business_type || 'No especificado'}
- Descripción: ${businessData?.business_description || 'No especificado'}
- Dirección: ${businessData?.location || 'No especificado'}
- Teléfono: ${businessData?.phone || 'No especificado'}
- Email: ${businessData?.email || 'No especificado'}
- Sitio web: ${businessData?.website || 'No especificado'}
- HORARIOS: ${businessData?.business_hours?.summary || 'No especificado'}

FUNCIONALIDADES HABILITADAS:`

  // Add dynamic features information
  if (bot.features.includes("tomar_pedidos") && featuresData.products) {
    prompt += `
- ✅ TOMAR PEDIDOS: Puedes ayudar a los clientes a hacer pedidos
- PRODUCTOS DISPONIBLES:`
    
    const productsByCategory = featuresData.products.reduce((acc: any, product: any) => {
      const category = product.category || 'Sin categoría'
      if (!acc[category]) acc[category] = []
      acc[category].push(product)
      return acc
    }, {})

    Object.keys(productsByCategory).forEach(category => {
      prompt += `
  ${category.toUpperCase()}:`
      productsByCategory[category].forEach((product: any) => {
        prompt += `
    - ${product.name}: $${product.price}${product.description ? ` (${product.description})` : ''}`
      })
    })
  }

  if (bot.features.includes("tomar_reservas")) {
    prompt += `
- ✅ TOMAR RESERVAS: Puedes ayudar a gestionar reservas de mesas`
    
    if (featuresData.today_reservations && featuresData.today_reservations.length > 0) {
      prompt += `
- RESERVAS DE HOY: ${featuresData.today_reservations.length} reservas confirmadas`
    }
  }

  if (bot.features.includes("register_clients")) {
    prompt += `
- ✅ REGISTRO DE CLIENTES: Registras automáticamente nuevos clientes cuando chatean contigo`
  }

  if (bot.features.includes("loyalty_points")) {
    prompt += `
- ✅ CONSULTA DE PUNTOS: Puedes informar sobre puntos de fidelización de clientes registrados`
    
    if (pointsInfo) {
      prompt += `
- INFORMACIÓN DEL CLIENTE ACTUAL:
  - Nombre: ${pointsInfo.name}
  - Puntos acumulados: ${pointsInfo.points}
  - Total de compras: $${pointsInfo.total_purchases}`
    }
  }

  // Add conversation history for context
  if (conversationHistory.length > 0) {
    prompt += `

HISTORIAL DE CONVERSACIÓN RECIENTE:`
    conversationHistory.slice(-6).forEach((msg: any) => {
      const sender = msg.sender_type === 'client' ? 'Cliente' : bot.name
      prompt += `
${sender}: ${msg.content}`
    })
  }

  prompt += `

INSTRUCCIONES:
- Responde como el asistente virtual del negocio usando tu personalidad
- Usa la información del negocio cuando sea relevante
- Si tienes habilitado "tomar_pedidos", ayuda activamente con pedidos y sugiere productos
- Si tienes habilitado "tomar_reservas", ayuda con reservas de mesas
- Si tienes habilitado "register_clients", automáticamente registro la información del cliente
- Si tienes habilitado "loyalty_points", puedo consultar y mostrar los puntos del cliente cuando me pregunten
- Mantén el contexto de la conversación
- Responde en español con estilo creativo y argentino
- Usa emojis apropiados para hacer la conversación más amena
- No repitas información innecesariamente si ya la mencionaste antes
- No cometas errores ortográficos ni digas palabras sin sentido
- Cuando un cliente pregunte por sus puntos, muestra la información de manera clara y amigable`

  return prompt
}

async function callGeminiAPI(systemPrompt: string, userMessage: string, apiKey: string) {
  try {
    const fullPrompt = `${systemPrompt}

Cliente: ${userMessage}

Responde como ${systemPrompt.split(',')[0].replace('Eres ', '')}:`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }]
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude procesar tu mensaje."

  } catch (error) {
    console.error('Error calling Gemini:', error)
    return "Disculpa, tengo problemas técnicos en este momento. ¿Podrías intentar de nuevo?"
  }
}

async function simulateIntelligentResponse(systemPrompt: string, userMessage: string, bot: any, businessData: any, pointsInfo?: any) {
  const lowerMessage = userMessage.toLowerCase()
  const businessName = businessData?.business_name || 'nuestro negocio'

  // Contextual responses based on user input
  if (lowerMessage.includes('hola') || lowerMessage.includes('buenos') || lowerMessage.includes('buenas')) {
    return `¡Hola! 👋 Soy ${bot.name}, el asistente virtual de ${businessName}. ¿En qué puedo ayudarte hoy?`
  }

  if (lowerMessage.includes('horario') || lowerMessage.includes('hora') || lowerMessage.includes('abierto')) {
    const hours = businessData?.business_hours?.summary || 'Por favor contacta al negocio para información de horarios'
    return `📅 Te ayudo con los horarios de ${businessName}:\n\n${hours}\n\n¿Hay algo más en lo que pueda asistirte?`
  }

  if (lowerMessage.includes('ubicación') || lowerMessage.includes('dirección') || lowerMessage.includes('donde')) {
    const location = businessData?.location || 'la ubicación no está especificada'
    return `📍 ${businessName} se encuentra en ${location}. ¿Te gustaría que te proporcione más información?`
  }

  if (lowerMessage.includes('menu') || lowerMessage.includes('producto') || lowerMessage.includes('que vende')) {
    return `🍽️ En ${businessName} tenemos una gran variedad de productos. ¿Te interesa algo específico? ¡Puedo ayudarte a encontrar lo que buscas!`
  }

  if (lowerMessage.includes('puntos') || lowerMessage.includes('fidelización') || lowerMessage.includes('recompensa')) {
    if (pointsInfo) {
      return `🎯 ¡Hola ${pointsInfo.name}! Tienes **${pointsInfo.points} puntos** acumulados en tu cuenta de fidelización. 🎉\n\nTotal de compras: $${pointsInfo.total_purchases}\n\n¡Sigue comprando para acumular más puntos y obtener recompensas! ✨`
    } else {
      return `🎯 Para consultar tus puntos de fidelización, primero necesito que te registres con nosotros. ¡Háblame y automáticamente te agregaré a nuestro programa de puntos! ⭐`
    }
  }

  // Default response with personality
  return `Como asistente de ${businessName}, estoy aquí para ayudarte con información sobre nuestros servicios, horarios, ubicación y más. 😊 ¿Qué te gustaría saber específicamente?`
}