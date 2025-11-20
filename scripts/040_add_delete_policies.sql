-- Add DELETE policies for orders and reservations
-- This fixes the issue where users couldn't delete their own orders and reservations

-- Policy for orders
CREATE POLICY "orders_delete_own" ON public.orders FOR DELETE USING (auth.uid() = user_id);

-- Policy for reservations
CREATE POLICY "reservations_delete_own" ON public.reservations FOR DELETE USING (auth.uid() = user_id);
