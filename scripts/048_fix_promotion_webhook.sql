-- Fix pg_net function signature issue
-- The error "function net.http_post(url => text, headers => jsonb, body => text) does not exist"
-- suggests that the pg_net extension version installed might have a different signature or
-- we are using named parameters incorrectly for the installed version.

-- Re-create the function using positional arguments instead of named arguments to be safer
CREATE OR REPLACE FUNCTION notify_promotion_events()
RETURNS trigger AS $$
DECLARE
  webhook_url TEXT;
  request_id BIGINT;
BEGIN
  -- Obtener la URL base configurada
  webhook_url := current_setting('app.webhook_domain', true);
  IF webhook_url IS NULL THEN
    webhook_url := 'https://chatbot-sass-eight.vercel.app';  -- fallback
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Nueva promoción creada
    -- Usamos net.http_post con argumentos posicionales: url, body, params, headers, timeout_milliseconds
    -- Nota: pg_net.http_post devuelve un ID de request, por lo que usamos SELECT ... INTO
    SELECT net.http_post(
      webhook_url || '/api/automations/webhook',
      json_build_object(
        'type', 'INSERT',
        'table', 'promotions', 
        'record', to_jsonb(NEW)
      )::jsonb,
      '{}'::jsonb,
      '{"Content-Type": "application/json"}'::jsonb
    ) INTO request_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
