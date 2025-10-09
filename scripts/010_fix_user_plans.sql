-- Script para verificar y corregir planes de usuario existentes
-- Este script se asegura de que los usuarios premium mantengan su plan correcto

-- Primero, ver el estado actual de los usuarios
-- SELECT id, business_name, plan_type, subscription_status FROM user_profiles;

-- Si hay usuarios que deberían tener premium pero aparecen como trial,
-- puedes actualizar manualmente:
-- UPDATE user_profiles 
-- SET 
--   plan_type = 'premium',
--   subscription_status = 'active'
-- WHERE id = 'USER_ID_AQUI';

-- O si sabes el email del usuario:
-- UPDATE user_profiles 
-- SET 
--   plan_type = 'premium',
--   subscription_status = 'active'
-- FROM auth.users 
-- WHERE user_profiles.id = auth.users.id 
-- AND auth.users.email = 'email@example.com';

-- Para verificar que el plan se guardó correctamente:
-- SELECT 
--   u.email,
--   p.business_name,
--   p.plan_type,
--   p.subscription_status,
--   p.created_at
-- FROM user_profiles p
-- JOIN auth.users u ON p.id = u.id
-- ORDER BY p.created_at DESC;