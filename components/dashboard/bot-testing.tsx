"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, UserIcon, Play, RotateCcw } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "sonner"

interface Bot {
  id: string
  name: string
  platform: string
  personality_prompt: string
  is_active: boolean
  gemini_api_key?: string
  gemini_model?: string // Ejemplo: 'gemini-1.5-flash', 'gemini-1.5-pro', etc.
}

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
}

export function BotTesting() {
  const [bots, setBots] = useState<Bot[]>([])
  const [selectedBot, setSelectedBot] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchBots()
  }, [])

  const fetchBots = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from("bots").select("*, gemini_api_key").eq("user_id", user.id).eq("is_active", true)

      if (error) throw error
      setBots(data || [])
    } catch (error) {
      console.error("Error fetching bots:", error)
      toast.error("Error al cargar bots", {
        description: "No se pudieron cargar los bots disponibles. Verifica tu conexión e inténtalo de nuevo.",
        duration: 4000,
      })
    }
  }

  const fetchBusinessData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('User:', user?.id)
      if (!user) return null

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('business_info, business_name')
        .eq('id', user.id)
        .single()

      console.log('Business data fetch result:', { profile, error })

      if (error) {
        console.error('Supabase error:', error)
        return null
      }

      // Extraer información del campo business_info si existe
      const businessInfo = profile?.business_info
      if (businessInfo) {
        // Procesar horarios para separar claramente días abiertos y cerrados
        let processedHours = null
        if (businessInfo.opening_hours) {
          const openDays = []
          const closedDays = []

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
          business_name: businessInfo.business_name || profile?.business_name,
          business_description: businessInfo.description,
          business_hours: processedHours,
          location: businessInfo.address,
          phone: businessInfo.phone,
          email: businessInfo.email,
          website: businessInfo.website,
          business_type: businessInfo.business_type
        }
      }

      // Fallback a campos antiguos si no existe business_info
      return profile
    } catch (error) {
      console.error('Error fetching business data:', error)
      return null
    }
  }

  const generateAIResponse = async (userMessage: string, bot: Bot) => {
    try {
      const businessData = await fetchBusinessData()
      console.log('Business data for AI:', businessData)

      // Obtener historial de conversación reciente (últimos 6 mensajes)
      const recentMessages = messages.slice(-6).map(msg =>
        `${msg.type === 'user' ? 'Cliente' : bot.name}: ${msg.content}`
      ).join('\n')

      const conversationContext = recentMessages.length > 0
        ? `\n\nHISTORIAL DE CONVERSACIÓN RECIENTE:\n${recentMessages}\n`
        : ''

  // Construir el contexto para la IA
  const systemPrompt = `Eres ${bot.name}, un asistente virtual para ${businessData?.business_name || 'un negocio'}.

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
INSTRUCCIONES:
- Responde como el asistente virtual del negocio
- Usa la personalidad especificada en tus respuestas
- Proporciona información útil y específica sobre el negocio cuando sea relevante
- Usa los datos de contacto, horarios y ubicación cuando sea apropiado
- Mantén un tono profesional pero amigable según tu personalidad
- Si no tienes información específica, ofrece ayuda general
- Responde en español
- Ten en cuenta el historial de conversación para dar respuestas coherentes y no repetitivas
INSTRUCCIONES ESPECIALES PARA HORARIOS:
- SOLO menciona los días que aparecen en "DÍAS ABIERTOS" como horarios de funcionamiento
- Los días que aparecen en "DÍAS CERRADOS" NO tienen horario - están completamente CERRADOS
- Cuando pregunten por horarios, primero da los días abiertos, después menciona los días cerrados con una frase creativa argentina

INSTRUCCIONES EXTRA:
- Da las respuestas con un estilo creativo, divertido y argentino. Usa emojis y frases coloquiales cuando sea apropiado
- Haz que el mensaje sea cálido y cercano, no aburrido ni robótico
- No incluyas información innecesaria ni repitas todos los datos del negocio en cada respuesta
- No te saludes de nuevo si ya lo hiciste en la conversación
- Responde de manera concisa y directa${conversationContext}

Mensaje del cliente: "${userMessage}"`

      console.log('System prompt being sent to AI:', systemPrompt)

      // Verificar si el bot tiene una API key de Gemini configurada
      const selectedBotData = bots.find(b => b.id === bot.id)
      if (selectedBotData && selectedBotData.gemini_api_key) {
        // Usar Gemini API para generar respuesta real
        const response = await callGemini(systemPrompt, userMessage, selectedBotData.gemini_api_key, 'gemini-1.5-flash')
        return response
      } else {
        // Fallback: simulación inteligente para testing
        const response = await simulateAIResponse(systemPrompt, userMessage, bot, businessData)
        return response
      }
    } catch (error) {
      console.error('Error generating AI response:', error)
      return `Disculpa, tengo problemas técnicos en este momento. ¿Podrías intentar de nuevo?\n\nDetalles para depuración: ${error instanceof Error ? error.message : String(error)}`
    }
  }

  const listModels = async (apiKey: string) => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        return data.models || []
      }
      return []
    } catch (error) {
      console.error('Error listing models:', error)
      return []
    }
  }

  const callGemini = async (systemPrompt: string, userMessage: string, apiKey: string, model: string) => {
    try {
      if (!apiKey) {
        throw new Error('API key not found')
      }

      // Primero listar los modelos disponibles
      const availableModels = await listModels(apiKey)

      const fullPrompt = `${systemPrompt}\n\nUsuario: ${userMessage}`

      // Forzar uso del modelo gratuito gemini-1.5-flash
      let actualModel = 'gemini-1.5-flash'
      
      if (availableModels.length > 0) {
        // Buscar específicamente gemini-1.5-flash (modelo gratuito)
        const flashModel = availableModels.find((m: any) => 
          m.name.includes('gemini-1.5-flash') && 
          m.supportedGenerationMethods?.includes('generateContent')
        )
        
        if (flashModel) {
          actualModel = flashModel.name.split('/').pop()
          console.log('✅ Using FREE model:', actualModel)
        } else {
          // Fallback a cualquier modelo gratuito que contenga "flash"
          const freeModel = availableModels.find((m: any) => 
            m.name.includes('flash') && 
            m.supportedGenerationMethods?.includes('generateContent')
          )
          if (freeModel) {
            actualModel = freeModel.name.split('/').pop()
          }
        }
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`,
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
        const errorText = await response.text()
        console.error('Gemini API error details:', errorText)
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      // Gemini responde en data.candidates[0].content.parts[0].text
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude procesar tu mensaje en este momento."

    } catch (error) {
      console.error('Error calling Gemini:', error)
      throw error
    }
  }

  const simulateAIResponse = async (systemPrompt: string, userMessage: string, bot: Bot, businessData: any) => {
    // Simulación inteligente basada en el contexto y personalidad del bot
    // Generar una respuesta basada en el prompt y la información del negocio
    const businessName = businessData?.business_name || 'nuestro negocio'
    const location = businessData?.location || 'nuestra ubicación'

    // Respuestas más inteligentes basadas en palabras clave comunes
    const lowerUserMessage = userMessage.toLowerCase()

    if (lowerUserMessage.includes('hola') || lowerUserMessage.includes('buenos') || lowerUserMessage.includes('buenas')) {
      return `¡Hola! Soy ${bot.name}, el asistente virtual de ${businessName}. ¿En qué puedo ayudarte hoy?`
    }

    if (lowerUserMessage.includes('horario') || lowerUserMessage.includes('hora') || lowerUserMessage.includes('abierto')) {
      const hours = businessData?.business_hours ? JSON.stringify(businessData.business_hours) : 'información de horarios no disponible'
      return `Te ayudo con los horarios de ${businessName}. ${hours}. ¿Hay algo más en lo que pueda asistirte?`
    }

    if (lowerUserMessage.includes('ubicación') || lowerUserMessage.includes('dirección') || lowerUserMessage.includes('donde')) {
      return `${businessName} se encuentra en ${location}. ¿Te gustaría que te proporcione más información sobre cómo llegar?`
    }

    if (lowerUserMessage.includes('producto') || lowerUserMessage.includes('servicio') || lowerUserMessage.includes('ofre')) {
      const description = businessData?.business_description || 'diversos productos y servicios'
      return `En ${businessName} ofrecemos ${description}. ¿Te interesa conocer más detalles sobre algo específico?`
    }

    if (lowerUserMessage.includes('precio') || lowerUserMessage.includes('costo') || lowerUserMessage.includes('cuánto')) {
      return `Para información sobre precios y costos, te recomiendo que contactes directamente con ${businessName}. ¿Hay algo más en lo que pueda ayudarte?`
    }

    // Respuesta general usando la personalidad del bot
    return `Como asistente de ${businessName}, estoy aquí para ayudarte. Basándome en mi personalidad: "${bot.personality_prompt}", puedo asistirte con información sobre nuestros servicios, horarios, ubicación y más. ¿Qué te gustaría saber específicamente?`
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedBot || isLoading) return

    const selectedBotData = bots.find((bot) => bot.id === selectedBot)
    if (!selectedBotData) return

    const currentMessage = inputMessage
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: currentMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      // Call the new chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: selectedBot,
          message: currentMessage,
          clientPhone: 'test-user-' + Date.now(), // Unique test phone
          clientName: 'Usuario de Prueba',
          platform: 'test'
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.response) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: data.response,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMessage])
      } else {
        throw new Error(data.error || 'Unknown error')
      }

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Disculpa, tuve un problema procesando tu mensaje. ¿Podrías intentar de nuevo?",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const resetConversation = () => {
    setMessages([])
  }

  const startConversation = async () => {
    const selectedBotData = bots.find((bot) => bot.id === selectedBot)
    if (!selectedBotData) return

    setIsLoading(true)

    try {
      // Call the new chat API for welcome message
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: selectedBot,
          message: 'hola',
          clientPhone: 'test-user-' + Date.now(),
          clientName: 'Usuario de Prueba',
          platform: 'test'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.response) {
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            type: "bot",
            content: data.response,
            timestamp: new Date(),
          }
          setMessages([welcomeMessage])
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      // Fallback to simple welcome message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        type: "bot",
        content: `¡Hola! Soy ${selectedBotData.name}, ¿en qué puedo ayudarte?`,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Bot Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Bot</CardTitle>
          <CardDescription>Elige el bot que quieres probar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedBot} onValueChange={setSelectedBot}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un bot" />
            </SelectTrigger>
            <SelectContent>
              {bots.map((bot) => (
                <SelectItem key={bot.id} value={bot.id}>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    {bot.name}
                    <Badge variant="secondary">{bot.platform}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedBot && (
            <div className="space-y-2">
              <Button onClick={startConversation} className="w-full" disabled={messages.length > 0}>
                <Play className="h-4 w-4 mr-2" />
                Iniciar Conversación
              </Button>
              <Button
                onClick={resetConversation}
                variant="outline"
                className="w-full bg-transparent"
                disabled={messages.length === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reiniciar
              </Button>
            </div>
          )}

          {selectedBot && (
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Información del Bot</h4>
              {(() => {
                const bot = bots.find((b) => b.id === selectedBot)
                return bot ? (
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Nombre:</strong> {bot.name}
                    </p>
                    <p>
                      <strong>Plataforma:</strong> {bot.platform}
                    </p>
                    <p>
                      <strong>Estado:</strong> {bot.is_active ? '🟢 Activo' : '🔴 Inactivo'}
                    </p>
                    <p>
                      <strong>Modo IA:</strong> {bot.gemini_api_key ? '🤖 Gemini Conectado' : '🎭 Simulación'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 <strong>Tip:</strong> {bot.gemini_api_key
                        ? 'Este bot usa IA real de Gemini para generar respuestas dinámicas'
                        : 'Este bot simula respuestas inteligentes para testing'}
                    </p>
                  </div>
                ) : null
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Simulador de Conversación</CardTitle>
          <CardDescription>Prueba cómo responde tu bot a diferentes mensajes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Messages */}
            <ScrollArea className="h-96 w-full border rounded-lg p-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <UserIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Selecciona un bot e inicia una conversación</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.type === "bot" ? (
                            <UserIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          ) : (
                            <UserIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-current rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-current rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Escribe tu mensaje..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                disabled={!selectedBot || isLoading}
              />
              <Button onClick={sendMessage} disabled={!inputMessage.trim() || !selectedBot || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
