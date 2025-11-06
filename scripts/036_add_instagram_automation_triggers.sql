-- Add new Instagram automation triggers and update existing table structure
-- File: 036_add_instagram_automation_triggers.sql

-- Update the automation trigger types to include new Instagram-specific ones
-- Note: PostgreSQL doesn't support ALTER TYPE directly, so we'll add a check constraint instead

-- Add check constraint for new trigger types if it doesn't exist
DO $$
BEGIN
    -- Drop existing check constraint if it exists
    ALTER TABLE automations DROP CONSTRAINT IF EXISTS automations_trigger_type_check;
    
    -- Add new check constraint with all trigger types
    ALTER TABLE automations ADD CONSTRAINT automations_trigger_type_check 
    CHECK (trigger_type IN (
        'birthday', 
        'inactive_client', 
        'new_promotion', 
        'welcome', 
        'referral', 
        'button_click',
        'new_order',
        'order_ready',
        'reservation_reminder'
    ));
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint may already exist or other issue: %', SQLERRM;
END $$;

-- Insert system templates for Instagram automation triggers
INSERT INTO system_templates (template_key, name, description, body_content, variables_used, automation_types, created_at)
VALUES 
-- Template for Instagram welcome automation
('instagram_welcome_basic', 
 'Bienvenida Instagram - Básica',
 'Mensaje de bienvenida simple para nuevos suscriptores de Instagram',
 '¡Hola {{client_name}}! 👋 

Bienvenido a {{business_name}}. Estoy aquí para ayudarte con lo que necesites.

¿En qué puedo ayudarte hoy? 😊',
 ARRAY['client_name', 'business_name'],
 ARRAY['welcome'],
 NOW()),

('instagram_welcome_menu', 
 'Bienvenida Instagram - Con Menú',
 'Mensaje de bienvenida con opciones de menú para Instagram',
 '¡Hola {{client_name}}! 👋 

Te doy la bienvenida a {{business_name}}. 

Puedes escribirme o elegir una de estas opciones:
🛍️ Ver productos
📞 Contactar soporte  
📍 Ubicación
💬 Hablar con un humano

¿Qué te interesa?',
 ARRAY['client_name', 'business_name'],
 ARRAY['welcome'],
 NOW()),

-- Template for Instagram referral automation
('instagram_referral_campaign', 
 'Referencia Instagram - Campaña',
 'Mensaje personalizado para usuarios que llegan desde campañas específicas',
 '¡Hola {{client_name}}! 🎯

¡Excelente! Llegaste desde nuestra campaña {{referral_campaign}}.

{{campaign_message}}

¿Te gustaría conocer más detalles de esta oferta especial?',
 ARRAY['client_name', 'referral_campaign', 'campaign_message'],
 ARRAY['referral'],
 NOW()),

-- Template for Instagram button interactions
('instagram_button_response', 
 'Respuesta a Botón Instagram',
 'Respuesta automática cuando se clickea un botón específico',
 'Perfecto {{client_name}}! 👍

Has seleccionado: {{button_action}}

{{response_content}}

¿Hay algo más en lo que pueda ayudarte?',
 ARRAY['client_name', 'button_action', 'response_content'],
 ARRAY['button_click'],
 NOW()),

-- Template for Instagram product inquiry
('instagram_product_inquiry', 
 'Consulta de Producto Instagram',
 'Respuesta cuando alguien pregunta por productos en Instagram',
 '¡Genial elección {{client_name}}! 🛍️

Te muestro nuestros productos más populares:

{{product_list}}

¿Te interesa alguno en particular? ¡Escríbeme el nombre y te doy todos los detalles!',
 ARRAY['client_name', 'product_list'],
 ARRAY['button_click'],
 NOW())

ON CONFLICT (template_key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    body_content = EXCLUDED.body_content,
    variables_used = EXCLUDED.variables_used,
    automation_types = EXCLUDED.automation_types,
    updated_at = NOW();

-- Create a function to handle Instagram webhook events (if it doesn't exist)
CREATE OR REPLACE FUNCTION handle_instagram_automation_trigger(
    p_trigger_type text,
    p_bot_id uuid,
    p_client_instagram_id text,
    p_referral_ref text DEFAULT NULL,
    p_button_payload text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_automation_record record;
    v_conversation_id uuid;
    v_bot_record record;
    v_user_id uuid;
BEGIN
    -- Get bot information
    SELECT * INTO v_bot_record 
    FROM bots 
    WHERE id = p_bot_id AND platform = 'instagram';
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Instagram bot not found: %', p_bot_id;
        RETURN false;
    END IF;
    
    v_user_id := v_bot_record.user_id;
    
    -- Find matching automation
    SELECT * INTO v_automation_record
    FROM automations 
    WHERE bot_id = p_bot_id 
        AND trigger_type = p_trigger_type 
        AND is_active = true
        AND (
            -- For referral automations, check if referral_key matches
            (p_trigger_type = 'referral' AND trigger_config->>'referral_key' = p_referral_ref)
            OR
            -- For button automations, check if button_payload matches  
            (p_trigger_type = 'button_click' AND trigger_config->>'button_payload' = p_button_payload)
            OR
            -- For other automations, no additional checks needed
            (p_trigger_type NOT IN ('referral', 'button_click'))
        )
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'No active automation found for trigger: % on bot: %', p_trigger_type, p_bot_id;
        RETURN false;
    END IF;
    
    -- Find or create conversation
    SELECT id INTO v_conversation_id 
    FROM conversations 
    WHERE bot_id = p_bot_id 
        AND client_instagram_id = p_client_instagram_id
        AND platform = 'instagram'
        AND status = 'active'
    LIMIT 1;
    
    IF NOT FOUND THEN
        -- Create new conversation
        INSERT INTO conversations (
            bot_id, 
            user_id, 
            client_instagram_id, 
            client_name, 
            platform, 
            status, 
            last_message_at
        )
        VALUES (
            p_bot_id,
            v_user_id,
            p_client_instagram_id,
            '@instagram_' || p_client_instagram_id,
            'instagram',
            'active',
            NOW()
        )
        RETURNING id INTO v_conversation_id;
    END IF;
    
    -- Log the automation trigger
    INSERT INTO automation_executions (
        automation_id,
        conversation_id,
        trigger_data,
        status,
        executed_at
    )
    VALUES (
        v_automation_record.id,
        v_conversation_id,
        jsonb_build_object(
            'client_instagram_id', p_client_instagram_id,
            'referral_ref', p_referral_ref,
            'button_payload', p_button_payload
        ),
        'executed',
        NOW()
    );
    
    RETURN true;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in handle_instagram_automation_trigger: %', SQLERRM;
        RETURN false;
END;
$$;

-- Create automation_executions table if it doesn't exist
CREATE TABLE IF NOT EXISTS automation_executions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_id uuid REFERENCES automations(id) ON DELETE CASCADE,
    conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
    trigger_data jsonb DEFAULT '{}',
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed')),
    executed_at timestamp with time zone DEFAULT NOW(),
    error_message text,
    created_at timestamp with time zone DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_automation_executions_automation_id ON automation_executions(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_conversation_id ON automation_executions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_executed_at ON automation_executions(executed_at);

-- Enable RLS for automation_executions
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for automation_executions
CREATE POLICY "Users can view own automation executions" ON automation_executions
    FOR SELECT USING (
        automation_id IN (
            SELECT a.id FROM automations a 
            INNER JOIN bots b ON a.bot_id = b.id 
            WHERE b.user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON automation_executions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE automation_executions IS 'Log of automation triggers and executions';
COMMENT ON FUNCTION handle_instagram_automation_trigger IS 'Handles Instagram automation triggers from webhook events';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Instagram automation triggers and templates added successfully!';
    RAISE NOTICE 'New trigger types: welcome, referral, button_click';
    RAISE NOTICE 'Added % system templates for Instagram automations', 4;
END $$;