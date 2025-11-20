-- Add metadata column to scheduled_messages table
ALTER TABLE public.scheduled_messages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Refresh schema cache (usually automatic, but good to be safe if running manually)
NOTIFY pgrst, 'reload config';
