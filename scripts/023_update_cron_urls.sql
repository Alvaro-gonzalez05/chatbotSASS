-- Script para actualizar las URLs de los cron jobs
-- 🔧 CAMBIA SOLO LA URL EN LA LÍNEA 14

DO $$
DECLARE
    -- ====================================================================
    -- 🔧 CAMBIA ESTA URL POR TU DOMINIO ACTUAL:
    -- ====================================================================
    base_url TEXT := 'https://chatbot-sass-eight.vercel.app';  -- <-- CAMBIA AQUÍ
    -- ====================================================================
BEGIN
    -- 1. Eliminar cron jobs existentes (por si tienen URLs incorrectas)
    PERFORM cron.unschedule('process-message-queue');
    PERFORM cron.unschedule('check-birthdays');
    PERFORM cron.unschedule('check-inactive-clients');
    
    RAISE NOTICE 'Cron jobs anteriores eliminados';
    
    -- 2. Job para procesar cola de mensajes cada 5 minutos
    PERFORM cron.schedule(
        'process-message-queue',
        '*/5 * * * *',  -- Cada 5 minutos
        format('SELECT net.http_post(%L, %L::jsonb, %L::text);',
            base_url || '/api/automations/process-queue',
            '{"Content-Type": "application/json"}',
            '{}'
        )
    );
    
    -- 3. Job para verificar cumpleaños cada día a las 9:00 AM
    PERFORM cron.schedule(
        'check-birthdays',
        '0 9 * * *',  -- Diariamente a las 9:00 AM
        format('SELECT net.http_post(%L, %L::jsonb, %L::text);',
            base_url || '/api/automations/scheduled',
            '{"Content-Type": "application/json"}',
            '{"type": "birthday.check"}'
        )
    );
    
    -- 4. Job para verificar clientes inactivos cada domingo a las 10:00 AM
    PERFORM cron.schedule(
        'check-inactive-clients',
        '0 10 * * 0',  -- Domingos a las 10:00 AM
        format('SELECT net.http_post(%L, %L::jsonb, %L::text);',
            base_url || '/api/automations/scheduled',
            '{"Content-Type": "application/json"}',
            '{"type": "inactive_client.check"}'
        )
    );
    
    RAISE NOTICE 'Cron jobs creados exitosamente con dominio: %', base_url;
END $$;

-- Verificar que los jobs se crearon correctamente
SELECT 
  jobname,
  schedule,
  command,
  active
FROM cron.job 
WHERE jobname IN ('process-message-queue', 'check-birthdays', 'check-inactive-clients')
ORDER BY jobname;

-- (OPCIONAL) Script para cambiar solo un job específico sin recrear todos:
-- 
-- DO $$
-- BEGIN
--   PERFORM cron.alter_job(
--     job_id := (SELECT jobid FROM cron.job WHERE jobname = 'process-message-queue'),
--     schedule := '*/5 * * * *',
--     command := 'SELECT net.http_post(''https://TU-NUEVO-DOMINIO.com/api/automations/process-queue'', ''{"Content-Type": "application/json"}''::jsonb, ''{}''::text);'
--   );
-- END $$;