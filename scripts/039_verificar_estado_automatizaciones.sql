-- ===============================================
-- VERIFICACIÓN DEL ESTADO DE AUTOMATIZACIONES
-- ===============================================
-- Este script muestra el estado actual de todas las configuraciones
-- de automatizaciones en tu base de datos Supabase
-- ===============================================

-- ===== 1. EXTENSIONES =====
SELECT '=== EXTENSIONES REQUERIDAS ===' as info;

SELECT 
  extname as extension_name,
  extversion as version,
  CASE 
    WHEN extname IN ('pg_cron', 'pg_net') THEN '✅ Instalada'
    ELSE '⚠️ Revisar'
  END as status
FROM pg_extension
WHERE extname IN ('pg_cron', 'pg_net', 'pg_trgm', 'uuid-ossp')
ORDER BY extname;

-- ===== 2. CRON JOBS =====
SELECT '=== CRON JOBS CONFIGURADOS ===' as info;

SELECT 
  jobid,
  jobname,
  schedule,
  CASE WHEN active THEN '✅ Activo' ELSE '❌ Inactivo' END as status,
  command
FROM cron.job
ORDER BY jobname;

-- ===== 3. TRIGGERS/WEBHOOKS =====
SELECT '=== TRIGGERS DE WEBHOOKS ===' as info;

SELECT 
  t.tgname as trigger_name,
  t.tgrelid::regclass as table_name,
  CASE 
    WHEN t.tgenabled = 'O' THEN '✅ Activo'
    WHEN t.tgenabled = 'D' THEN '❌ Deshabilitado'
    ELSE '⚠️ Otro estado'
  END as status,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname LIKE 'trigger_%'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ===== 4. AUTOMATIZACIONES CREADAS =====
SELECT '=== AUTOMATIZACIONES DEL SISTEMA ===' as info;

SELECT 
  a.id,
  a.name,
  a.trigger_type,
  CASE WHEN a.is_active THEN '✅ Activa' ELSE '❌ Inactiva' END as status,
  b.name as bot_name,
  b.platform,
  a.created_at
FROM automations a
LEFT JOIN bots b ON a.bot_id = b.id
ORDER BY a.created_at DESC;

-- ===== 5. BOTS DISPONIBLES =====
SELECT '=== BOTS CONFIGURADOS ===' as info;

SELECT 
  id,
  name,
  platform,
  CASE WHEN is_active THEN '✅ Activo' ELSE '❌ Inactivo' END as status,
  created_at
FROM bots
ORDER BY platform, name;

-- ===== 6. MENSAJES EN COLA =====
SELECT '=== MENSAJES EN COLA ===' as info;

SELECT 
  status,
  COUNT(*) as cantidad,
  MIN(scheduled_for) as primer_mensaje,
  MAX(scheduled_for) as ultimo_mensaje
FROM scheduled_messages
GROUP BY status
ORDER BY status;

-- ===== 7. ESTADÍSTICAS DE EJECUCIÓN =====
SELECT '=== ÚLTIMAS EJECUCIONES DE AUTOMATIZACIONES ===' as info;

SELECT 
  ae.automation_type,
  ae.execution_date,
  ae.status,
  ae.total_eligible_clients,
  ae.clients_processed,
  ae.messages_queued,
  ae.completed_at
FROM automation_executions ae
ORDER BY ae.execution_date DESC, ae.created_at DESC
LIMIT 10;

-- ===== 8. LOGS RECIENTES =====
SELECT '=== LOGS RECIENTES (últimas 24 horas) ===' as info;

SELECT 
  al.created_at,
  a.name as automation_name,
  a.trigger_type,
  CASE WHEN al.success THEN '✅' ELSE '❌' END as status,
  al.log_type,
  c.name as client_name
FROM automation_logs al
JOIN automations a ON al.automation_id = a.id
LEFT JOIN clients c ON al.client_id = c.id
WHERE al.created_at > NOW() - INTERVAL '24 hours'
ORDER BY al.created_at DESC
LIMIT 20;

-- ===== 9. CONFIGURACIÓN DE DOMINIO =====
SELECT '=== CONFIGURACIÓN DE DOMINIO ===' as info;

SELECT 
  COALESCE(
    current_setting('app.webhook_domain', true),
    '⚠️ NO CONFIGURADO - Ejecutar 038_configure_all_automation_triggers.sql'
  ) as webhook_domain;

-- ===== 10. RESUMEN GENERAL =====
SELECT '=== RESUMEN GENERAL ===' as info;

SELECT 
  (SELECT COUNT(*) FROM automations WHERE is_active = true) as automatizaciones_activas,
  (SELECT COUNT(*) FROM bots WHERE is_active = true) as bots_activos,
  (SELECT COUNT(*) FROM scheduled_messages WHERE status = 'pending') as mensajes_pendientes,
  (SELECT COUNT(*) FROM automation_logs WHERE created_at > NOW() - INTERVAL '24 hours') as logs_24h,
  (SELECT COUNT(*) FROM cron.job WHERE active = true) as cron_jobs_activos;

-- ===== RECOMENDACIONES =====
DO $$
DECLARE
  has_pg_cron BOOLEAN;
  has_pg_net BOOLEAN;
  has_cron_jobs BOOLEAN;
  has_webhooks BOOLEAN;
  domain_set BOOLEAN;
BEGIN
  -- Verificar extensiones
  SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') INTO has_pg_cron;
  SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_net') INTO has_pg_net;
  
  -- Verificar cron jobs
  SELECT EXISTS(SELECT 1 FROM cron.job WHERE active = true) INTO has_cron_jobs;
  
  -- Verificar webhooks/triggers
  SELECT EXISTS(
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_promotion_events' 
    AND tgenabled = 'O'
  ) INTO has_webhooks;
  
  -- Verificar dominio
  BEGIN
    domain_set := current_setting('app.webhook_domain', true) IS NOT NULL;
  EXCEPTION
    WHEN OTHERS THEN domain_set := false;
  END;
  
  RAISE NOTICE '
  ================================================
  📊 ESTADO DE AUTOMATIZACIONES
  ================================================
  
  Extensiones:
  - pg_cron: %
  - pg_net: %
  
  Configuración:
  - Dominio configurado: %
  - Cron Jobs activos: %
  - Webhooks configurados: %
  
  ================================================
  📝 ACCIONES RECOMENDADAS:
  ================================================
  ',
  CASE WHEN has_pg_cron THEN '✅' ELSE '❌ INSTALAR' END,
  CASE WHEN has_pg_net THEN '✅' ELSE '❌ INSTALAR' END,
  CASE WHEN domain_set THEN '✅' ELSE '❌ CONFIGURAR' END,
  CASE WHEN has_cron_jobs THEN '✅' ELSE '❌ CONFIGURAR' END,
  CASE WHEN has_webhooks THEN '✅' ELSE '❌ CONFIGURAR' END;
  
  IF NOT has_pg_cron OR NOT has_pg_net THEN
    RAISE NOTICE '1. Instalar extensiones faltantes:
       CREATE EXTENSION IF NOT EXISTS pg_cron;
       CREATE EXTENSION IF NOT EXISTS pg_net;';
  END IF;
  
  IF NOT domain_set OR NOT has_cron_jobs OR NOT has_webhooks THEN
    RAISE NOTICE '2. Ejecutar script de configuración:
       - Archivo: scripts/038_configure_all_automation_triggers.sql
       - Actualizar dominio en línea 17
       - Ejecutar en Supabase SQL Editor';
  END IF;
  
  RAISE NOTICE '3. Verificar bots estén configurados y activos';
  RAISE NOTICE '4. Crear automatizaciones de prueba';
  RAISE NOTICE '5. Configurar webhook de Instagram en Meta Developer Console';
  
  RAISE NOTICE '
  ================================================
  ✅ Para más información, consulta:
  AUTOMATIZACIONES_CONFIGURACION.md
  ================================================
  ';
END $$;
