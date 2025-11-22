-- 🔔 SCRIPT PARA PROBAR NOTIFICACIONES
-- 1. Reemplaza 'tu_email@ejemplo.com' con el email con el que inicias sesión en el dashboard.
-- 2. Ejecuta este script en el SQL Editor de Supabase.

INSERT INTO public.notifications (
    user_id, 
    title, 
    message, 
    type, 
    link,
    created_at
)
SELECT 
    id, 
    '🔔 Prueba de Sistema', 
    'Si estás viendo esto, las notificaciones en tiempo real están funcionando correctamente 🚀', 
    'success', 
    '/dashboard',
    NOW()
FROM auth.users
WHERE email = 'tu_email@ejemplo.com'; -- <--- CAMBIA ESTO POR TU EMAIL
