-- Script para actualizar usuario "La Birrita" a plan Premium
-- Usuario ID: 5c3c215e-2f87-4a31-96d8-24eea659ad91

-- 1. Verificar estado actual del usuario
SELECT 
  id, 
  business_name, 
  plan_type, 
  subscription_status, 
  trial_end_date,
  subscription_start_date,
  subscription_end_date
FROM user_profiles 
WHERE id = '5c3c215e-2f87-4a31-96d8-24eea659ad91';

-- 2. Actualizar a plan Premium
UPDATE user_profiles 
SET 
  plan_type = 'premium',
  subscription_status = 'active',
  subscription_start_date = NOW(),
  subscription_end_date = NOW() + INTERVAL '12 months', -- 1 año de suscripción
  trial_end_date = NULL, -- Quitar período de prueba
  updated_at = NOW()
WHERE id = '5c3c215e-2f87-4a31-96d8-24eea659ad91';

-- 3. Verificar que el cambio se aplicó correctamente
SELECT 
  id, 
  business_name, 
  plan_type, 
  subscription_status, 
  subscription_start_date,
  subscription_end_date,
  trial_end_date
FROM user_profiles 
WHERE id = '5c3c215e-2f87-4a31-96d8-24eea659ad91';

-- 4. (Opcional) Ver información del usuario de auth para confirmar
SELECT 
  up.business_name,
  up.plan_type,
  up.subscription_status,
  au.email,
  au.created_at as "cuenta_creada"
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE up.id = '5c3c215e-2f87-4a31-96d8-24eea659ad91';