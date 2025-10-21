-- Script para analizar el espacio usado por las tablas del sistema de automatización
-- Ejecuta esto para ver qué tablas están ocupando más espacio

-- 1. Tamaño de las tablas principales del sistema
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "Tamaño Total",
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as "Tamaño Tabla",
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE tablename IN (
  'automations',
  'scheduled_messages', 
  'automation_executions',
  'automation_logs',
  'instagram_integrations',
  'email_integrations',
  'external_templates',
  'message_templates',
  'whatsapp_integrations',
  'clients',
  'bots'
)
AND schemaname = 'public'
ORDER BY size_bytes DESC;

-- 2. Número de registros en cada tabla
SELECT 
  'automations' as tabla,
  COUNT(*) as registros,
  pg_size_pretty(pg_total_relation_size('public.automations')) as tamaño
FROM public.automations
UNION ALL
SELECT 
  'scheduled_messages' as tabla,
  COUNT(*) as registros,
  pg_size_pretty(pg_total_relation_size('public.scheduled_messages')) as tamaño
FROM public.scheduled_messages
UNION ALL
SELECT 
  'automation_executions' as tabla,
  COUNT(*) as registros,
  pg_size_pretty(pg_total_relation_size('public.automation_executions')) as tamaño
FROM public.automation_executions
UNION ALL
SELECT 
  'automation_logs' as tabla,
  COUNT(*) as registros,
  pg_size_pretty(pg_total_relation_size('public.automation_logs')) as tamaño
FROM public.automation_logs
UNION ALL
SELECT 
  'instagram_integrations' as tabla,
  COUNT(*) as registros,
  pg_size_pretty(pg_total_relation_size('public.instagram_integrations')) as tamaño
FROM public.instagram_integrations
UNION ALL
SELECT 
  'email_integrations' as tabla,
  COUNT(*) as registros,
  pg_size_pretty(pg_total_relation_size('public.email_integrations')) as tamaño
FROM public.email_integrations
UNION ALL
SELECT 
  'external_templates' as tabla,
  COUNT(*) as registros,
  pg_size_pretty(pg_total_relation_size('public.external_templates')) as tamaño
FROM public.external_templates
ORDER BY registros DESC;

-- 3. Índices y su tamaño
SELECT 
  schemaname,
  indexname,
  tablename,
  pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as "Tamaño Índice"
FROM pg_indexes 
WHERE tablename IN (
  'automations',
  'scheduled_messages', 
  'automation_executions',
  'automation_logs',
  'instagram_integrations',
  'email_integrations',
  'external_templates'
)
AND schemaname = 'public'
ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC;

-- 4. Espacio total usado por el sistema de automatización
SELECT 
  pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))) as "Espacio Total Sistema"
FROM pg_tables 
WHERE tablename IN (
  'automations',
  'scheduled_messages', 
  'automation_executions',
  'automation_logs',
  'instagram_integrations',
  'email_integrations',
  'external_templates'
)
AND schemaname = 'public';

-- 5. Comparar con el tamaño total de la base de datos
SELECT 
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) as "Tamaño DB Total"
FROM pg_database 
WHERE datname = current_database();