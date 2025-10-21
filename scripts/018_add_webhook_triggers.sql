-- Agregar tipos de trigger adicionales para webhooks
ALTER TABLE public.automations DROP CONSTRAINT IF EXISTS automations_trigger_type_check;
ALTER TABLE public.automations ADD CONSTRAINT automations_trigger_type_check 
CHECK (trigger_type IN ('birthday', 'inactive_client', 'new_promotion', 'welcome', 'new_order', 'order_ready', 'reservation_reminder'));

-- Agregar plantillas del sistema para nuevos triggers
INSERT INTO public.system_templates (template_key, name, description, category, body_content, variables_used, automation_types, is_popular, sort_order) 
SELECT 'order_confirmation', 'Confirmación de Pedido', 'Mensaje automático cuando se crea un nuevo pedido', 'UTILITY',
 'Hola {nombre}! 📦 Confirmamos tu pedido #{numero_pedido} por {total}. Lo estamos preparando con mucho cariño. Te avisaremos cuando esté listo. ¡Gracias por elegirnos!',
 '["client_name", "order_number", "order_total"]', '["new_order"]', true, 4
WHERE NOT EXISTS (SELECT 1 FROM public.system_templates WHERE template_key = 'order_confirmation');

INSERT INTO public.system_templates (template_key, name, description, category, body_content, variables_used, automation_types, is_popular, sort_order) 
SELECT 'order_ready', 'Pedido Listo', 'Notificación cuando el pedido está listo para retirar', 'UTILITY',
 '{nombre}, tu pedido #{numero_pedido} está listo! 🎉 Puedes retirarlo cuando gustes. ¡Gracias por tu preferencia!',
 '["client_name", "order_number"]', '["order_ready"]', true, 5
WHERE NOT EXISTS (SELECT 1 FROM public.system_templates WHERE template_key = 'order_ready');

INSERT INTO public.system_templates (template_key, name, description, category, body_content, variables_used, automation_types, is_popular, sort_order) 
SELECT 'reservation_reminder', 'Recordatorio de Reserva', 'Recordatorio 24h antes de la reserva', 'UTILITY',
 'Hola {nombre}! 📅 Te recordamos tu reserva para mañana a las {hora} para {personas} personas. ¡Te esperamos!',
 '["client_name", "reservation_time", "party_size"]', '["reservation_reminder"]', true, 6
WHERE NOT EXISTS (SELECT 1 FROM public.system_templates WHERE template_key = 'reservation_reminder');