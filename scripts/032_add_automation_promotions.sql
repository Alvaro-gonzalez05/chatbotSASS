-- Add promotion support to automations table
-- This allows automatizations to be linked with specific promotions

-- Add promotion_id field to automations table
ALTER TABLE public.automations 
ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL;

-- Add index for promotion lookups
CREATE INDEX IF NOT EXISTS automations_promotion_id_idx 
ON public.automations(promotion_id) 
WHERE promotion_id IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.automations.promotion_id IS 'Optional promotion associated with this automation (for promotion-based automations)';

-- Update automation trigger types to include promotion-based triggers
-- Note: This assumes the trigger_type field accepts new values, check constraint if needed