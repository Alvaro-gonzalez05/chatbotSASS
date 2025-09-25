-- Rename openai_api_key to gemini_api_key in bots table
ALTER TABLE public.bots RENAME COLUMN openai_api_key TO gemini_api_key;