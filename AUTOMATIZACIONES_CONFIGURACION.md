# 🚀 Guía de Configuración de Automatizaciones

## 📋 Resumen de Disparadores

Tu sistema tiene **4 tipos de disparadores** de automatizaciones:

| Disparador | Tipo | Descripción | Configuración |
|------------|------|-------------|---------------|
| 🎂 **birthday** | CRON Job | Envía mensajes en cumpleaños de clientes | Ejecuta diariamente a las 9:00 AM |
| 😴 **inactive_client** | CRON Job | Reactiva clientes inactivos | Ejecuta domingos a las 10:00 AM |
| 🎁 **new_promotion** | Manual/API | Notifica al crear automatización con promoción | Se dispara al guardar la automatización |
| 💬 **comment_reply** | Webhook Externo | Responde comentarios de Instagram | Webhook de Meta/Facebook |

---

## 🔧 Configuración en Supabase

### Paso 1: Preparar el Script SQL

1. Abre el archivo: `scripts/038_configure_all_automation_triggers.sql`
2. **IMPORTANTE**: Cambia el dominio en la línea 17:
   ```sql
   app_domain TEXT := 'https://TU-DOMINIO-AQUI.vercel.app';
   ```
   Reemplaza con tu dominio real de producción (ej: `https://mi-app.vercel.app`)

### Paso 2: Ejecutar en Supabase SQL Editor

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Abre **SQL Editor** (menú lateral izquierdo)
3. Crea una nueva query
4. Copia y pega el contenido de `038_configure_all_automation_triggers.sql`
5. Haz clic en **Run** (o presiona Ctrl+Enter)

### Paso 3: Verificar la Instalación

Ejecuta esta query en SQL Editor para verificar:

```sql
-- Ver cron jobs activos
SELECT jobname, schedule, active FROM cron.job;

-- Ver webhooks/triggers activos
SELECT tgname, tgrelid::regclass FROM pg_trigger 
WHERE tgname LIKE 'trigger_%';
```

Deberías ver:
- ✅ 3 cron jobs: `process-message-queue`, `check-birthdays`, `check-inactive-clients`
- ✅ **NO** necesitas triggers de promociones (new_promotion funciona diferente)

---

## 📸 Configuración de Instagram (comment_reply)

El disparador `comment_reply` funciona diferente porque depende de webhooks de Meta/Facebook.

### Paso 1: Configurar en Meta Developer Console

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Selecciona tu app de Instagram
3. Ve a **Productos** → **Webhooks**
4. Configura el webhook:
   - **Callback URL**: `https://TU-DOMINIO.vercel.app/api/instagram/webhook`
   - **Verify Token**: El ID de tu bot de Instagram (desde la tabla `bots`)
   - **Campos**: Selecciona `comments` y `messages`

### Paso 2: Suscribirse a Eventos

En la sección de Webhooks:
1. Haz clic en **Suscribir** al objeto `instagram`
2. Selecciona los campos: `comments`, `messages`
3. Guarda los cambios

### Paso 3: Verificar

El webhook ya está implementado en: `app/api/instagram/webhook/route.ts`

La función `processInstagramComment()` maneja automáticamente:
- ✅ Detectar comentarios en tus posts
- ✅ Filtrar por palabras clave (opcional)
- ✅ Enviar respuesta automática por DM

---

## 🧪 Probar las Automatizaciones

### Test 1: Birthday (Cumpleaños)

```sql
-- Crear un cliente con cumpleaños hoy
INSERT INTO clients (user_id, name, phone, birthday)
VALUES (
  'TU_USER_ID',
  'Cliente Prueba',
  '+1234567890',
  CURRENT_DATE  -- Cumpleaños hoy
);

-- Ejecutar manualmente el job (sin esperar a las 9 AM)
SELECT net.http_post(
  'https://TU-DOMINIO.vercel.app/api/automations/scheduled',
  '{"Content-Type": "application/json"}'::jsonb,
  '{"type": "birthday.check"}'::jsonb
);
```

### Test 2: Inactive Client (Cliente Inactivo)

```sql
-- Crear cliente inactivo (sin pedidos en 60 días)
INSERT INTO clients (user_id, name, phone, last_order_at)
VALUES (
  'TU_USER_ID',
  'Cliente Inactivo',
  '+1234567891',
  CURRENT_DATE - INTERVAL '61 days'
);

-- Ejecutar manualmente
SELECT net.http_post(
  'https://TU-DOMINIO.vercel.app/api/automations/scheduled',
  '{"Content-Type": "application/json"}'::jsonb,
  '{"type": "inactive_client.check"}'::jsonb
);
```

### Test 3: New Promotion (Nueva Promoción)

**Flujo correcto:**
1. Ir a `/dashboard/promociones` y crear una promoción
2. Ir a `/dashboard/automatizaciones` y hacer clic en "Nueva Automatización"
3. Seleccionar trigger tipo: `new_promotion`
4. En el paso de promoción, seleccionar la promoción creada
5. Configurar el mensaje
6. Guardar la automatización

**Resultado:** Al guardar la automatización, se programan mensajes automáticamente para todos los clientes.

```sql
-- Verificar que los mensajes se programaron
SELECT 
  sm.id,
  sm.recipient_name,
  sm.scheduled_for,
  sm.status,
  p.name as promotion_name
FROM scheduled_messages sm
LEFT JOIN promotions p ON (sm.metadata->>'promotion_id')::uuid = p.id
WHERE sm.automation_type = 'new_promotion'
ORDER BY sm.created_at DESC
LIMIT 10;
```

### Test 4: Comment Reply (Instagram)

1. Ve a tu Instagram Business
2. Publica una foto/video
3. Comenta en tu propia publicación
4. Verifica que recibas un DM automático

---

## 📊 Monitoreo

### Ver mensajes en cola

```sql
SELECT * FROM scheduled_messages 
WHERE status = 'pending'
ORDER BY scheduled_for ASC
LIMIT 10;
```

### Ver logs de automatizaciones

```sql
SELECT 
  al.created_at,
  a.name as automation_name,
  a.trigger_type,
  al.success,
  al.message_content,
  c.name as client_name
FROM automation_logs al
JOIN automations a ON al.automation_id = a.id
LEFT JOIN clients c ON al.client_id = c.id
ORDER BY al.created_at DESC
LIMIT 20;
```

### Ver ejecuciones de cron jobs

```sql
SELECT * FROM automation_executions
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔍 Troubleshooting

### Problema: Los cron jobs no se ejecutan

**Solución:**
1. Verifica que pg_cron esté habilitado:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```
2. Verifica que los jobs estén activos:
   ```sql
   SELECT * FROM cron.job WHERE active = true;
   ```
3. Revisa los logs de Supabase en Dashboard → Logs

### Problema: El webhook de promociones no funciona

**Nota:** new_promotion YA NO USA WEBHOOKS. Se dispara al crear/activar la automatización.

**Solución:**
1. Verifica que la automatización tenga una promoción asignada
2. Verifica que la automatización esté activa (`is_active = true`)
3. Verifica que existan clientes en la base de datos
4. Revisa los logs del navegador (F12 → Console) al crear la automatización

### Problema: Instagram comments no funcionan

**Solución:**
1. Verifica que tu app de Instagram esté en modo Live (no Development)
2. Verifica que el webhook esté verificado en Meta Developer Console
3. Verifica los logs en tu API: `app/api/instagram/webhook/route.ts`
4. Asegúrate de que el token de verificación sea el ID del bot correcto

### Problema: Mensajes no se envían

**Solución:**
1. Verifica que el bot esté activo:
   ```sql
   SELECT * FROM bots WHERE is_active = true;
   ```
2. Verifica que la automatización esté activa:
   ```sql
   SELECT * FROM automations WHERE is_active = true;
   ```
3. Ejecuta manualmente el procesador de cola:
   ```sql
   SELECT net.http_post(
     'https://TU-DOMINIO.vercel.app/api/automations/process-queue',
     '{}'::jsonb,
     '{}'::jsonb
   );
   ```

---

## 📝 Notas Importantes

1. **Dominio**: Asegúrate de usar tu dominio de producción (Vercel), no localhost
2. **Horarios**: Los cron jobs usan UTC timezone. Ajusta según tu zona horaria
3. **Rate Limits**: WhatsApp/Instagram tienen límites de envío. El sistema los maneja automáticamente
4. **Costos**: pg_cron y pg_net son gratuitos en Supabase, pero tienen límites de uso
5. **new_promotion**: Este disparador funciona diferente - se ejecuta al crear la automatización, NO al crear la promoción

---

## ✅ Checklist de Implementación

- [ ] Actualizar dominio en `038_configure_all_automation_triggers.sql`
- [ ] Ejecutar script en Supabase SQL Editor
- [ ] Verificar cron jobs están activos
- [ ] Configurar webhook de Instagram en Meta Developer (solo para comment_reply)
- [ ] Crear una promoción de prueba
- [ ] Crear automatización de promoción y asignarle la promoción
- [ ] Verificar mensajes se programaron en cola
- [ ] Verificar logs de automatizaciones

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs en Supabase Dashboard
2. Verifica las variables de entorno en tu proyecto
3. Asegúrate de que las extensiones pg_cron y pg_net estén habilitadas
4. Verifica que tu dominio de Vercel esté correcto

---

**¡Todo listo!** 🎉 Las automatizaciones deberían funcionar correctamente ahora.
