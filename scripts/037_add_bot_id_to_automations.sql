-- Add missing columns to automations table
-- This allows automations to be linked to specific bots and templates

-- Add bot_id field to automations table
ALTER TABLE public.automations 
ADD COLUMN IF NOT EXISTS bot_id UUID REFERENCES public.bots(id) ON DELETE CASCADE;

-- Add template_id field to automations table (optional reference to templates table)
ALTER TABLE public.automations 
ADD COLUMN IF NOT EXISTS template_id UUID;

-- Add template_variables field to store template configuration
ALTER TABLE public.automations 
ADD COLUMN IF NOT EXISTS template_variables JSONB DEFAULT '{}'::jsonb;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS automations_bot_id_idx 
ON public.automations(bot_id) 
WHERE bot_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS automations_template_id_idx 
ON public.automations(template_id) 
WHERE template_id IS NOT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.automations.bot_id IS 'Bot associated with this automation (WhatsApp, Instagram, or Email bot)';
COMMENT ON COLUMN public.automations.template_id IS 'Optional reference to template used in this automation';
COMMENT ON COLUMN public.automations.template_variables IS 'Template configuration and variables data';

-- Update RLS policies to include bot access control
-- Drop existing policies first
DROP POLICY IF EXISTS "automations_select_own" ON public.automations;
DROP POLICY IF EXISTS "automations_insert_own" ON public.automations;
DROP POLICY IF EXISTS "automations_update_own" ON public.automations;
DROP POLICY IF EXISTS "automations_delete_own" ON public.automations;

-- Recreate policies with bot_id consideration
CREATE POLICY "automations_select_own" 
ON public.automations FOR SELECT 
USING (
  auth.uid() = user_id 
  OR (
    bot_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.bots 
      WHERE id = bot_id 
      AND user_id = auth.uid()
    )
  )
);

CREATE POLICY "automations_insert_own" 
ON public.automations FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (
    bot_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.bots 
      WHERE id = bot_id 
      AND user_id = auth.uid()
    )
  )
);

CREATE POLICY "automations_update_own" 
ON public.automations FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND (
    bot_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.bots 
      WHERE id = bot_id 
      AND user_id = auth.uid()
    )
  )
);

CREATE POLICY "automations_delete_own" 
ON public.automations FOR DELETE 
USING (
  auth.uid() = user_id 
  AND (
    bot_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.bots 
      WHERE id = bot_id 
      AND user_id = auth.uid()
    )
  )
);