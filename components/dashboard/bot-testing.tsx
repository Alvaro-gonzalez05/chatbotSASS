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

  // Removed - now using webhook directly

  // Removed - now using webhook directly

  // All functions removed - now using webhook directly

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
      // Call the webhook API (same as WhatsApp) - usando conversationId único pero consistente
      const conversationId = `test-conversation-${selectedBot}`
      const response = await fetch('/api/chat/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: selectedBot,
          conversationId: conversationId,
          message: currentMessage,
          senderName: 'Usuario de Prueba',
          senderPhone: 'test-user'
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Webhook error:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('Webhook response:', data)
      
      if (data.response) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: data.response,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMessage])
      } else {
        throw new Error("No response received from webhook")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      
      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot", 
        content: `Disculpa, no pude generar una respuesta. Intenta con otra pregunta.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorBotMessage])
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
      // Call the webhook API for welcome message (same as WhatsApp)
      const conversationId = `test-conversation-${selectedBot}`
      const response = await fetch('/api/chat/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: selectedBot,
          conversationId: conversationId,
          message: 'hola',
          senderName: 'Usuario de Prueba',
          senderPhone: 'test-user'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Welcome message response:', data)
        if (data.response) {
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
