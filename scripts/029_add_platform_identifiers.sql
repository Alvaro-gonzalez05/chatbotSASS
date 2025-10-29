-- Migration to support platform-specific identifiers
-- Adds support for Instagram IDs and makes client_phone optional

-- Add instagram_id field to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS client_instagram_id TEXT;

-- Make client_phone optional (since Instagram won't have phone numbers)
ALTER TABLE public.conversations 
ALTER COLUMN client_phone DROP NOT NULL;

-- Add constraint to ensure at least one identifier exists
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_identifier_check 
CHECK (client_phone IS NOT NULL OR client_instagram_id IS NOT NULL);

-- Create unique constraint for platform-specific conversations
-- This prevents duplicate conversations for the same client on the same bot
DROP INDEX IF EXISTS conversations_unique_client_bot;
CREATE UNIQUE INDEX conversations_unique_client_bot 
ON public.conversations (bot_id, client_phone, client_instagram_id, platform) 
WHERE status = 'active';

-- Add index for Instagram ID lookups
CREATE INDEX IF NOT EXISTS conversations_client_instagram_id_idx 
ON public.conversations(client_instagram_id) 
WHERE client_instagram_id IS NOT NULL;

-- Add proper unique constraint for Instagram conversations
CREATE UNIQUE INDEX IF NOT EXISTS conversations_unique_instagram_bot 
ON public.conversations (bot_id, client_instagram_id) 
WHERE client_instagram_id IS NOT NULL AND platform = 'instagram' AND status = 'active';

-- Add proper unique constraint for WhatsApp conversations  
CREATE UNIQUE INDEX IF NOT EXISTS conversations_unique_whatsapp_bot 
ON public.conversations (bot_id, client_phone) 
WHERE client_phone IS NOT NULL AND platform = 'whatsapp' AND status = 'active';

-- Update clients table to have proper indexing on instagram field
CREATE INDEX IF NOT EXISTS clients_instagram_idx ON public.clients(instagram) 
WHERE instagram IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.conversations.client_instagram_id IS 'Instagram User ID for Instagram conversations';
COMMENT ON COLUMN public.conversations.client_phone IS 'Phone number for WhatsApp conversations (optional for Instagram)';