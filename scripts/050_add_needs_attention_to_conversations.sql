-- Add needs_attention column to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS needs_attention BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS conversations_needs_attention_idx ON public.conversations(needs_attention);
