-- Add subscription fields to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 days'),
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS max_bots INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_automations INTEGER DEFAULT 0;

-- Update existing users to have trial status
UPDATE public.user_profiles 
SET 
  subscription_status = 'trial',
  plan_type = 'free',
  trial_end_date = (created_at + INTERVAL '15 days')
WHERE subscription_status IS NULL;
