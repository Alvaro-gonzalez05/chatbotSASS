-- Add tags column to orders and reservations tables
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
