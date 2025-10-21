-- Script para configurar cron jobs con el dominio correcto
-- Dominio: https://chatbot-sass-eight.vercel.app/

-- Habilitar la extensión pg_cron si no está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Job para procesar cola de mensajes cada 5 minutos
SELECT cron.schedule(
  'process-message-queue',
  '*/5 * * * *',  -- Cada 5 minutos
  $$
  SELECT net.http_post(
    'https://chatbot-sass-eight.vercel.app/api/automations/process-queue',
    '{"Content-Type": "application/json"}'::jsonb,
    '{}'::text
  );
  $$
);

-- Job para verificar cumpleaños cada día a las 9:00 AM
SELECT cron.schedule(
  'check-birthdays',
  '0 9 * * *',  -- Diariamente a las 9:00 AM
  $$
  SELECT net.http_post(
    'https://chatbot-sass-eight.vercel.app/api/automations/scheduled',
    '{"Content-Type": "application/json"}'::jsonb,
    '{"type": "birthday.check"}'::text
  );
  $$
);

-- Job para verificar clientes inactivos cada domingo a las 10:00 AM
SELECT cron.schedule(
  'check-inactive-clients',
  '0 10 * * 0',  -- Domingos a las 10:00 AM
  $$
  SELECT net.http_post(
    'https://chatbot-sass-eight.vercel.app/api/automations/scheduled',
    '{"Content-Type": "application/json"}'::jsonb,
    '{"type": "inactive_client.check"}'::text
  );
  $$
);

-- Verificar jobs activos
SELECT * FROM cron.job;