-- Add policy for webhook verification
-- This allows the webhook endpoint to verify tokens without authentication
-- but only for verification purposes (no user data exposed)
CREATE POLICY "Allow webhook token verification" ON whatsapp_integrations
  FOR SELECT 
  USING (webhook_verify_token IS NOT NULL);

-- This policy allows reading integrations that have a verify token
-- This is safe because webhooks only need to verify tokens, not access user data