-- Script para diagnosticar y solucionar el problema de net.http_post
-- Este script identifica y deshabilita temporalmente los triggers problemáticos

-- 1. Verificar si pg_net está habilitado
SELECT 
  name, 
  installed_version,
  comment 
FROM pg_available_extensions 
WHERE name = 'pg_net';

-- 2. Verificar triggers activos en la tabla reservations
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name,
  tgenabled as is_enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'reservations'::regclass;

-- 3. Verificar triggers activos en la tabla clients
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name,
  tgenabled as is_enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'clients'::regclass;

-- 4. Verificar triggers activos en la tabla orders
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name,
  tgenabled as is_enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'orders'::regclass;

-- 5. DESHABILITAR TEMPORALMENTE los triggers problemáticos
-- Esto permitirá que las reservas se guarden sin el error de net.http_post

-- Deshabilitar trigger de reservas (usar DO block para manejar errores)
DO $$ 
BEGIN
  ALTER TABLE public.reservations DISABLE TRIGGER trigger_reservation_events;
  RAISE NOTICE 'Trigger trigger_reservation_events deshabilitado en tabla reservations';
EXCEPTION 
  WHEN OTHERS THEN 
    RAISE NOTICE 'Trigger trigger_reservation_events no existe o ya está deshabilitado en reservations';
END $$;

-- Deshabilitar trigger de clientes
DO $$ 
BEGIN
  ALTER TABLE public.clients DISABLE TRIGGER trigger_new_client;
  RAISE NOTICE 'Trigger trigger_new_client deshabilitado en tabla clients';
EXCEPTION 
  WHEN OTHERS THEN 
    RAISE NOTICE 'Trigger trigger_new_client no existe o ya está deshabilitado en clients';
END $$;

-- Deshabilitar trigger de pedidos
DO $$ 
BEGIN
  ALTER TABLE public.orders DISABLE TRIGGER trigger_order_events;
  RAISE NOTICE 'Trigger trigger_order_events deshabilitado en tabla orders';
EXCEPTION 
  WHEN OTHERS THEN 
    RAISE NOTICE 'Trigger trigger_order_events no existe o ya está deshabilitado en orders';
END $$;

-- 6. Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Triggers deshabilitados temporalmente. Las reservas, clientes y pedidos ahora se pueden guardar sin errores.';
  RAISE NOTICE 'Para reactivar los webhooks, será necesario configurar correctamente la extensión pg_net.';
END $$;