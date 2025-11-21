-- Optimización adicional para webhooks
-- Índices para búsqueda rápida de clientes y duplicados

-- Índice para buscar clientes por teléfono rápidamente
CREATE INDEX IF NOT EXISTS idx_clients_phone_user 
ON public.clients (user_id, phone);

-- Índice para buscar mensajes duplicados por ID de WhatsApp (dentro del JSONB)
-- Nota: Los índices en campos JSONB requieren sintaxis específica
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_id 
ON public.messages ((metadata->>'whatsapp_message_id'));

-- Índice para buscar integraciones por phone_number_id (dentro del JSONB)
CREATE INDEX IF NOT EXISTS idx_integrations_phone_number_id 
ON public.integrations ((config->>'phone_number_id'));
