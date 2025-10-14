-- Add order_type field to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'pickup' CHECK (order_type IN ('pickup', 'delivery'));

-- Create delivery_settings table for configurable delivery modes
CREATE TABLE IF NOT EXISTS public.delivery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pickup_enabled BOOLEAN DEFAULT true,
  delivery_enabled BOOLEAN DEFAULT false,
  pickup_instructions TEXT DEFAULT 'Retiro en el local',
  delivery_instructions TEXT DEFAULT 'Envío a domicilio',
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  minimum_order_delivery DECIMAL(10,2) DEFAULT 0,
  delivery_time_estimate TEXT DEFAULT '30-45 minutos',
  pickup_time_estimate TEXT DEFAULT '15-20 minutos',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own delivery settings" ON public.delivery_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own delivery settings" ON public.delivery_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own delivery settings" ON public.delivery_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own delivery settings" ON public.delivery_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Insert default delivery settings for existing users
INSERT INTO public.delivery_settings (user_id, pickup_enabled, delivery_enabled)
SELECT DISTINCT u.id, true, false
FROM auth.users u
LEFT JOIN public.delivery_settings ds ON u.id = ds.user_id
WHERE ds.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;