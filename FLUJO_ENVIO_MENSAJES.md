# 📤 Flujo Completo de Envío de Mensajes por Automatizaciones

## 🎯 Respuesta Rápida: ¿Funciona el envío de mensajes?

**SÍ y NO:**
- ✅ **WhatsApp**: SÍ funciona completamente (si tienes configurado WhatsApp Business API)
- ⚠️ **Instagram**: PARCIALMENTE - Falta el `instagram_id` de los clientes
- ⚠️ **Email**: PARCIALMENTE - Falta la integración de Gmail API

---

## 📊 Flujo Completo (Paso a Paso)

### 1️⃣ **Usuario Crea Automatización**

```
Usuario → Dashboard → "Nueva Automatización" → Formulario 5 pasos
```

**Paso 1**: Nombre y Bot
**Paso 2**: Tipo de Trigger (birthday, inactive_client, new_promotion, comment_reply)
**Paso 3**: Asignar Promoción (opcional)
**Paso 4**: Seleccionar Plantilla de Mensaje
**Paso 5**: Revisar y Crear

### 2️⃣ **Al Guardar la Automatización**

**Archivo**: `components/dashboard/multi-step-automation-creation.tsx` (línea ~620)

```typescript
// Si el trigger es new_promotion, dispara broadcast inmediatamente
if (formData.trigger_type === 'new_promotion') {
  await fetch('/api/automations/webhook', {
    method: 'POST',
    body: JSON.stringify({
      type: 'INSERT',
      table: 'automations',
      record: newAutomation
    })
  })
}
```

### 3️⃣ **Webhook Procesa la Automatización**

**Archivo**: `app/api/automations/webhook/route.ts` → `handlePromotionAutomation()`

**Lo que hace:**
1. ✅ Obtiene todos los clientes del usuario
2. ✅ Personaliza el mensaje con variables:
   - `{nombre}` → Nombre del cliente
   - `{promocion}` → Nombre de la promoción
   - `{negocio}` → Nombre del negocio
3. ✅ Programa mensajes en `scheduled_messages` con delay de 10 segundos entre cada uno
4. ✅ Crea logs en `automation_logs`

**Ejemplo de mensaje programado:**
```json
{
  "user_id": "uuid-del-usuario",
  "automation_id": "uuid-de-automatizacion",
  "client_id": "uuid-del-cliente",
  "bot_id": "uuid-del-bot",
  "message_content": "¡Hola Juan! Tenemos una nueva promoción: 2x1 en todos los productos",
  "recipient_phone": "+34666666666",
  "recipient_instagram_id": "17841... ← ⚠️ ESTO FALTA",
  "scheduled_for": "2025-11-17T10:15:00Z",
  "status": "pending"
}
```

### 4️⃣ **Cron Job Procesa la Cola**

**Cron Job**: Cada 5 minutos ejecuta:
```sql
SELECT net.http_post(
  url := 'https://tu-dominio.vercel.app/api/automations/process-queue',
  ...
);
```

**Archivo**: `app/api/automations/process-queue/route.ts`

**Lo que hace:**
1. ✅ Lee mensajes con `status = 'pending'` y `scheduled_for <= NOW()`
2. ✅ Cambia estado a `'processing'`
3. ✅ Determina la plataforma del bot (whatsapp, instagram, gmail)
4. ✅ Llama a la función correspondiente:
   - `sendWhatsAppMessage()`
   - `sendInstagramMessage()`
   - `sendGmailMessage()`

### 5️⃣ **Envío Real del Mensaje**

#### 📱 **Instagram** (`sendInstagramMessage()`)

```typescript
// 1. Busca configuración de Instagram
const { data: instagramConfig } = await supabase
  .from('instagram_integrations')
  .select('*')
  .eq('bot_id', bot.id)
  .single()

// 2. Prepara el payload
const messagePayload = {
  recipient: {
    id: message.recipient_instagram_id // ← ⚠️ PROBLEMA: Este campo está NULL
  },
  message: {
    text: message.message_content
  }
}

// 3. Envía a Instagram API
await fetch(`https://graph.facebook.com/v18.0/${instagramConfig.page_id}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${instagramConfig.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(messagePayload)
})
```

#### 💬 **WhatsApp** (`sendWhatsAppMessage()`)

```typescript
// 1. Busca configuración de WhatsApp
const { data: whatsappConfig } = await supabase
  .from('whatsapp_integrations')
  .select('*')
  .eq('bot_id', bot.id)
  .single()

// 2. Prepara el payload
const messagePayload = {
  messaging_product: 'whatsapp',
  to: message.recipient_phone, // ← ✅ Este campo SÍ existe
  type: 'text',
  text: { body: message.message_content }
}

// 3. Envía a WhatsApp Business API
await fetch(`https://graph.facebook.com/v18.0/${whatsappConfig.phone_number_id}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${whatsappConfig.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(messagePayload)
})
```

---

## ⚠️ Problemas Actuales

### 🔴 **Problema #1: Instagram ID faltante**

**Tabla `clients`:**
```sql
CREATE TABLE clients (
  ...
  phone TEXT,           -- ✅ Existe para WhatsApp
  email TEXT,           -- ✅ Existe para Email
  instagram TEXT,       -- ⚠️ Existe pero es el USERNAME (@usuario)
  ...
)
```

**Tabla `scheduled_messages`:**
```sql
CREATE TABLE scheduled_messages (
  ...
  recipient_phone TEXT,          -- ✅ Se usa para WhatsApp
  recipient_email TEXT,          -- ✅ Se usa para Email
  recipient_instagram_id TEXT,   -- ❌ Siempre está NULL
  ...
)
```

**El problema:**
- Instagram API requiere el **Instagram User ID** (número como `17841405622466750`)
- Solo tenemos el **username** (`@juanperez`)
- NO estamos capturando el Instagram ID cuando los clientes interactúan

### 🔴 **Problema #2: ¿Cómo obtener el Instagram ID?**

Instagram API solo te da el ID cuando:
1. El usuario envía un mensaje directo a tu página
2. El usuario comenta en una publicación

**Solución:**
```typescript
// Cuando recibes un mensaje/comentario via webhook:
{
  "sender": {
    "id": "17841405622466750"  // ← Este es el Instagram ID que necesitas
  },
  "message": {
    "text": "Hola, quiero información"
  }
}

// Debes guardar este ID en la tabla clients:
await supabase
  .from('clients')
  .upsert({
    instagram: username,
    instagram_id: sender.id  // ← NUEVO CAMPO NECESARIO
  })
```

### 🔴 **Problema #3: Limitaciones de Instagram Messaging**

Instagram NO permite enviar mensajes proactivos como WhatsApp. Solo puedes:

1. **Responder a mensajes** dentro de 24 horas
2. **Responder a comentarios** de posts/stories

**NO puedes:**
- ❌ Enviar mensajes masivos a todos tus clientes
- ❌ Enviar promociones a usuarios que no te han escrito
- ❌ Hacer "broadcast" como en WhatsApp

---

## ✅ Soluciones y Recomendaciones

### **Para WhatsApp (Funciona 100%)**

```
✅ Crea automatización con bot de WhatsApp
✅ Los clientes deben tener el campo `phone` lleno
✅ Debes tener WhatsApp Business API configurado
✅ El bot debe estar en whatsapp_integrations
✅ El access_token debe ser válido
```

### **Para Instagram (Requiere cambios)**

#### **Opción 1: Solo respuestas automáticas**
```typescript
// En lugar de broadcast masivo, usa comment_reply
// Cuando alguien comenta, le respondes automáticamente
{
  trigger_type: 'comment_reply',
  trigger_config: {
    keywords: ['info', 'precio', 'promoción']
  }
}
```

#### **Opción 2: Agregar Instagram ID a clientes**

1. **Modificar tabla clients:**
```sql
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS instagram_id TEXT;

CREATE INDEX clients_instagram_id_idx ON clients(instagram_id);
```

2. **Capturar ID en webhook de Instagram:**
```typescript
// app/api/instagram/webhook/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const senderId = body.sender.id
  const username = body.sender.username
  
  // Guardar/actualizar cliente
  await supabase
    .from('clients')
    .upsert({
      user_id: bot.user_id,
      instagram: username,
      instagram_id: senderId, // ← NUEVO
      name: username
    })
}
```

3. **Usar en automatizaciones:**
```typescript
// app/api/automations/webhook/route.ts
await supabase
  .from('scheduled_messages')
  .insert({
    ...
    recipient_instagram_id: client.instagram_id, // ← Ahora tiene valor
    ...
  })
```

#### **Opción 3: Usar Instagram Stories (Alternativa)**

En lugar de mensajes directos, publicar Stories con la promoción:
```typescript
// Publicar Story con promoción
await fetch(`https://graph.facebook.com/v18.0/${page_id}/media`, {
  method: 'POST',
  body: JSON.stringify({
    image_url: promotion.image_url,
    caption: promotion.description
  })
})
```

---

## 🎯 Recomendación Final

### **Para Promociones:**

1. **WhatsApp** → ✅ Úsalo para broadcast masivo
2. **Instagram** → ⚠️ Usa Stories + Respuestas automáticas a DMs
3. **Email** → ✅ Úsalo para clientes con email

### **Para Automatizaciones:**

| Trigger | WhatsApp | Instagram | Email |
|---------|----------|-----------|-------|
| `birthday` | ✅ Funciona | ❌ No permitido | ✅ Funciona |
| `inactive_client` | ✅ Funciona | ❌ No permitido | ✅ Funciona |
| `new_promotion` | ✅ Funciona | ❌ No permitido | ✅ Funciona |
| `comment_reply` | N/A | ✅ Funciona | N/A |

---

## 📝 Próximos Pasos

1. **Agregar campo `instagram_id` a tabla `clients`**
2. **Capturar Instagram ID en webhook cuando usuarios escriben**
3. **Modificar `handlePromotionAutomation()` para filtrar clientes con `instagram_id NOT NULL`**
4. **Agregar validación de ventana de 24h para Instagram**
5. **Implementar fallback a Email si Instagram no está disponible**

---

## 🔍 Para Debugging

**Ver mensajes en cola:**
```sql
SELECT * FROM scheduled_messages 
WHERE status = 'pending' 
ORDER BY scheduled_for;
```

**Ver mensajes enviados:**
```sql
SELECT * FROM scheduled_messages 
WHERE status = 'sent' 
ORDER BY sent_at DESC;
```

**Ver errores:**
```sql
SELECT * FROM scheduled_messages 
WHERE status = 'failed' 
ORDER BY updated_at DESC;
```

**Ver logs de automatización:**
```sql
SELECT * FROM automation_logs 
WHERE automation_id = 'tu-automation-id' 
ORDER BY created_at DESC;
```
