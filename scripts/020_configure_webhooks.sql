-- Script para configurar webhooks con el dominio correcto
-- 🔧 CAMBIA ESTA URL POR TU DOMINIO:
-- Dominio: https://TU-DOMINIO-AQUI.vercel.app/

DO $$
DECLARE
  webhook_domain TEXT := 'https://TU-DOMINIO-AQUI.vercel.app';  -- <-- CAMBIA AQUÍ
BEGIN
  -- Configurar el dominio para usar en las funciones
  PERFORM set_config('app.webhook_domain', webhook_domain, false);
END $$;

-- Función para webhook de nuevos clientes
CREATE OR REPLACE FUNCTION notify_new_client()
RETURNS trigger AS $$
DECLARE
  webhook_url TEXT;
BEGIN
  -- Obtener la URL base configurada
  webhook_url := current_setting('app.webhook_domain', true);
  IF webhook_url IS NULL THEN
    webhook_url := 'https://chatbot-sass-eight.vercel.app';  -- fallback
  END IF;
  
  -- Enviar webhook para nuevo cliente (trigger: welcome)
  PERFORM
    net.http_post(
      url := webhook_url || '/api/automations/webhook',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'type', 'client.created',
        'data', to_jsonb(NEW)
      )::text
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevos clientes
DROP TRIGGER IF EXISTS trigger_new_client ON public.clients;
CREATE TRIGGER trigger_new_client
  AFTER INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION notify_new_client();

-- Función para webhook de eventos de pedidos
CREATE OR REPLACE FUNCTION notify_order_events()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Nuevo pedido
    PERFORM
      net.http_post(
        url := 'https://chatbot-sass-eight.vercel.app/api/automations/webhook',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := json_build_object(
          'type', 'order.created',
          'data', to_jsonb(NEW)
        )::text
      );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'ready' THEN
    -- Pedido listo
    PERFORM
      net.http_post(
        url := 'https://chatbot-sass-eight.vercel.app/api/automations/webhook',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := json_build_object(
          'type', 'order.ready',
          'data', to_jsonb(NEW)
        )::text
      );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para eventos de pedidos
DROP TRIGGER IF EXISTS trigger_order_events ON public.orders;
CREATE TRIGGER trigger_order_events
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION notify_order_events();

-- Función para webhook de eventos de reservas
CREATE OR REPLACE FUNCTION notify_reservation_events()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Nueva reserva
    PERFORM
      net.http_post(
        url := 'https://chatbot-sass-eight.vercel.app/api/automations/webhook',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := json_build_object(
          'type', 'reservation.created',
          'data', to_jsonb(NEW)
        )::text
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para eventos de reservas
DROP TRIGGER IF EXISTS trigger_reservation_events ON public.reservations;
CREATE TRIGGER trigger_reservation_events
  AFTER INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION notify_reservation_events();

-- Verificar que la extensión http esté habilitada
CREATE EXTENSION IF NOT EXISTS http;