-- Add Instagram username field to clients table
-- This will store the public @username that can be used to contact the client

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS instagram_username TEXT;

-- Create index for Instagram username lookups
CREATE INDEX IF NOT EXISTS clients_instagram_username_idx 
ON public.clients(instagram_username) 
WHERE instagram_username IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.clients.instagram_username IS 'Public Instagram username (@username) for contacting the client';
COMMENT ON COLUMN public.clients.instagram IS 'Internal Instagram ID for API identification';