-- Add webhook trigger for promotions table to notify when new promotions are created
-- This enables the "new_promotion" automation trigger

-- Función para webhook de eventos de promociones
CREATE OR REPLACE FUNCTION notify_promotion_events()
RETURNS trigger AS $$
DECLARE
  webhook_url TEXT;
BEGIN
  -- Obtener la URL base configurada
  webhook_url := current_setting('app.webhook_domain', true);
  IF webhook_url IS NULL THEN
    webhook_url := 'https://chatbot-sass-eight.vercel.app';  -- fallback
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Nueva promoción creada
    PERFORM
      net.http_post(
        url := webhook_url || '/api/automations/webhook',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := json_build_object(
          'type', 'INSERT',
          'table', 'promotions', 
          'record', to_jsonb(NEW)
        )::text
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para eventos de promociones
DROP TRIGGER IF EXISTS trigger_promotion_events ON public.promotions;
CREATE TRIGGER trigger_promotion_events
  AFTER INSERT ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION notify_promotion_events();

-- Add comment for clarity
COMMENT ON FUNCTION notify_promotion_events() IS 'Webhook trigger for new promotion events - enables new_promotion automation type';