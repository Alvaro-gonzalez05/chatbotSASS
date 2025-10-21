-- Script para optimizar y consolidar tablas del sistema de automatización
-- Reduce el número de tablas combinando funcionalidades similares

-- 1. CONSOLIDAR: instagram_integrations + email_integrations → integrations (genérica)
-- En lugar de tener 3 tablas separadas (whatsapp_integrations, instagram_integrations, email_integrations)
-- Tendremos solo 2: whatsapp_integrations + integrations (para Instagram y Email)

-- 2. CREAR tabla consolidada de integrations (reemplaza instagram_integrations + email_integrations)
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'gmail')),
  
  -- Configuración específica por plataforma (JSONB para flexibilidad)
  config JSONB NOT NULL DEFAULT '{}',
  
  -- Campos comunes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Índices únicos por plataforma
  CONSTRAINT unique_user_platform UNIQUE (user_id, platform)
);

-- 2. CONSOLIDAR: external_templates + message_templates → templates (unificada)
-- Una sola tabla para TODAS las plantillas (locales y externas)

CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES public.bots(id) ON DELETE CASCADE,
  
  -- Información básica
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'gmail')),
  category TEXT DEFAULT 'general',
  
  -- Contenido
  body_text TEXT NOT NULL,
  html_content TEXT, -- Para emails
  subject TEXT, -- Para emails
  
  -- Origen de la plantilla
  source TEXT DEFAULT 'local' CHECK (source IN ('local', 'meta_api', 'sendgrid_api', 'external')),
  external_id TEXT, -- ID en la plataforma externa (si aplica)
  
  -- Variables y configuración
  variables JSONB DEFAULT '[]', -- ["name", "date", "amount"]
  automation_types JSONB DEFAULT '[]', -- ["birthday", "welcome", "reminder"]
  
  -- Metadatos externos (para plantillas de APIs)
  external_data JSONB, -- Datos específicos de la plataforma externa
  
  -- Estado
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  is_system BOOLEAN DEFAULT false, -- Plantillas del sistema vs usuario
  
  -- Sincronización (para plantillas externas)
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(external_id, platform, source) -- Evitar duplicados de plantillas externas
);

-- 3. OPTIMIZAR: scheduled_messages (agregar campos faltantes sin crear tablas nuevas)
ALTER TABLE public.scheduled_messages 
ADD COLUMN IF NOT EXISTS recipient_email TEXT,
ADD COLUMN IF NOT EXISTS recipient_instagram_id TEXT,
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS html_content TEXT,
ADD COLUMN IF NOT EXISTS external_message_id TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'whatsapp' CHECK (platform IN ('whatsapp', 'instagram', 'gmail'));

-- 4. OPTIMIZAR: automation_logs (agregar campos sin crear tabla nueva)
ALTER TABLE public.automation_logs 
ADD COLUMN IF NOT EXISTS external_message_id TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'whatsapp' CHECK (platform IN ('whatsapp', 'instagram', 'gmail'));

-- 5. MIGRAR datos existentes (si existen las tablas anteriores)

-- Migrar instagram_integrations → integrations
INSERT INTO public.integrations (user_id, platform, config, is_active, created_at, updated_at)
SELECT 
  (SELECT user_id FROM bots WHERE bots.id = instagram_integrations.bot_id),
  'instagram',
  jsonb_build_object(
    'bot_id', bot_id,
    'business_account_id', instagram_business_account_id,
    'page_id', page_id,
    'access_token', access_token,
    'app_id', app_id,
    'webhook_url', webhook_url,
    'status', status
  ),
  is_active,
  created_at,
  updated_at
FROM public.instagram_integrations
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instagram_integrations')
ON CONFLICT (user_id, platform) DO NOTHING;

-- Migrar email_integrations a integrations con platform = 'gmail'
-- Usar las columnas REALES de la tabla email_integrations
INSERT INTO public.integrations (user_id, platform, config, is_active, created_at, updated_at)
SELECT 
  user_id,
  'gmail' as platform,
  jsonb_build_object(
    'bot_id', bot_id,
    'provider', provider,
    'api_key', api_key,
    'domain', domain,
    'from_email', from_email,
    'from_name', from_name,
    'smtp_host', smtp_host,
    'smtp_port', smtp_port,
    'smtp_username', smtp_username,
    'smtp_password', smtp_password,
    'smtp_secure', smtp_secure,
    'daily_limit', daily_limit,
    'monthly_limit', monthly_limit,
    'current_daily_count', current_daily_count,
    'current_monthly_count', current_monthly_count,
    'status', status,
    'error_message', error_message,
    'last_sync_at', last_sync_at
  ) as config,
  is_active,
  created_at,
  updated_at
FROM public.email_integrations
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_integrations')
ON CONFLICT (user_id, platform) DO NOTHING;

-- Migrar message_templates → templates
INSERT INTO public.templates (user_id, bot_id, name, platform, category, body_text, html_content, subject, source, variables, automation_types, status, external_id, external_data, last_synced_at, created_at, updated_at)
SELECT 
  user_id,
  bot_id,
  template_name,
  CASE 
    WHEN platform = 'email' THEN 'gmail'
    ELSE platform
  END,
  COALESCE(category, 'UTILITY'),
  body_content,
  html_content,
  subject,
  'local',
  COALESCE(to_jsonb(variables_used), '[]'::jsonb),
  COALESCE(to_jsonb(automation_types), '[]'::jsonb),
  status,
  template_id, -- Este es el external_id de Meta
  CASE 
    WHEN template_id IS NOT NULL THEN jsonb_build_object(
      'whatsapp_business_account_id', whatsapp_business_account_id,
      'instagram_business_account_id', instagram_business_account_id,
      'facebook_page_id', facebook_page_id,
      'language_code', language_code,
      'header_type', header_type,
      'header_content', header_content,
      'header_variables', header_variables,
      'body_variables', body_variables,
      'footer_content', footer_content,
      'buttons', buttons,
      'meta_submission_id', meta_submission_id
    )
    ELSE NULL
  END,
  approved_at,
  created_at,
  updated_at
FROM public.message_templates
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_templates')
ON CONFLICT DO NOTHING;

-- Migrar external_templates → templates
INSERT INTO public.templates (user_id, bot_id, name, platform, body_text, html_content, subject, source, external_id, variables, external_data, status, last_synced_at, created_at, updated_at)
SELECT 
  user_id,
  bot_id,
  name,
  platform,
  body_text,
  html_content,
  subject,
  COALESCE(provider || '_api', 'external'),
  external_id,
  COALESCE(variables, '[]'),
  components,
  CASE WHEN sync_status = 'active' THEN 'active' ELSE 'inactive' END,
  last_synced_at,
  created_at,
  updated_at
FROM public.external_templates
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'external_templates')
ON CONFLICT DO NOTHING;

-- 6. CREAR índices optimizados
CREATE INDEX IF NOT EXISTS integrations_user_platform_idx ON public.integrations(user_id, platform);
CREATE INDEX IF NOT EXISTS integrations_platform_active_idx ON public.integrations(platform, is_active);
CREATE INDEX IF NOT EXISTS templates_user_platform_idx ON public.templates(user_id, platform);
CREATE INDEX IF NOT EXISTS templates_source_platform_idx ON public.templates(source, platform);
CREATE INDEX IF NOT EXISTS scheduled_messages_platform_status_idx ON public.scheduled_messages(platform, status);

-- 7. HABILITAR RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- 8. CREAR políticas RLS optimizadas
CREATE POLICY "integrations_user_access" ON public.integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "templates_user_access" ON public.templates FOR ALL USING (auth.uid() = user_id);

-- 9. FUNCIONES para mantener contadores actualizados
CREATE OR REPLACE FUNCTION update_integration_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sent' AND OLD.status != 'sent' AND NEW.platform = 'gmail' THEN
    -- Actualizar contador de la integración del usuario para Gmail
    UPDATE integrations 
    SET updated_at = NOW()
    WHERE user_id = NEW.user_id AND platform = NEW.platform;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_integration_counters_trigger
  AFTER UPDATE ON scheduled_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_counters();

-- 10. RESUMEN de optimización
SELECT 'OPTIMIZACIÓN COMPLETADA' as status;

SELECT 'TABLAS CONSOLIDADAS:' as info;
SELECT '- instagram_integrations + email_integrations → integrations' as consolidation;
SELECT '- message_templates + external_templates → templates' as consolidation;

SELECT 'TABLAS ELIMINABLES (después de verificar migración):' as info;
SELECT '- instagram_integrations' as eliminable;
SELECT '- email_integrations' as eliminable;
SELECT '- message_templates' as eliminable;  
SELECT '- external_templates' as eliminable;

-- Mostrar el conteo final de tablas
SELECT 
  COUNT(*) as total_tables,
  'tablas en el esquema public' as description
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';