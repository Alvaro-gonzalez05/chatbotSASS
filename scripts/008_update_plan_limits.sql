-- Update plan limits to match the new requirements
-- Basic plan now allows 1 automation instead of 0

-- Update existing basic plan users to have 1 automation
UPDATE public.user_profiles 
SET max_automations = 1
WHERE plan_type = 'basic';

-- Update the landing page plan information will be handled in the component
-- This script ensures database consistency
