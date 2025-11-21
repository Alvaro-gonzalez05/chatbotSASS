-- Add last_interaction_at to clients table for tracking inactivity
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for performance
CREATE INDEX IF NOT EXISTS clients_last_interaction_at_idx ON public.clients(last_interaction_at);
