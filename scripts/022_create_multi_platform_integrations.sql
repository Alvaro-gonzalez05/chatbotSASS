-- Script para crear las tablas de integración multi-plataforma
-- Actualización del sistema de automatización para soportar Instagram y Email

-- 1. Crear tabla de integraciones de Instagram
CREATE TABLE IF NOT EXISTS public.instagram_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  
  -- Configuración de Instagram Business API
  instagram_business_account_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  app_id TEXT,
  app_secret TEXT,
  
  -- Estado de la integración
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'pending')),
  
  -- Webhooks y configuración
  webhook_url TEXT,
  webhook_verify_token TEXT,
  
  -- Metadatos
  last_sync_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(bot_id)
);

-- 2. Crear tabla de integraciones de Email
CREATE TABLE IF NOT EXISTS public.email_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES public.bots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Proveedor de email
  provider TEXT NOT NULL CHECK (provider IN ('sendgrid', 'mailgun', 'ses', 'smtp', 'postmark')),
  
  -- Configuración del proveedor
  api_key TEXT,
  domain TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  
  -- Configuración SMTP (para proveedores SMTP custom)
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT,
  smtp_secure BOOLEAN DEFAULT true,
  
  -- Estado de la integración
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'pending')),
  
  -- Límites y configuración
  daily_limit INTEGER DEFAULT 1000,
  monthly_limit INTEGER DEFAULT 10000,
  current_daily_count INTEGER DEFAULT 0,
  current_monthly_count INTEGER DEFAULT 0,
  
  -- Metadatos
  last_sync_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(bot_id) -- Un bot solo puede tener una integración de email activa
);

-- 3. Actualizar tabla scheduled_messages para soportar múltiples plataformas
ALTER TABLE public.scheduled_messages 
ADD COLUMN IF NOT EXISTS recipient_email TEXT,
ADD COLUMN IF NOT EXISTS recipient_instagram_id TEXT,
ADD COLUMN IF NOT EXISTS subject TEXT, -- Para emails
ADD COLUMN IF NOT EXISTS html_content TEXT, -- Para emails con HTML
ADD COLUMN IF NOT EXISTS external_message_id TEXT, -- ID genérico del mensaje enviado
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'whatsapp' CHECK (platform IN ('whatsapp', 'instagram', 'email'));

-- 4. Actualizar tabla automation_logs
ALTER TABLE public.automation_logs 
ADD COLUMN IF NOT EXISTS external_message_id TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'whatsapp' CHECK (platform IN ('whatsapp', 'instagram', 'email'));

-- Remover la columna específica de WhatsApp y usar la genérica
-- ALTER TABLE public.automation_logs DROP COLUMN IF EXISTS whatsapp_message_id;
-- ALTER TABLE public.scheduled_messages DROP COLUMN IF EXISTS whatsapp_message_id;

-- 5. Actualizar tabla message_templates para múltiples plataformas
ALTER TABLE public.message_templates 
ADD COLUMN IF NOT EXISTS html_content TEXT, -- Para templates de email con HTML
ADD COLUMN IF NOT EXISTS subject TEXT, -- Para templates de email
ADD COLUMN IF NOT EXISTS variables_used TEXT[] DEFAULT '{}', -- Variables que usa el template
ADD COLUMN IF NOT EXISTS automation_types TEXT[] DEFAULT '{}'; -- Tipos de automatización compatibles

-- 6. Crear tabla de plantillas sincronizadas desde APIs externas
CREATE TABLE IF NOT EXISTS public.external_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES public.bots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información del template
  external_id TEXT NOT NULL, -- ID en la plataforma externa (Meta, SendGrid, etc.)
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'email')),
  provider TEXT, -- 'meta', 'sendgrid', 'mailgun', etc.
  
  -- Contenido del template
  body_text TEXT,
  html_content TEXT,
  subject TEXT,
  language TEXT DEFAULT 'es',
  category TEXT,
  
  -- Metadatos de la plataforma externa
  status TEXT, -- Estado en la plataforma externa
  quality_score JSONB, -- Para WhatsApp Business templates
  components JSONB, -- Estructura completa del template
  variables JSONB, -- Variables disponibles
  
  -- Control de sincronización
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_status TEXT DEFAULT 'active' CHECK (sync_status IN ('active', 'inactive', 'error')),
  sync_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(external_id, platform, provider)
);

-- 7. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS instagram_integrations_bot_id_idx ON public.instagram_integrations(bot_id);
CREATE INDEX IF NOT EXISTS email_integrations_bot_id_idx ON public.email_integrations(bot_id);
CREATE INDEX IF NOT EXISTS email_integrations_user_id_idx ON public.email_integrations(user_id);
CREATE INDEX IF NOT EXISTS scheduled_messages_platform_idx ON public.scheduled_messages(platform);
CREATE INDEX IF NOT EXISTS scheduled_messages_recipient_email_idx ON public.scheduled_messages(recipient_email);
CREATE INDEX IF NOT EXISTS external_templates_platform_provider_idx ON public.external_templates(platform, provider);
CREATE INDEX IF NOT EXISTS external_templates_user_id_idx ON public.external_templates(user_id);

-- 8. Habilitar RLS para las nuevas tablas
ALTER TABLE public.instagram_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_templates ENABLE ROW LEVEL SECURITY;

-- 9. Crear políticas de RLS
-- Instagram integrations
CREATE POLICY "instagram_integrations_select_own"
  ON public.instagram_integrations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bots 
    WHERE bots.id = instagram_integrations.bot_id 
    AND bots.user_id = auth.uid()
  ));

CREATE POLICY "instagram_integrations_crud_own"
  ON public.instagram_integrations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.bots 
    WHERE bots.id = instagram_integrations.bot_id 
    AND bots.user_id = auth.uid()
  ));

-- Email integrations
CREATE POLICY "email_integrations_select_own"
  ON public.email_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "email_integrations_crud_own"
  ON public.email_integrations FOR ALL
  USING (auth.uid() = user_id);

-- External templates
CREATE POLICY "external_templates_select_own"
  ON public.external_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "external_templates_crud_own"
  ON public.external_templates FOR ALL
  USING (auth.uid() = user_id);

-- 10. Actualizar función para sincronizar contadores diarios/mensuales
CREATE OR REPLACE FUNCTION update_email_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementar contadores cuando se envía un email
  IF NEW.status = 'sent' AND OLD.status != 'sent' AND NEW.platform = 'email' THEN
    UPDATE email_integrations 
    SET 
      current_daily_count = current_daily_count + 1,
      current_monthly_count = current_monthly_count + 1
    WHERE bot_id = NEW.bot_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar contadores
DROP TRIGGER IF EXISTS update_email_counters_trigger ON scheduled_messages;
CREATE TRIGGER update_email_counters_trigger
  AFTER UPDATE ON scheduled_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_email_counters();

-- 11. Función para resetear contadores diarios (ejecutar con cron)
CREATE OR REPLACE FUNCTION reset_daily_email_counters()
RETURNS void AS $$
BEGIN
  UPDATE email_integrations 
  SET current_daily_count = 0
  WHERE current_daily_count > 0;
  
  -- Log del reset
  INSERT INTO automation_logs (log_type, success, execution_time)
  VALUES ('system', true, NOW());
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE instagram_integrations IS 'Configuraciones de integración con Instagram Business API';
COMMENT ON TABLE email_integrations IS 'Configuraciones de proveedores de email (SendGrid, Mailgun, SES, etc.)';
COMMENT ON TABLE external_templates IS 'Plantillas sincronizadas desde APIs externas (Meta, SendGrid, etc.)';