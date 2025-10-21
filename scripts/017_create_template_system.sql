-- Sistema completo de plantillas para Meta WhatsApp Business API
-- Gestiona creación, aprobación y uso de plantillas automáticas

-- 1. Tabla de plantillas UNIVERSAL (WhatsApp, Instagram, Facebook)
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES public.bots(id) ON DELETE CASCADE,
  
  -- Plataforma y identificadores
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'facebook', 'email')),
  template_name TEXT NOT NULL, -- Nombre único por plataforma (ej: "birthday_discount_v1")
  template_id TEXT, -- ID asignado por Meta después de aprobación
  
  -- Identificadores específicos por plataforma
  whatsapp_business_account_id TEXT, -- Para WhatsApp
  instagram_business_account_id TEXT, -- Para Instagram  
  facebook_page_id TEXT, -- Para Facebook
  
  -- Contenido de la plantilla
  category TEXT NOT NULL CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  language_code TEXT NOT NULL DEFAULT 'es', -- es, en, pt, etc.
  
  -- Estructura del mensaje
  header_type TEXT CHECK (header_type IN ('TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT')),
  header_content TEXT, -- Texto del header o URL del media
  header_variables JSONB DEFAULT '[]'::jsonb, -- Variables en el header {{1}}, {{2}}
  
  body_content TEXT NOT NULL, -- Contenido principal con variables {{1}}, {{2}}
  body_variables JSONB DEFAULT '[]'::jsonb, -- Descripción de cada variable
  
  footer_content TEXT, -- Texto del footer (opcional)
  
  -- Botones (opcional)
  buttons JSONB DEFAULT '[]'::jsonb, -- Array de botones con tipos y textos
  
  -- Estado en Meta
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',        -- Creada localmente, no enviada a Meta
    'pending',      -- Enviada a Meta, esperando aprobación
    'approved',     -- Aprobada por Meta, lista para usar
    'rejected',     -- Rechazada por Meta
    'disabled',     -- Deshabilitada manualmente
    'paused'        -- Pausada temporalmente
  )),
  
  -- Información de Meta
  meta_submission_id TEXT, -- ID de la submission a Meta
  submitted_to_meta_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Uso y estadísticas
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  purpose TEXT, -- 'birthday', 'welcome', 'order_followup', etc.
  description TEXT, -- Descripción para el usuario
  created_by_user BOOLEAN DEFAULT true, -- false si es plantilla del sistema
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices únicos
  UNIQUE(user_id, platform, template_name), -- Nombre único por usuario y plataforma
  UNIQUE(template_id) -- ID de Meta debe ser único globalmente
);

-- 2. Variables predefinidas para plantillas
CREATE TABLE IF NOT EXISTS public.template_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información de la variable
  variable_key TEXT NOT NULL UNIQUE, -- 'client_name', 'discount_amount', 'business_name'
  variable_name TEXT NOT NULL, -- 'Nombre del Cliente', 'Monto del Descuento'
  description TEXT, -- Descripción detallada para el usuario
  data_type TEXT NOT NULL CHECK (data_type IN ('text', 'number', 'date', 'currency')),
  
  -- Fuente de datos
  source_table TEXT, -- 'clients', 'orders', 'business_info', 'static'
  source_field TEXT, -- 'name', 'total_amount', 'created_at'
  
  -- Formato y validación
  format_pattern TEXT, -- Para fechas: 'DD/MM/YYYY', para moneda: '${{value}}'
  max_length INTEGER, -- Límite de caracteres para Meta
  is_required BOOLEAN DEFAULT false,
  
  -- Categorización
  category TEXT NOT NULL, -- 'client', 'business', 'order', 'system'
  usage_context JSONB DEFAULT '[]'::jsonb, -- ['birthday', 'welcome', 'order']
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Plantillas predefinidas del sistema
CREATE TABLE IF NOT EXISTS public.system_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  template_key TEXT NOT NULL UNIQUE, -- 'birthday_basic', 'welcome_simple'
  name TEXT NOT NULL, -- 'Cumpleaños Básico', 'Bienvenida Simple'
  description TEXT,
  category TEXT NOT NULL,
  
  -- Contenido base
  header_content TEXT,
  body_content TEXT NOT NULL,
  footer_content TEXT,
  buttons JSONB DEFAULT '[]'::jsonb,
  
  -- Variables utilizadas
  variables_used JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['client_name', 'discount_amount']
  
  -- Configuración
  automation_types JSONB DEFAULT '[]'::jsonb, -- ['birthday', 'welcome']
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Historial de submissions a plataformas (Meta, etc.)
CREATE TABLE IF NOT EXISTS public.template_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.message_templates(id) ON DELETE CASCADE,
  
  -- Datos de la submission
  submission_id TEXT NOT NULL, -- ID devuelto por Meta API
  submitted_content JSONB NOT NULL, -- Contenido exacto enviado a Meta
  
  -- Resultado
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  response_from_meta JSONB, -- Respuesta completa de Meta API
  
  -- Timing
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Actualizar tabla de automatizaciones para incluir plantillas
-- Primero agregar el nuevo tipo de trigger si no existe
DO $$
BEGIN
  -- Verificar si necesitamos actualizar el constraint de trigger_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%automations%trigger_type%' 
    AND check_clause LIKE '%inactive%'
  ) THEN
    -- Eliminar constraint anterior y crear uno nuevo
    ALTER TABLE public.automations DROP CONSTRAINT IF EXISTS automations_trigger_type_check;
    ALTER TABLE public.automations ADD CONSTRAINT automations_trigger_type_check 
    CHECK (trigger_type IN ('birthday', 'inactive_client', 'new_promotion', 'welcome'));
  END IF;
END $$;

-- Agregar las nuevas columnas
ALTER TABLE public.automations 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS template_variables JSONB DEFAULT '{}'::jsonb; -- Variables específicas para esta automatización

-- 6. Actualizar scheduled_messages para plantillas
ALTER TABLE public.scheduled_messages 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS template_variables JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'template'));

-- ÍNDICES para performance
CREATE INDEX IF NOT EXISTS message_templates_user_status_idx ON public.message_templates (user_id, status);
CREATE INDEX IF NOT EXISTS message_templates_platform_idx ON public.message_templates (platform, status);
CREATE INDEX IF NOT EXISTS message_templates_purpose_idx ON public.message_templates (purpose, status);
CREATE INDEX IF NOT EXISTS message_templates_template_name_idx ON public.message_templates (template_name);

CREATE INDEX IF NOT EXISTS template_variables_category_idx ON public.template_variables (category);
CREATE INDEX IF NOT EXISTS template_variables_key_idx ON public.template_variables (variable_key);

CREATE INDEX IF NOT EXISTS system_templates_automation_types_idx ON public.system_templates USING GIN(automation_types);
CREATE INDEX IF NOT EXISTS system_templates_popular_idx ON public.system_templates (is_popular, sort_order);

-- POLÍTICAS RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_templates_select_own" ON public.message_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "message_templates_insert_own" ON public.message_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "message_templates_update_own" ON public.message_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "message_templates_delete_own" ON public.message_templates FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "template_submissions_select_own" ON public.template_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.message_templates WHERE message_templates.id = template_submissions.template_id AND message_templates.user_id = auth.uid())
);
CREATE POLICY "template_submissions_insert_own" ON public.template_submissions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.message_templates WHERE message_templates.id = template_submissions.template_id AND message_templates.user_id = auth.uid())
);

-- Hacer template_variables y system_templates públicas (solo lectura)
ALTER TABLE public.template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "template_variables_select_all" ON public.template_variables FOR SELECT USING (true);
CREATE POLICY "system_templates_select_all" ON public.system_templates FOR SELECT USING (true);

-- DATOS INICIALES: Variables esenciales del sistema
INSERT INTO public.template_variables (variable_key, variable_name, description, data_type, source_table, source_field, category, usage_context) 
SELECT 'client_name', 'Nombre del Cliente', 'Nombre completo del cliente', 'text', 'clients', 'name', 'client', '["birthday", "welcome", "inactive"]'
WHERE NOT EXISTS (SELECT 1 FROM public.template_variables WHERE variable_key = 'client_name');

INSERT INTO public.template_variables (variable_key, variable_name, description, data_type, source_table, source_field, category, usage_context) 
SELECT 'business_name', 'Nombre del Negocio', 'Nombre de la empresa o negocio', 'text', 'business_info', 'name', 'business', '["birthday", "welcome", "inactive"]'
WHERE NOT EXISTS (SELECT 1 FROM public.template_variables WHERE variable_key = 'business_name');

INSERT INTO public.template_variables (variable_key, variable_name, description, data_type, source_table, source_field, category, usage_context) 
SELECT 'discount_amount', 'Monto de Descuento', 'Porcentaje o monto del descuento', 'text', 'static', null, 'promotion', '["birthday", "inactive"]'
WHERE NOT EXISTS (SELECT 1 FROM public.template_variables WHERE variable_key = 'discount_amount');

-- DATOS INICIALES: Plantillas predefinidas del sistema (SOLO LAS ESENCIALES)
INSERT INTO public.system_templates (template_key, name, description, category, body_content, variables_used, automation_types, is_popular, sort_order) 
SELECT 'birthday_basic', 'Cumpleaños Básico', 'Saludo de cumpleaños simple con descuento', 'MARKETING', 
 '¡Feliz cumpleaños {{1}}! 🎉 En {{2}} queremos celebrar contigo. Como regalo especial, tienes un {{3}} de descuento en tu próxima compra. ¡Que tengas un día increíble!', 
 '["client_name", "business_name", "discount_amount"]', '["birthday"]', true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.system_templates WHERE template_key = 'birthday_basic');

INSERT INTO public.system_templates (template_key, name, description, category, body_content, variables_used, automation_types, is_popular, sort_order) 
SELECT 'welcome_simple', 'Bienvenida Simple', 'Mensaje de bienvenida básico para nuevos clientes', 'MARKETING',
 '¡Hola {{1}}! 👋 Bienvenido/a a {{2}}. Estamos muy contentos de tenerte con nosotros. Si tienes alguna consulta, no dudes en escribirnos.',
 '["client_name", "business_name"]', '["welcome"]', true, 2
WHERE NOT EXISTS (SELECT 1 FROM public.system_templates WHERE template_key = 'welcome_simple');

INSERT INTO public.system_templates (template_key, name, description, category, body_content, variables_used, automation_types, is_popular, sort_order) 
SELECT 'inactive_client', 'Reactivación de Clientes', 'Reactivación para clientes que no compran hace tiempo', 'MARKETING',
 'Hola {{1}}, te extrañamos en {{2}}! 😊 Han pasado algunas semanas sin verte. Como te extrañamos, tienes {{3}} de descuento en tu próximo pedido. ¡Esperamos verte pronto!',
 '["client_name", "business_name", "discount_amount"]', '["inactive"]', true, 3
WHERE NOT EXISTS (SELECT 1 FROM public.system_templates WHERE template_key = 'inactive_client');

-- Función para obtener plantillas por plataforma y tipo
CREATE OR REPLACE FUNCTION get_templates_for_platform(
  target_platform TEXT,
  target_user_id UUID,
  automation_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  template_id UUID,
  template_name TEXT,
  body_content TEXT,
  status TEXT,
  variables_used JSONB,
  is_system BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  -- Plantillas del usuario
  SELECT 
    mt.id,
    mt.template_name,
    mt.body_content,
    mt.status,
    COALESCE(mt.body_variables, '[]'::jsonb),
    false as is_system
  FROM message_templates mt
  WHERE mt.user_id = target_user_id
    AND mt.platform = target_platform
    AND (automation_type IS NULL OR mt.purpose = automation_type)
    AND mt.status = 'approved'
  
  UNION ALL
  
  -- Plantillas del sistema (convertibles)
  SELECT 
    st.id,
    st.template_key,
    st.body_content,
    'system' as status,
    st.variables_used,
    true as is_system
  FROM system_templates st
  WHERE automation_type IS NULL 
    OR st.automation_types @> json_build_array(automation_type)::jsonb
  
  ORDER BY is_system ASC, template_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asegurar que existe la función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_message_templates_updated_at 
  BEFORE UPDATE ON message_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();