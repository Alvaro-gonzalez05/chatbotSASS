-- 1. Agregar rol de administrador y campos para el nuevo modelo SaaS
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user', -- 'admin' o 'user'
ADD COLUMN IF NOT EXISTS gemini_api_key text, -- Para el modelo BYOK (Bring Your Own Key)
ADD COLUMN IF NOT EXISTS stripe_customer_id text, -- Para pagos
ADD COLUMN IF NOT EXISTS stripe_subscription_id text, -- ID de la suscripción activa
ADD COLUMN IF NOT EXISTS pm_last_4 text, -- Últimos 4 dígitos de la tarjeta (para mostrar en UI)
ADD COLUMN IF NOT EXISTS pm_brand text, -- Marca de la tarjeta (Visa, Mastercard, etc.)
ADD COLUMN IF NOT EXISTS usage_balance numeric DEFAULT 0.00, -- Saldo para mensajes masivos
ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone; -- Fin de la prueba gratuita

-- 1.1 Actualizar restricciones de plan para incluir 'pro'
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS check_plan_type;
ALTER TABLE public.user_profiles 
ADD CONSTRAINT check_plan_type 
CHECK (plan_type IN ('trial', 'free', 'pro', 'basic', 'premium', 'enterprise'));

-- 2. Actualizar la política de seguridad para que los admins puedan ver todo
-- (Esto es simplificado, idealmente se usarían claims de Supabase Auth, pero por ahora usamos la tabla)
CREATE POLICY "admin_view_all_profiles"
  ON public.user_profiles FOR SELECT
  USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- 3. Crear tabla para registro de uso de mensajes (Billing)
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id),
    type text NOT NULL, -- 'whatsapp_message', 'ai_token', etc.
    amount numeric NOT NULL, -- Costo o cantidad
    description text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_usage"
  ON public.usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "admin_view_all_usage"
  ON public.usage_logs FOR SELECT
  USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- 4. MIGRACIÓN DE DATOS (IMPORTANTE)
-- Convertimos a los usuarios antiguos al nuevo esquema para que no queden en el limbo.

-- 4.1 Usuarios que ya pagaban (Premium/Basic/Enterprise) -> Pasan a PRO
-- Se les da el beneficio de la duda y se les migra a PRO para que tengan acceso ilimitado.
UPDATE public.user_profiles 
SET plan_type = 'pro' 
WHERE plan_type IN ('basic', 'premium', 'enterprise');

-- 4.2 Usuarios Trial antiguos -> Se mantienen en Trial (o Free)
-- Nos aseguramos de que tengan una fecha de fin de prueba si no la tienen
UPDATE public.user_profiles 
SET trial_ends_at = COALESCE(trial_end_date, created_at + INTERVAL '7 days')
WHERE plan_type IN ('trial', 'free') AND trial_ends_at IS NULL;
