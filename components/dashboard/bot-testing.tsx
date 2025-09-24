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
  openai_api_key?: string
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

      const { data, error } = await supabase.from("bots").select("*").eq("user_id", user.id).eq("is_active", true)

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
      if (!user) return null

      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name, business_description, business_hours, location')
        .eq('id', user.id)
        .single()

      return profile
    } catch (error) {
      console.error('Error fetching business data:', error)
      return null
    }
  }

  const generateAIResponse = async (userMessage: string, bot: Bot) => {
    try {
      const businessData = await fetchBusinessData()
      // Construir el contexto para la IA
      const systemPrompt = `Eres ${bot.name}, un asistente virtual para ${businessData?.business_name || 'un negocio'}.
PERSONALIDAD: ${bot.personality_prompt}
INFORMACIÓN DEL NEGOCIO:
- Nombre: ${businessData?.business_name || 'No especificado'}
- Descripción: ${businessData?.business_description || 'No especificado'}
- Ubicación: ${businessData?.location || 'No especificado'}
- Horarios: ${businessData?.business_hours ? JSON.stringify(businessData.business_hours) : 'No especificado'}
INSTRUCCIONES:
- Responde como el asistente virtual del negocio
- Usa la personalidad especificada en tus respuestas
- Proporciona información útil sobre el negocio cuando sea relevante
- Mantén un tono profesional pero amigable
- Si no tienes información específica, ofrece ayuda general
- Responde en español
Mensaje del cliente: "${userMessage}"`

      // Verificar si el bot tiene una API key de OpenAI configurada
      const selectedBotData = bots.find(b => b.id === bot.id)
      if (selectedBotData && selectedBotData.openai_api_key) {
        // Usar OpenAI API para generar respuesta real
        const response = await callOpenAI(systemPrompt, userMessage, selectedBotData.openai_api_key)
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

  const callOpenAI = async (systemPrompt: string, userMessage: string, apiKey: string) => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || "Lo siento, no pude procesar tu mensaje en este momento."
    } catch (error) {
      console.error('Error calling OpenAI:', error)
      throw error
    }
  }

  const simulateAIResponse = async (systemPrompt: string, userMessage: string, bot: Bot, businessData: any) => {
    // Simulación: el bot responde siempre usando el prompt generado, sin mensajes predefinidos
    // En producción, esto sería reemplazado por una llamada real a OpenAI
    return `PROMPT DEL BOT:\n${systemPrompt}`
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedBot) return

    const selectedBotData = bots.find((bot) => bot.id === selectedBot)
    if (!selectedBotData) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    // Simulate bot response delay
    setTimeout(
      async () => {
        const botResponse = await generateAIResponse(inputMessage, selectedBotData)
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: botResponse,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMessage])
        setIsLoading(false)
      },
      1000 + Math.random() * 2000,
    )
  }

  const resetConversation = () => {
    setMessages([])
  }

  const startConversation = async () => {
    const selectedBotData = bots.find((bot) => bot.id === selectedBot)
    if (!selectedBotData) return

    // Usar la función de IA para generar el mensaje de bienvenida
    const welcomeContent = await generateAIResponse("hola", selectedBotData)
    
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: "bot",
      content: welcomeContent,
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
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
                      <strong>Modo IA:</strong> {bot.openai_api_key ? '🤖 OpenAI Conectado' : '🎭 Simulación'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 <strong>Tip:</strong> {bot.openai_api_key 
                        ? 'Este bot usa IA real de OpenAI para generar respuestas dinámicas' 
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
