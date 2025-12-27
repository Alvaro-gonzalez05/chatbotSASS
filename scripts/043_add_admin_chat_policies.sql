-- Add policies for Conversations
CREATE POLICY "admin_select_all_conversations"
  ON public.conversations FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_insert_all_conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "admin_update_all_conversations"
  ON public.conversations FOR UPDATE
  USING (is_admin());

CREATE POLICY "admin_delete_all_conversations"
  ON public.conversations FOR DELETE
  USING (is_admin());

-- Add policies for Messages
CREATE POLICY "admin_select_all_messages"
  ON public.messages FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_insert_all_messages"
  ON public.messages FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "admin_update_all_messages"
  ON public.messages FOR UPDATE
  USING (is_admin());

CREATE POLICY "admin_delete_all_messages"
  ON public.messages FOR DELETE
  USING (is_admin());
