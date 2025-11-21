-- Optimización de índices para el sistema de chat
-- Estos índices acelerarán significativamente la carga de conversaciones y mensajes

-- Índice para buscar mensajes de una conversación rápidamente (esencial para abrir un chat)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_created_at 
ON public.messages (conversation_id, created_at DESC);

-- Índice para listar conversaciones de un usuario ordenadas por fecha (esencial para la lista lateral)
CREATE INDEX IF NOT EXISTS idx_conversations_user_id_last_message 
ON public.conversations (user_id, last_message_at DESC);

-- Índice para buscar conversaciones por número de cliente (útil para webhooks entrantes)
CREATE INDEX IF NOT EXISTS idx_conversations_client_phone 
ON public.conversations (client_phone);

-- Índice para buscar integraciones activas rápidamente
CREATE INDEX IF NOT EXISTS idx_integrations_lookup 
ON public.integrations (user_id, platform, is_active);
