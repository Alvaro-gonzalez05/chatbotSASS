-- Add image support to promotions table
-- This follows the same pattern as products table for consistency

-- Add image_url field to promotions table
ALTER TABLE public.promotions 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.promotions.image_url IS 'URL of the promotion image stored in Supabase Storage';

-- Create index for image lookups (optional, for future queries)
CREATE INDEX IF NOT EXISTS promotions_image_url_idx 
ON public.promotions(image_url) 
WHERE image_url IS NOT NULL;