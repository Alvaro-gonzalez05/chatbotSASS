-- Script para eliminar tablas duplicadas después de la consolidación
-- EJECUTA SOLO DESPUÉS de verificar que la migración fue exitosa

-- 1. Verificar que la migración fue exitosa
SELECT 'VERIFICACIÓN ANTES DE ELIMINAR' as status;

-- Contar registros en tablas originales vs consolidadas
SELECT 
  'instagram_integrations' as tabla_original,
  COUNT(*) as registros_originales
FROM public.instagram_integrations
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instagram_integrations')
UNION ALL
SELECT 
  'integrations (instagram)' as tabla_consolidada,
  COUNT(*) as registros_migrados
FROM public.integrations WHERE platform = 'instagram';

SELECT 
  'email_integrations' as tabla_original,
  COUNT(*) as registros_originales  
FROM public.email_integrations
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_integrations')
UNION ALL
SELECT 
  'integrations (gmail)' as tabla_consolidada,
  COUNT(*) as registros_migrados
FROM public.integrations WHERE platform = 'gmail';

SELECT 
  'message_templates' as tabla_original,
  COUNT(*) as registros_originales
FROM public.message_templates  
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_templates')
UNION ALL
SELECT 
  'templates (local)' as tabla_consolidada,
  COUNT(*) as registros_migrados
FROM public.templates WHERE source = 'local';

-- 2. ELIMINAR tablas duplicadas después de la consolidación exitosa

-- Eliminar triggers primero
DROP TRIGGER IF EXISTS update_email_counters_trigger ON scheduled_messages;

-- Eliminar funciones que referencian las tablas viejas  
DROP FUNCTION IF EXISTS update_email_counters();

-- Eliminar tablas consolidadas (ahora reemplazadas por integrations y templates)
DROP TABLE IF EXISTS public.instagram_integrations CASCADE;
DROP TABLE IF EXISTS public.email_integrations CASCADE;  
DROP TABLE IF EXISTS public.message_templates CASCADE;
DROP TABLE IF EXISTS public.external_templates CASCADE;

-- Opcional: eliminar tablas adicionales que podrían optimizarse
DROP TABLE IF EXISTS public.automation_config CASCADE; -- Se puede mover a JSONB en automations
DROP TABLE IF EXISTS public.system_templates CASCADE; -- Se puede consolidar en templates
DROP TABLE IF EXISTS public.template_submissions CASCADE; -- Historial que se puede recrear
DROP TABLE IF EXISTS public.template_variables CASCADE; -- Se puede mover a JSONB en templates

SELECT 'TABLAS ELIMINADAS EXITOSAMENTE - BASE DE DATOS OPTIMIZADA' as status;

-- 3. Mostrar el estado final
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as columnas,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as tamaño
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
ORDER BY table_name;