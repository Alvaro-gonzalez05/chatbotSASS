-- Add is_read column to messages table to track unread status
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Update existing messages to be read (optional, but good for initial state)
UPDATE public.messages SET is_read = true;

-- Create index for faster queries on unread messages
CREATE INDEX IF NOT EXISTS messages_is_read_idx ON public.messages(conversation_id, is_read);
