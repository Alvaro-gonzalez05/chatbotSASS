-- Script para agregar campos faltantes a user_profiles si no existen

-- Agregar max_bots si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'max_bots') THEN
        ALTER TABLE user_profiles ADD COLUMN max_bots INTEGER DEFAULT 1;
    END IF;
END $$;

-- Actualizar max_bots según el plan
UPDATE user_profiles 
SET max_bots = CASE 
    WHEN plan_type = 'trial' THEN 1
    WHEN plan_type = 'basic' THEN 3
    WHEN plan_type = 'premium' THEN 10
    WHEN plan_type = 'enterprise' THEN 50
    ELSE 1
END
WHERE max_bots IS NULL OR max_bots = 1;

-- Verificar la actualización
SELECT id, business_name, plan_type, max_bots, subscription_status 
FROM user_profiles 
WHERE id = '5c3c215e-2f87-4a31-96d8-24eea659ad91';