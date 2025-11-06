-- Simplify promotions table by removing discount-related fields
-- Remove fields: discount_type, discount_value, points_required, min_purchase_amount

-- Drop columns that are no longer needed
ALTER TABLE public.promotions 
DROP COLUMN IF EXISTS discount_type,
DROP COLUMN IF EXISTS discount_value,
DROP COLUMN IF EXISTS points_required,
DROP COLUMN IF EXISTS min_purchase_amount;

-- Add comment for clarity
COMMENT ON TABLE public.promotions IS 'Simplified promotions table for marketing campaigns - focuses on messaging rather than complex discount logic';