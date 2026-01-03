-- Add allowed_tags column to bots table
ALTER TABLE public.bots 
ADD COLUMN IF NOT EXISTS allowed_tags TEXT[] DEFAULT '{}';
