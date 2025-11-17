-- ===============================================
-- CONFIGURACIÓN COMPLETA DE AUTOMATIZACIONES
-- ===============================================
-- Este script configura TODOS los disparadores de automatizaciones:
-- 1. birthday - Cumpleaños de clientes (CRON)
-- 2. inactive_client - Clientes inactivos (CRON)
-- 3. new_promotion - Nueva promoción (DISPARO MANUAL al crear automatización)
-- 4. comment_reply - Respuesta a comentarios Instagram (WEBHOOK externo)
--
-- IMPORTANTE: Reemplaza TU-DOMINIO-AQUI con tu dominio de producción
-- ===============================================

-- ===== PASO 1: Habilitar extensiones necesarias =====
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ===== PASO 2: IMPORTANTE - Configurar tu dominio aquí =====
-- 🔧 CAMBIA ESTA URL POR TU DOMINIO DE VERCEL:
-- Ejemplo: 'https://mi-chatbot-app.vercel.app'
-- NO incluyas barra diagonal al final
DO $$
DECLARE
  app_domain TEXT := 'https://TU-DOMINIO-AQUI.vercel.app';  -- 🔧 CAMBIA ESTO
BEGIN
  RAISE NOTICE '⚠️  IMPORTANTE: Asegúrate de cambiar el dominio en la línea 20';
  RAISE NOTICE '📍 Dominio configurado: %', app_domain;
  
  -- Validar que se cambió el dominio
  IF app_domain = 'https://TU-DOMINIO-AQUI.vercel.app' THEN
    RAISE WARNING '⚠️  ATENCIÓN: Aún no has configurado tu dominio real!';
    RAISE WARNING '⚠️  Los cron jobs NO funcionarán hasta que cambies el dominio en la línea 20';
  END IF;
END $$;

-- ===== PASO 3: Limpiar jobs y triggers existentes =====
-- Eliminar cron jobs anteriores
DO $$
BEGIN
  PERFORM cron.unschedule('process-message-queue');
  PERFORM cron.unschedule('check-birthdays');
  PERFORM cron.unschedule('check-inactive-clients');
  PERFORM cron.unschedule('process-promotion-broadcasts');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Algunos jobs no existían: %', SQLERRM;
END $$;

-- NOTA: Ya no usamos trigger para promociones
-- El disparo de new_promotion se hace al crear/activar la automatización

-- ===== PASO 4: CRON JOBS =====
-- IMPORTANTE: Reemplaza 'https://TU-DOMINIO-AQUI.vercel.app' con tu dominio real en cada URL

-- 4.1 - Procesar cola de mensajes cada 5 minutos
SELECT cron.schedule(
  'process-message-queue',
  '*/5 * * * *',  -- Cada 5 minutos
  $$
  SELECT net.http_post(
    url := 'https://TU-DOMINIO-AQUI.vercel.app/api/automations/process-queue',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- 4.2 - Verificar cumpleaños cada día a las 9:00 AM
SELECT cron.schedule(
  'check-birthdays',
  '0 9 * * *',  -- Diariamente a las 9:00 AM
  $$
  SELECT net.http_post(
    url := 'https://TU-DOMINIO-AQUI.vercel.app/api/automations/scheduled',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"type": "birthday.check"}'::jsonb
  );
  $$
);

-- 4.3 - Verificar clientes inactivos cada domingo a las 10:00 AM
SELECT cron.schedule(
  'check-inactive-clients',
  '0 10 * * 0',  -- Domingos a las 10:00 AM
  $$
  SELECT net.http_post(
    url := 'https://TU-DOMINIO-AQUI.vercel.app/api/automations/scheduled',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"type": "inactive_client.check"}'::jsonb
  );
  $$
);

-- ===== PASO 5: NOTAS SOBRE NEW_PROMOTION =====
-- El disparador new_promotion NO usa webhooks ni triggers de base de datos
-- Se ejecuta automáticamente cuando se crea/activa una automatización con promoción
-- Esto permite el flujo correcto:
--   1. Usuario crea una promoción
--   2. Usuario crea automatización y le asigna esa promoción
--   3. Al guardar la automatización, se dispara el broadcast automáticamente

-- ===== PASO 6: Verificación =====

-- Mostrar todos los cron jobs activos
SELECT 
  jobname,
  schedule,
  active,
  jobid
FROM cron.job
ORDER BY jobname;

-- ===== RESUMEN DE CONFIGURACIÓN =====
DO $$
BEGIN
  RAISE NOTICE '
  =====================================
  ✅ CONFIGURACIÓN COMPLETADA
  =====================================
  
  📅 CRON JOBS (ejecutados automáticamente):
  - process-message-queue: Cada 5 minutos
  - check-birthdays: Diario a las 9:00 AM UTC
  - check-inactive-clients: Domingos a las 10:00 AM UTC
  
  🎁 NEW_PROMOTION (ejecutado al crear automatización):
  - Se dispara cuando creas una automatización de promoción
  - Flujo: Crear promoción → Crear automatización → Asignar promoción → Broadcast automático
  
  📸 INSTAGRAM COMMENTS (comment_reply):
  - Se maneja via webhook externo de Instagram
  - Configurar en: Meta Developer Console
  - Webhook URL: TU-DOMINIO/api/instagram/webhook
  
  ⚠️  PASOS SIGUIENTES:
  1. Busca y reemplaza "TU-DOMINIO-AQUI.vercel.app" con tu dominio real
  2. Re-ejecuta este script completo en Supabase SQL Editor
  3. Verifica que los 3 cron jobs estén activos
  4. Configura el webhook de Instagram en Meta Developer Console
  
  ⚠️  NOTA: Los horarios están en UTC. Ajusta según tu zona horaria.
  
  =====================================
  ';
END $$;
