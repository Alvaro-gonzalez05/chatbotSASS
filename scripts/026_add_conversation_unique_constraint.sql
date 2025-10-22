-- Add unique constraint for conversations to support upsert operations
-- This prevents duplicate conversations between the same bot and client

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint c
		JOIN pg_class t ON c.conrelid = t.oid
		WHERE c.conname = 'conversations_bot_client_unique'
			AND t.relname = 'conversations'
	) THEN
		ALTER TABLE public.conversations
		ADD CONSTRAINT conversations_bot_client_unique UNIQUE (bot_id, client_phone);
	END IF;
END$$;