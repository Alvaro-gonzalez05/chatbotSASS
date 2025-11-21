"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Send, Phone, MoreVertical, Paperclip, Smile, Check, CheckCheck, PauseCircle, PlayCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface Conversation {
  id: string
  client_name: string
  client_phone: string
  client_instagram_id?: string
  platform: string
  last_message_at: string
  status: string
  bot_id: string
  client_id?: string
  unread_count?: number // Virtual field
  last_message?: string // Virtual field
  paused_until?: string | null
}

interface Message {
  id: string
  content: string
  sender_type: 'client' | 'bot'
  created_at: string
  message_type: string
  metadata?: any
}

interface ChatViewProps {
  userId: string
}

export function ChatView({ userId }: ChatViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false)
  const [pauseDuration, setPauseDuration] = useState("indefinite")
  const [isSending, setIsSending] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [pendingPause, setPendingPause] = useState<{ duration: string | null } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true)
      try {
        // Get conversations for user's bots
        const { data, error } = await supabase
          .from("conversations")
          .select(`
            *,
            messages:messages(content, created_at, sender_type)
          `)
          .eq("user_id", userId)
          .order("last_message_at", { ascending: false })

        if (error) throw error

        // Process conversations to get last message
        const processedConversations = data.map((conv: any) => {
          // Sort messages to get the last one
          const sortedMessages = conv.messages?.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          
          const lastMsg = sortedMessages?.[0]
          
          return {
            ...conv,
            last_message: lastMsg?.content || "Sin mensajes",
            // Mock unread count for now
            unread_count: 0 
          }
        })

        setConversations(processedConversations)
      } catch (error) {
        console.error("Error fetching conversations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()

    // Realtime subscription for new conversations
    const channel = supabase
      .channel('conversations_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations', filter: `user_id=eq.${userId}` }, 
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return

    const fetchMessages = async () => {
      setIsLoadingMessages(true)
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", selectedConversation.id)
          .order("created_at", { ascending: true })

        if (error) throw error
        setMessages(data || [])
      } catch (error) {
        console.error("Error fetching messages:", error)
      } finally {
        setIsLoadingMessages(false)
      }
    }

    fetchMessages()

    // Realtime subscription for new messages
    const channel = supabase
      .channel(`messages_${selectedConversation.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversation.id}` }, 
        (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => {
            // Check if message already exists
            if (prev.some(m => m.id === newMessage.id)) return prev
            
            // Remove optimistic message if it matches content and is recent (simple heuristic)
            // We assume the optimistic message is at the end
            const filtered = prev.filter(m => {
              if (m.id.startsWith('temp-') && m.content === newMessage.content && m.sender_type === newMessage.sender_type) {
                return false
              }
              return true
            })
            
            return [...filtered, newMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation, supabase, refreshKey])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const updateBotStatus = async (newStatus: string, pausedUntil: string | null = null) => {
    if (!selectedConversation) return
    
    const actionText = newStatus === 'paused' ? 'pausado' : 'reanudado'
    const previousConv = { ...selectedConversation }
    
    // Optimistic update (Update UI immediately)
    const optimisticConv = { 
      ...selectedConversation, 
      status: newStatus,
      paused_until: newStatus === 'paused' ? pausedUntil : null
    }
    
    setSelectedConversation(optimisticConv)
    setConversations(prev => prev.map(c => 
      c.id === selectedConversation.id ? optimisticConv : c
    ))

    try {
      const updateData: any = { status: newStatus }
      if (newStatus === 'paused') {
        updateData.paused_until = pausedUntil
      } else {
        updateData.paused_until = null
      }

      const { error } = await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', selectedConversation.id)

      if (error) throw error
      
      toast.success(`IA ${actionText}`, {
        description: `La respuesta automática ha sido ${actionText} para ${selectedConversation.client_name}.`
      })
      
    } catch (error) {
      console.error("Error updating status:", error)
      
      // Revert on error
      setSelectedConversation(previousConv)
      setConversations(prev => prev.map(c => 
        c.id === selectedConversation.id ? previousConv : c
      ))

      toast.error("Error", {
        description: "No se pudo actualizar el estado del chat."
      })
    }
  }

  // Countdown timer effect
  useEffect(() => {
    if (!selectedConversation || selectedConversation.status !== 'paused' || !selectedConversation.paused_until) {
      setTimeRemaining("")
      return
    }

    const updateTimer = () => {
      const now = new Date()
      const end = new Date(selectedConversation.paused_until!)
      const diff = end.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining("Reanudando...")
        // Optionally trigger auto-resume here if frontend is open
        if (selectedConversation.status === 'paused') {
           updateBotStatus('active')
        }
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [selectedConversation])

  const filteredConversations = conversations.filter(c => 
    c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client_phone?.includes(searchTerm)
  )

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    if (selectedConversation.status !== 'paused') {
      toast.error("La IA está activa", {
        description: "Debes pausar la respuesta automática para enviar mensajes manuales."
      })
      return
    }

    setIsSending(true)
    
    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      id: tempId,
      content: newMessage,
      sender_type: 'bot',
      created_at: new Date().toISOString(),
      message_type: 'text',
      metadata: { sent_by: 'agent', status: 'sending' }
    }
    
    setMessages(prev => [...prev, optimisticMessage])
    const messageToSend = newMessage
    setNewMessage("")

    // Determine recipient ID based on platform
    const recipientId = selectedConversation.platform === 'instagram' 
      ? selectedConversation.client_instagram_id 
      : selectedConversation.client_phone

    if (!recipientId) {
      toast.error("Error", {
        description: "No se encontró el ID del destinatario para esta conversación."
      })
      return
    }

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientId,
          message: messageToSend,
          conversationId: selectedConversation.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error sending message')
      }

      // Message will be added via realtime subscription
      // We keep the optimistic message until the real one arrives
      toast.success("Mensaje enviado")
    } catch (error) {
      console.error("Error sending message:", error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(messageToSend) // Restore message
      toast.error("Error al enviar mensaje", {
        description: error instanceof Error ? error.message : "Inténtalo de nuevo"
      })
    } finally {
      setIsSending(false)
    }
  }

  const handlePauseRequest = () => {
    if (!selectedConversation) return

    if (selectedConversation.status === 'paused') {
      // If already paused, resume immediately
      updateBotStatus('active')
    } else {
      // If active, open dialog to ask for duration
      setIsPauseDialogOpen(true)
      setPauseDuration("indefinite")
    }
  }

  // Handle pending pause after dialog closes to prevent UI locking
  useEffect(() => {
    if (!isPauseDialogOpen && pendingPause) {
      const timer = setTimeout(() => {
        updateBotStatus('paused', pendingPause.duration)
        setPendingPause(null)
        
        // Force cleanup of Radix UI locks
        document.body.style.pointerEvents = ''
        document.body.removeAttribute('data-scroll-locked')
      }, 300) // Wait for animation to finish
      
      return () => clearTimeout(timer)
    }
  }, [isPauseDialogOpen, pendingPause])

  const confirmPause = () => {
    let durationISO = null
    if (pauseDuration !== 'indefinite') {
      const now = new Date()
      const minutes = parseInt(pauseDuration)
      now.setMinutes(now.getMinutes() + minutes)
      durationISO = now.toISOString()
    }
    
    setPendingPause({ duration: durationISO })
    setIsPauseDialogOpen(false)
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return format(date, "HH:mm")
    }
    
    // If this week, show day name
    if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return format(date, "EEEE", { locale: es })
    }
    
    // Otherwise show date
    return format(date, "dd/MM/yyyy")
  }

  return (
    <div className="flex h-full gap-4 bg-background">
      {/* Sidebar - Conversation List */}
      <Card className="w-1/3 flex flex-col border-r overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar conversación..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">Cargando conversaciones...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No se encontraron conversaciones</div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={cn(
                    "flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50 border-b last:border-0",
                    selectedConversation?.id === conv.id && "bg-muted"
                  )}
                >
                  <Avatar>
                    <AvatarImage src="" />
                    <AvatarFallback className={cn(
                      "text-white",
                      conv.platform === 'whatsapp' ? "bg-green-500" : "bg-pink-500"
                    )}>
                      {conv.client_name?.substring(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">{conv.client_name}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                        {conv.last_message}
                      </p>
                      {conv.unread_count && conv.unread_count > 0 ? (
                        <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                          {conv.unread_count}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-1 flex gap-1">
                      <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">
                        {conv.platform}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Main - Chat Window */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className={cn(
                    "text-white",
                    selectedConversation.platform === 'whatsapp' ? "bg-green-500" : "bg-pink-500"
                  )}>
                    {selectedConversation.client_name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedConversation.client_name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {selectedConversation.client_phone}
                    {selectedConversation.platform === 'whatsapp' && <span className="text-green-600 ml-1">● WhatsApp</span>}
                    {selectedConversation.platform === 'instagram' && <span className="text-pink-600 ml-1">● Instagram</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedConversation.status === 'paused' && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 flex gap-1">
                    <PauseCircle className="h-3 w-3" />
                    <span>IA Pausada</span>
                    {timeRemaining && <span className="font-mono ml-1">({timeRemaining})</span>}
                  </Badge>
                )}
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setRefreshKey(prev => prev + 1)} title="Actualizar mensajes">
                  <RefreshCw className={cn("h-4 w-4", isLoadingMessages && "animate-spin")} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handlePauseRequest}>
                      {selectedConversation.status === 'paused' ? (
                        <>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Reactivar IA
                        </>
                      ) : (
                        <>
                          <PauseCircle className="mr-2 h-4 w-4" />
                          Pausar IA (Intervenir)
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50"
              ref={scrollRef}
            >
              {isLoadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p>No hay mensajes en esta conversación.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isClient = msg.sender_type === 'client'
                  return (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "flex w-full",
                        isClient ? "justify-start" : "justify-end"
                      )}
                    >
                      <div 
                        className={cn(
                          "max-w-[70%] rounded-lg p-3 shadow-sm relative group",
                          isClient 
                            ? "bg-white dark:bg-slate-800 rounded-tl-none border" 
                            : "bg-primary text-primary-foreground rounded-tr-none"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className={cn(
                          "text-[10px] mt-1 flex items-center justify-end gap-1",
                          isClient ? "text-muted-foreground" : "text-primary-foreground/70"
                        )}>
                          {format(new Date(msg.created_at), "HH:mm")}
                          {!isClient && <CheckCheck className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Input Area (Read Only for now or Mock) */}
            <div className="p-4 border-t bg-background">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input 
                  placeholder="Escribe un mensaje..." 
                  className="flex-1"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  disabled={isSending}
                />
                <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim() || selectedConversation.status !== 'paused'}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                {selectedConversation.status === 'paused' 
                  ? "IA Pausada. Puedes responder manualmente." 
                  : "El bot está gestionando esta conversación automáticamente."}
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <div className="bg-muted/50 p-6 rounded-full mb-4">
              <Send className="h-10 w-10 opacity-20" />
            </div>
            <h3 className="font-medium text-lg mb-2">Tus Mensajes</h3>
            <p className="text-center max-w-xs">
              Selecciona una conversación de la lista para ver el historial de mensajes con tus clientes.
            </p>
          </div>
        )}
      </Card>

      <Dialog open={isPauseDialogOpen} onOpenChange={setIsPauseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pausar Inteligencia Artificial</DialogTitle>
            <DialogDescription>
              Selecciona por cuánto tiempo deseas pausar la respuesta automática para intervenir manualmente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duración
              </Label>
              <Select value={pauseDuration} onValueChange={setPauseDuration}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona duración" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Minutos</SelectItem>
                  <SelectItem value="20">20 Minutos</SelectItem>
                  <SelectItem value="30">30 Minutos</SelectItem>
                  <SelectItem value="60">1 Hora</SelectItem>
                  <SelectItem value="indefinite">Indefinido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPauseDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmPause}>Pausar IA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
