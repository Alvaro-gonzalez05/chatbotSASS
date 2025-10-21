-- Script de prueba para el sistema de automatización
-- Ejecuta este script para verificar que el sistema está funcionando correctamente

-- 1. Verificar que las tablas necesarias existen
SELECT 
  'automations' as table_name,
  COUNT(*) as total_records
FROM automations
UNION ALL
SELECT 
  'scheduled_messages' as table_name,
  COUNT(*) as total_records
FROM scheduled_messages
UNION ALL
SELECT 
  'automation_executions' as table_name,
  COUNT(*) as total_records
FROM automation_executions
UNION ALL
SELECT 
  'automation_logs' as table_name,
  COUNT(*) as total_records
FROM automation_logs;

-- 2. Verificar cron jobs activos
SELECT 
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname IN ('process-message-queue', 'check-birthdays', 'check-inactive-clients');

-- 3. Mostrar automatizaciones activas por usuario
SELECT 
  u.email,
  a.name as automation_name,
  a.trigger_type,
  a.is_active,
  b.name as bot_name,
  b.platform
FROM automations a
JOIN auth.users u ON a.user_id = u.id
LEFT JOIN bots b ON b.user_id = a.user_id AND b.is_active = true
WHERE a.is_active = true
ORDER BY u.email, a.created_at;

-- 4. Mostrar mensajes pendientes en cola
SELECT 
  sm.recipient_name,
  sm.recipient_phone,
  sm.message_content,
  sm.scheduled_for,
  sm.status,
  sm.automation_type,
  a.name as automation_name
FROM scheduled_messages sm
LEFT JOIN automations a ON sm.automation_id = a.id
WHERE sm.status = 'pending'
  AND sm.scheduled_for <= NOW() + INTERVAL '1 day'
ORDER BY sm.scheduled_for;

-- 5. Estadísticas de ejecuciones recientes (últimos 7 días)
SELECT 
  execution_date,
  automation_type,
  COUNT(*) as executions,
  SUM(clients_processed) as total_clients_processed,
  SUM(messages_queued) as total_messages_queued
FROM automation_executions
WHERE execution_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY execution_date, automation_type
ORDER BY execution_date DESC;

-- 6. Verificar clientes con cumpleaños próximos (próximos 7 días)
SELECT 
  c.name,
  c.phone,
  c.birthday,
  EXTRACT(MONTH FROM c.birthday) as birth_month,
  EXTRACT(DAY FROM c.birthday) as birth_day,
  u.email as user_email
FROM clients c
JOIN auth.users u ON c.user_id = u.id
WHERE c.birthday IS NOT NULL
  AND (
    (EXTRACT(MONTH FROM c.birthday) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(DAY FROM c.birthday) >= EXTRACT(DAY FROM CURRENT_DATE))
    OR
    (EXTRACT(MONTH FROM c.birthday) = EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '7 days') AND EXTRACT(DAY FROM c.birthday) <= EXTRACT(DAY FROM CURRENT_DATE + INTERVAL '7 days'))
  )
ORDER BY 
  EXTRACT(MONTH FROM c.birthday),
  EXTRACT(DAY FROM c.birthday);

-- 7. Verificar configuración de WhatsApp activa
SELECT 
  b.name as bot_name,
  b.platform,
  w.phone_number_id,
  w.is_active as whatsapp_active,
  u.email as user_email
FROM bots b
JOIN whatsapp_integrations w ON b.id = w.bot_id
JOIN auth.users u ON b.user_id = u.id
WHERE b.is_active = true AND w.is_active = true;

-- 8. Logs de automatización de los últimos 3 días
SELECT 
  DATE(al.execution_time) as log_date,
  al.log_type,
  COUNT(*) as count,
  al.automation_type
FROM automation_logs al
WHERE al.execution_time >= CURRENT_DATE - INTERVAL '3 days'
GROUP BY DATE(al.execution_time), al.log_type, al.automation_type
ORDER BY log_date DESC, al.log_type;