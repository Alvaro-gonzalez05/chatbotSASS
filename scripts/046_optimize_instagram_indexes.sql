-- Optimización de índices para Instagram
-- Estos índices acelerarán la búsqueda de integraciones y conversaciones de Instagram

-- Índice para buscar integraciones por instagram_business_account_id (dentro del JSONB)
CREATE INDEX IF NOT EXISTS idx_integrations_instagram_id 
ON public.integrations ((config->>'instagram_business_account_id'));

-- Índice para buscar conversaciones por client_instagram_id
CREATE INDEX IF NOT EXISTS idx_conversations_instagram_id 
ON public.conversations (client_instagram_id);

-- Índice para buscar mensajes duplicados por ID de Instagram (dentro del JSONB)
CREATE INDEX IF NOT EXISTS idx_messages_instagram_id 
ON public.messages ((metadata->>'platform_message_id'));
