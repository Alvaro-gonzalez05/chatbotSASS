-- Update delivery_settings table to remove dine_in fields
ALTER TABLE public.delivery_settings 
DROP COLUMN IF EXISTS dine_in_enabled,
DROP COLUMN IF EXISTS dine_in_instructions;

-- Update order_type constraint to only allow pickup and delivery
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_order_type_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_order_type_check 
CHECK (order_type IN ('pickup', 'delivery'));

-- Update existing delivery_settings to use new instructions
UPDATE public.delivery_settings 
SET 
  pickup_instructions = 'Retiro en el local',
  delivery_instructions = 'Envío a domicilio'
WHERE pickup_instructions = 'Retiro en local' OR delivery_instructions = 'Delivery a domicilio';