-- Add UPDATE policy for messages to allow marking them as read
CREATE POLICY "messages_update_own" ON public.messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid())
);
