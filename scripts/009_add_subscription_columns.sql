-- Add subscription-related columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 days'),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Update existing users to have trial status with 15 days from now
UPDATE user_profiles 
SET 
  subscription_status = 'trial',
  plan_type = 'trial',
  trial_end_date = NOW() + INTERVAL '15 days'
WHERE subscription_status IS NULL;

-- Add check constraints for valid subscription statuses and plan types
ALTER TABLE user_profiles 
ADD CONSTRAINT check_subscription_status 
CHECK (subscription_status IN ('trial', 'active', 'canceled', 'expired'));

ALTER TABLE user_profiles 
ADD CONSTRAINT check_plan_type 
CHECK (plan_type IN ('trial', 'basic', 'premium', 'enterprise'));
