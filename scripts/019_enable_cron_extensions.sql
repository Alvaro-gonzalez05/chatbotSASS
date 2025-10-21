-- Script para habilitar extensiones necesarias para cron jobs
-- Ejecutar en SQL Editor de Supabase

-- 1. Habilitar extensión HTTP para llamar APIs externas
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Habilitar pg_cron para tareas programadas (si no está habilitado)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Función para llamar al endpoint de procesamiento
CREATE OR REPLACE FUNCTION call_process_queue()
RETURNS void AS $$
BEGIN
  -- Llamar al endpoint de procesamiento de cola
  PERFORM extensions.http_post(
    url := 'https://chatbot-sass-eight.vercel.app/api/automations/process-queue',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"batch_size": 50}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función para procesar clientes inactivos
CREATE OR REPLACE FUNCTION queue_inactive_client_messages()
RETURNS void AS $$
DECLARE
  automation_rec RECORD;
  client_rec RECORD;
  scheduled_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar automatizaciones de clientes inactivos activas
  FOR automation_rec IN 
    SELECT a.*, b.user_id 
    FROM automations a
    JOIN bots b ON b.id = a.bot_id
    WHERE a.trigger_type = 'inactive_client' 
      AND a.is_active = true
  LOOP
    -- Buscar clientes que no han tenido actividad en X días
    FOR client_rec IN
      SELECT c.*
      FROM clients c
      WHERE c.user_id = automation_rec.user_id
        AND c.last_interaction_at < NOW() - INTERVAL '30 days'
        AND NOT EXISTS (
          -- No enviar si ya se envió un mensaje de reactivación recientemente
          SELECT 1 FROM scheduled_messages sm
          WHERE sm.client_id = c.id
            AND sm.automation_id = automation_rec.id
            AND sm.created_at > NOW() - INTERVAL '60 days'
        )
    LOOP
      -- Programar mensaje inmediatamente
      scheduled_date := NOW() + INTERVAL '5 minutes';
      
      INSERT INTO scheduled_messages (
        automation_id,
        client_id,
        user_id,
        recipient_phone,
        message_content,
        scheduled_for,
        status,
        priority
      ) VALUES (
        automation_rec.id,
        client_rec.id,
        automation_rec.user_id,
        client_rec.phone,
        replace(
          replace(automation_rec.message_template, '{{client_name}}', client_rec.name),
          '{{business_name}}', COALESCE((SELECT name FROM business_info WHERE user_id = automation_rec.user_id LIMIT 1), 'nuestro negocio')
        ),
        scheduled_date,
        'pending',
        3 -- Prioridad media
      );
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;