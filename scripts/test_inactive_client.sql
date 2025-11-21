-- Actualizar un cliente para que parezca inactivo (hace 60 días)
-- Esto es necesario para probar el trigger, ya que por defecto todos tienen fecha de hoy
UPDATE public.clients
SET last_interaction_at = NOW() - INTERVAL '60 days'
WHERE id IN (
  SELECT id FROM public.clients LIMIT 1
);
