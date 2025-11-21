-- Enable Realtime for chat tables
-- This allows the dashboard to receive instant updates for new messages and conversation changes

-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
