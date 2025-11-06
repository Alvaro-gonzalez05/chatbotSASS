-- Add cron job for promotion broadcast processing
-- This ensures promotion automations work correctly

-- Job para verificar difusión de promociones cada 4 horas
SELECT cron.schedule(
  'check-promotion-broadcasts',
  '0 */4 * * *',  -- Cada 4 horas
  $$
  SELECT net.http_post(
    'https://chatbot-sass-eight.vercel.app/api/automations/scheduled',
    '{"Content-Type": "application/json"}'::jsonb,
    '{"type": "promotion.broadcast"}'::text
  );
  $$
);

-- Verificar que el job se creó correctamente
SELECT jobid, schedule, command, active 
FROM cron.job 
WHERE jobname = 'check-promotion-broadcasts';