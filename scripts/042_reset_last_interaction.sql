-- Poner en NULL la fecha de última interacción de todos los clientes
UPDATE public.clients SET last_interaction_at = NULL;

-- Quitar el valor por defecto para que los nuevos clientes nazcan sin fecha de interacción
ALTER TABLE public.clients ALTER COLUMN last_interaction_at DROP DEFAULT;
