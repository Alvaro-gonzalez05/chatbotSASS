-- Sistema de automatización avanzado sin límites
-- Procesa TODOS los mensajes pero de forma distribuida

-- 1. Cola de mensajes programados (SIN LÍMITES)
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES public.bots(id) ON DELETE CASCADE,
  
  -- Contenido del mensaje
  message_content TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  
  -- Timing y prioridad
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  priority INTEGER DEFAULT 5, -- 1=urgent, 5=normal, 10=low
  
  -- Estado del envío
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  
  -- Metadata de envío
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Tracking
  automation_type TEXT, -- 'birthday', 'welcome', 'follow_up', etc.
  batch_id UUID, -- Para agrupar mensajes del mismo evento
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Control de ejecuciones diarias (evita duplicados)
CREATE TABLE IF NOT EXISTS public.automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  execution_date DATE NOT NULL,
  automation_type TEXT NOT NULL, -- 'birthday', 'inactive_client', etc.
  
  -- Estadísticas del procesamiento
  clients_processed INTEGER DEFAULT 0,
  messages_queued INTEGER DEFAULT 0,
  total_eligible_clients INTEGER DEFAULT 0,
  
  -- Estado del procesamiento
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Batch control para procesamiento gradual
  batch_id UUID DEFAULT gen_random_uuid(),
  current_batch INTEGER DEFAULT 0,
  total_batches INTEGER DEFAULT 1,
  
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar duplicados por día
  UNIQUE(automation_id, execution_date)
);

-- 3. Logs detallados de automatizaciones
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES public.automation_executions(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  scheduled_message_id UUID REFERENCES public.scheduled_messages(id) ON DELETE SET NULL,
  
  -- Detalles del evento
  log_type TEXT NOT NULL CHECK (log_type IN ('queued', 'sent', 'failed', 'skipped')),
  message_content TEXT,
  recipient_phone TEXT,
  
  -- Timing
  execution_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_time_ms INTEGER, -- Tiempo de procesamiento en ms
  
  -- Resultados
  success BOOLEAN,
  error_details TEXT,
  whatsapp_message_id TEXT, -- ID del mensaje en WhatsApp para tracking
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Configuración del procesador de colas
CREATE TABLE IF NOT EXISTS public.automation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Configuración de procesamiento
  messages_per_minute INTEGER DEFAULT 30, -- Rate limiting para WhatsApp
  max_concurrent_sends INTEGER DEFAULT 5,
  retry_delay_minutes INTEGER DEFAULT 15,
  
  -- Horarios de envío (para respetar zonas horarias)
  send_start_hour INTEGER DEFAULT 8,  -- 8 AM
  send_end_hour INTEGER DEFAULT 22,   -- 10 PM
  timezone TEXT DEFAULT 'America/Argentina/Mendoza',
  
  -- Configuración por tipo de mensaje
  birthday_send_time TIME DEFAULT '09:00:00',
  welcome_delay_minutes INTEGER DEFAULT 5,
  followup_delay_hours INTEGER DEFAULT 24,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- ÍNDICES CRÍTICOS para rendimiento
CREATE INDEX IF NOT EXISTS scheduled_messages_pending_idx ON public.scheduled_messages (status, scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS scheduled_messages_user_status_idx ON public.scheduled_messages (user_id, status);
CREATE INDEX IF NOT EXISTS scheduled_messages_batch_idx ON public.scheduled_messages (batch_id);
CREATE INDEX IF NOT EXISTS scheduled_messages_automation_type_idx ON public.scheduled_messages (automation_type, status);

CREATE INDEX IF NOT EXISTS automation_executions_date_idx ON public.automation_executions (execution_date, status);
CREATE INDEX IF NOT EXISTS automation_executions_type_date_idx ON public.automation_executions (automation_type, execution_date);

CREATE INDEX IF NOT EXISTS automation_logs_execution_idx ON public.automation_logs (execution_id);
CREATE INDEX IF NOT EXISTS automation_logs_client_idx ON public.automation_logs (client_id);
-- Función IMMUTABLE para extraer fecha
CREATE OR REPLACE FUNCTION immutable_date_trunc(timestamp_val TIMESTAMP WITH TIME ZONE)
RETURNS DATE AS $$
BEGIN
  RETURN DATE(timestamp_val);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE INDEX IF NOT EXISTS automation_logs_date_idx ON public.automation_logs (immutable_date_trunc(execution_time));

-- Índice especial para búsqueda de cumpleaños (usando función IMMUTABLE)
CREATE OR REPLACE FUNCTION immutable_extract_doy(date_val DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(DOY FROM date_val);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE INDEX IF NOT EXISTS clients_birthday_day_month_idx ON public.clients (immutable_extract_doy(birthday)) WHERE birthday IS NOT NULL;

-- POLÍTICAS RLS
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_config ENABLE ROW LEVEL SECURITY;

-- Políticas para scheduled_messages
CREATE POLICY "scheduled_messages_select_own" ON public.scheduled_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "scheduled_messages_insert_own" ON public.scheduled_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "scheduled_messages_update_own" ON public.scheduled_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "scheduled_messages_delete_own" ON public.scheduled_messages FOR DELETE USING (auth.uid() = user_id);

-- Políticas para automation_executions
CREATE POLICY "automation_executions_select_own" ON public.automation_executions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.automations WHERE automations.id = automation_executions.automation_id AND automations.user_id = auth.uid())
);
CREATE POLICY "automation_executions_insert_own" ON public.automation_executions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.automations WHERE automations.id = automation_executions.automation_id AND automations.user_id = auth.uid())
);
CREATE POLICY "automation_executions_update_own" ON public.automation_executions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.automations WHERE automations.id = automation_executions.automation_id AND automations.user_id = auth.uid())
);

-- Políticas para automation_logs
CREATE POLICY "automation_logs_select_own" ON public.automation_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.automations WHERE automations.id = automation_logs.automation_id AND automations.user_id = auth.uid())
);
CREATE POLICY "automation_logs_insert_own" ON public.automation_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.automations WHERE automations.id = automation_logs.automation_id AND automations.user_id = auth.uid())
);

-- Políticas para automation_config
CREATE POLICY "automation_config_select_own" ON public.automation_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "automation_config_insert_own" ON public.automation_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "automation_config_update_own" ON public.automation_config FOR UPDATE USING (auth.uid() = user_id);

-- FUNCIONES OPTIMIZADAS para procesamiento distribuido

-- Función 1: Detectar y encolar TODOS los cumpleaños del día (POR USUARIO)
CREATE OR REPLACE FUNCTION queue_birthday_messages(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_queued INTEGER,
  batch_id UUID,
  execution_id UUID,
  user_processed UUID
) AS $$
DECLARE
  current_batch_id UUID := gen_random_uuid();
  current_execution_id UUID;
  messages_queued INTEGER := 0;
  processing_user_id UUID;
  automation_record RECORD;
BEGIN
  -- Determinar qué usuario procesar
  processing_user_id := COALESCE(target_user_id, auth.uid());
  
  -- Si no hay usuario específico y no hay auth, procesar todos los usuarios uno por uno
  IF processing_user_id IS NULL THEN
    -- Procesar cada usuario activo por separado
    FOR automation_record IN (
      SELECT DISTINCT a.user_id, a.id as automation_id
      FROM automations a
      WHERE a.trigger_type = 'birthday' 
        AND a.is_active = true
        AND NOT EXISTS (
          SELECT 1 FROM automation_executions ae
          WHERE ae.automation_id = a.id 
            AND ae.execution_date = CURRENT_DATE
            AND ae.status IN ('completed', 'processing')
        )
      ORDER BY a.user_id
    ) LOOP
      -- Llamada recursiva para cada usuario
      PERFORM queue_birthday_messages(automation_record.user_id);
    END LOOP;
    
    RETURN QUERY SELECT 0::INTEGER, NULL::UUID, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Crear registro de ejecución SOLO para el usuario específico
  INSERT INTO automation_executions (
    automation_id, 
    execution_date, 
    automation_type, 
    status,
    batch_id,
    started_at
  )
  SELECT 
    a.id,
    CURRENT_DATE,
    'birthday',
    'processing',
    current_batch_id,
    NOW()
  FROM automations a
  WHERE a.user_id = processing_user_id  -- FILTRO POR USUARIO
    AND a.trigger_type = 'birthday' 
    AND a.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM automation_executions ae
      WHERE ae.automation_id = a.id 
        AND ae.execution_date = CURRENT_DATE
        AND ae.status IN ('completed', 'processing')
    )
  LIMIT 1  -- Solo una automatización de cumpleaños por usuario por día
  RETURNING id INTO current_execution_id;
  
  -- Si no hay ejecución nueva, salir
  IF current_execution_id IS NULL THEN
    RETURN QUERY SELECT 0::INTEGER, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Encolar TODOS los mensajes de cumpleaños del USUARIO ESPECÍFICO (SIN LÍMITE)
  WITH birthday_messages AS (
    INSERT INTO scheduled_messages (
      user_id, automation_id, client_id, bot_id,
      message_content, recipient_phone, recipient_name,
      scheduled_for, automation_type, batch_id, priority
    )
    SELECT 
      a.user_id,
      a.id,
      c.id,
      b.id,
      REPLACE(REPLACE(a.message_template, '{nombre}', c.name), '{descuento}', '20%') as message_content,
      c.phone,
      c.name,
      NOW() + INTERVAL '5 minutes', -- Pequeño delay para procesar gradualmente
      'birthday',
      current_batch_id,
      3 -- Prioridad alta para cumpleaños
    FROM automations a
    JOIN clients c ON c.user_id = a.user_id AND c.user_id = processing_user_id  -- DOBLE FILTRO POR USUARIO
    JOIN bots b ON b.user_id = a.user_id AND b.user_id = processing_user_id AND b.platform = 'whatsapp' AND b.is_active = true  -- FILTRO POR USUARIO EN BOTS
    WHERE a.id = current_execution_id
      AND a.user_id = processing_user_id  -- TRIPLE FILTRO POR SEGURIDAD
      AND a.trigger_type = 'birthday'
      AND a.is_active = true
      AND immutable_extract_doy(c.birthday) = immutable_extract_doy(CURRENT_DATE)
      AND c.birthday IS NOT NULL
      AND c.phone IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM automation_logs al
        WHERE al.automation_id = a.id
          AND al.client_id = c.id
          AND immutable_date_trunc(al.execution_time) = CURRENT_DATE
          AND al.success = true
      )
    RETURNING 1
  )
  SELECT COUNT(*) INTO messages_queued FROM birthday_messages;
  
  -- Actualizar estadísticas de ejecución
  UPDATE automation_executions 
  SET 
    messages_queued = messages_queued,
    clients_processed = messages_queued,
    status = CASE WHEN messages_queued > 0 THEN 'completed' ELSE 'completed' END,
    completed_at = NOW()
  WHERE id = current_execution_id;
  
  -- Log del resultado
  INSERT INTO automation_logs (
    automation_id, execution_id, log_type, message_content, success, processing_time_ms
  ) VALUES (
    (SELECT automation_id FROM automation_executions WHERE id = current_execution_id),
    current_execution_id,
    'queued',
    'Encolados ' || messages_queued || ' mensajes de cumpleaños',
    true,
    EXTRACT(EPOCH FROM (NOW() - (SELECT started_at FROM automation_executions WHERE id = current_execution_id))) * 1000
  );
  
  RETURN QUERY SELECT messages_queued, current_batch_id, current_execution_id, processing_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función 2: Procesar cola de mensajes gradualmente (MULTI-USUARIO SEGURO)
CREATE OR REPLACE FUNCTION process_message_queue(batch_size INTEGER DEFAULT 50, target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  processed INTEGER,
  remaining INTEGER,
  user_processed UUID
) AS $$
DECLARE
  messages_processed INTEGER := 0;
  messages_remaining INTEGER := 0;
  processing_user_id UUID;
BEGIN
  -- Determinar qué usuario procesar (si no se especifica, procesar todos)
  processing_user_id := target_user_id;
  
  -- Marcar mensajes como "processing" para evitar duplicados
  WITH selected_messages AS (
    UPDATE scheduled_messages 
    SET 
      status = 'processing',
      updated_at = NOW()
    WHERE id IN (
      SELECT sm.id FROM scheduled_messages sm
      WHERE sm.status = 'pending'
        AND sm.scheduled_for <= NOW()
        AND (processing_user_id IS NULL OR sm.user_id = processing_user_id)  -- FILTRO POR USUARIO
      ORDER BY sm.priority ASC, sm.scheduled_for ASC
      LIMIT batch_size
    )
    RETURNING id, user_id, automation_id, client_id, message_content, recipient_phone, automation_type
  )
  INSERT INTO automation_logs (
    automation_id, client_id, scheduled_message_id, log_type, 
    message_content, recipient_phone, success
  )
  SELECT 
    automation_id, client_id, id, 'sent',
    message_content, recipient_phone, true
  FROM selected_messages;
  
  GET DIAGNOSTICS messages_processed = ROW_COUNT;
  
  -- Marcar como enviados (aquí tu API real los procesará)
  UPDATE scheduled_messages 
  SET 
    status = 'sent',
    sent_at = NOW(),
    updated_at = NOW()
  WHERE status = 'processing';
  
  -- Contar mensajes restantes (filtrado por usuario si se especificó)
  SELECT COUNT(*) INTO messages_remaining 
  FROM scheduled_messages 
  WHERE status = 'pending' 
    AND scheduled_for <= NOW()
    AND (processing_user_id IS NULL OR user_id = processing_user_id);
  
  RETURN QUERY SELECT messages_processed, messages_remaining, processing_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scheduled_messages_updated_at 
  BEFORE UPDATE ON scheduled_messages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_config_updated_at 
  BEFORE UPDATE ON automation_config 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para inicializar configuración por usuario
CREATE OR REPLACE FUNCTION ensure_user_automation_config(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
  config_id UUID;
BEGIN
  -- Crear configuración si no existe
  INSERT INTO automation_config (user_id)
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO config_id;
  
  -- Si ya existía, obtener el ID
  IF config_id IS NULL THEN
    SELECT id INTO config_id FROM automation_config WHERE user_id = target_user_id;
  END IF;
  
  RETURN config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear configuración automáticamente al crear un bot
CREATE OR REPLACE FUNCTION init_user_automation_setup()
RETURNS TRIGGER AS $$
BEGIN
  -- Asegurar que el usuario tenga configuración de automatización
  PERFORM ensure_user_automation_config(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a la tabla de bots (cuando se crea el primer bot)
CREATE TRIGGER ensure_automation_config_on_bot_creation
  AFTER INSERT ON bots
  FOR EACH ROW
  EXECUTE FUNCTION init_user_automation_setup();