-- Function to check if the current user is an admin
-- SECURITY DEFINER allows it to run with the privileges of the creator (usually postgres/superuser)
-- bypassing RLS on user_profiles to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Update user_profiles policy to use the function
DROP POLICY IF EXISTS "admin_view_all_profiles" ON public.user_profiles;
CREATE POLICY "admin_view_all_profiles"
  ON public.user_profiles FOR SELECT
  USING (is_admin());

-- Add policies for Bots
CREATE POLICY "admin_select_all_bots"
  ON public.bots FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_insert_all_bots"
  ON public.bots FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "admin_update_all_bots"
  ON public.bots FOR UPDATE
  USING (is_admin());

CREATE POLICY "admin_delete_all_bots"
  ON public.bots FOR DELETE
  USING (is_admin());

-- Add policies for Automations
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'automations') THEN
        EXECUTE 'CREATE POLICY "admin_select_all_automations" ON public.automations FOR SELECT USING (is_admin())';
        EXECUTE 'CREATE POLICY "admin_update_all_automations" ON public.automations FOR UPDATE USING (is_admin())';
        EXECUTE 'CREATE POLICY "admin_delete_all_automations" ON public.automations FOR DELETE USING (is_admin())';
    END IF;
END
$$;

-- Add policies for Usage Logs
DROP POLICY IF EXISTS "admin_view_all_usage" ON public.usage_logs;
CREATE POLICY "admin_view_all_usage"
  ON public.usage_logs FOR SELECT
  USING (is_admin());
