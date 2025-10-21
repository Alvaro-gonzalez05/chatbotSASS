# 🚀 Sistema Multi-Plataforma de Automatización

## ✅ **¿Qué se implementó?**

### **1. APIs para obtener Plantillas de Meta**
- ✅ **WhatsApp Business Templates** - Desde Meta Graph API
- ✅ **Instagram Business Templates** - Desde Meta Graph API  
- ✅ **Email Templates** - SendGrid, Mailgun, SES, SMTP

### **2. Procesamiento Multi-Plataforma**
- ✅ **WhatsApp** - Via WhatsApp Business API
- ✅ **Instagram** - Via Instagram Messaging API
- ✅ **Email** - SendGrid, Mailgun, Amazon SES

### **3. Nuevas Tablas Creadas**
```sql
-- Ejecuta este script:
\i scripts/022_create_multi_platform_integrations.sql
```

## 📋 **APIs Disponibles**

### **1. Obtener Plantillas** `/api/templates`
```javascript
// Obtener todas las plantillas
GET /api/templates

// Filtrar por plataforma
GET /api/templates?platform=whatsapp
GET /api/templates?platform=instagram  
GET /api/templates?platform=email

// Filtrar por bot específico
GET /api/templates?bot_id=uuid
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "template_123",
        "name": "Cumpleaños Cliente",
        "platform": "whatsapp",
        "body_text": "¡Feliz cumpleaños {{1}}! 🎉",
        "variables": ["var_1"],
        "source": "meta_api"
      }
    ],
    "by_platform": {
      "whatsapp": [...],
      "instagram": [...],
      "email": [...]
    }
  }
}
```

### **2. Sincronizar Plantillas** `/api/templates`
```javascript
// Sincronizar plantillas desde APIs externas
POST /api/templates
{
  "platform": "whatsapp", // o "instagram", "email", "all"
  "bot_id": "uuid",
  "force_refresh": true
}
```

### **3. Procesamiento Multi-Plataforma** `/api/automations/process-queue`
```javascript
// Procesa mensajes de TODAS las plataformas automáticamente
POST /api/automations/process-queue
{
  "batch_size": 50,
  "user_id": "uuid" // opcional
}
```

## 🔧 **Configuración por Plataforma**

### **WhatsApp Business**
Tabla: `whatsapp_integrations` (ya existía)
```sql
-- Campos requeridos:
- whatsapp_business_account_id
- phone_number_id  
- access_token
```

### **Instagram Business**  
Tabla: `instagram_integrations` (NUEVA)
```sql
-- Campos requeridos:
- instagram_business_account_id
- page_id
- access_token
```

### **Email Providers**
Tabla: `email_integrations` (NUEVA)
```sql
-- Campos requeridos:
- provider: 'sendgrid' | 'mailgun' | 'ses' | 'smtp'
- api_key (para APIs)
- from_email
- from_name
```

## 📤 **Cómo Funciona el Envío**

### **1. Mensajes Programados**
Los mensajes se almacenan en `scheduled_messages` con campos específicos por plataforma:
```sql
-- Campos por plataforma:
recipient_phone     -- WhatsApp
recipient_email     -- Email  
recipient_instagram_id -- Instagram
subject            -- Email (asunto)
html_content       -- Email (HTML)
platform           -- 'whatsapp' | 'instagram' | 'email'
```

### **2. Procesamiento Automático**
El sistema detecta la plataforma del bot y usa la función correcta:
```typescript
switch (bot.platform) {
  case 'whatsapp':
    return await sendWhatsAppMessage(message, bot)
  case 'instagram':
    return await sendInstagramMessage(message, bot)  
  case 'email':
    return await sendEmailMessage(message, bot)
}
```

### **3. APIs Externas Utilizadas**

#### **WhatsApp Business API**
```javascript
POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
Authorization: Bearer {access_token}
{
  "messaging_product": "whatsapp",
  "to": "+1234567890", 
  "type": "text",
  "text": { "body": "¡Hola!" }
}
```

#### **Instagram Messaging API**
```javascript
POST https://graph.facebook.com/v18.0/{page_id}/messages
Authorization: Bearer {access_token}
{
  "recipient": { "id": "instagram_user_id" },
  "message": { "text": "¡Hola!" }
}
```

#### **SendGrid API**
```javascript
POST https://api.sendgrid.com/v3/mail/send
Authorization: Bearer {api_key}
{
  "personalizations": [{"to": [{"email": "user@example.com"}]}],
  "from": {"email": "bot@empresa.com"},
  "content": [{"type": "text/plain", "value": "¡Hola!"}]
}
```

## 🎯 **Plantillas desde Meta API**

### **WhatsApp Business Templates**
```javascript
GET https://graph.facebook.com/v18.0/{whatsapp_business_account_id}/message_templates
Authorization: Bearer {access_token}

// Respuesta incluye:
- name: nombre del template
- status: APPROVED, PENDING, REJECTED
- language: es, en, etc.
- components: estructura del mensaje
- quality_score: calidad del template
```

### **Instagram Templates** 
```javascript
// Templates locales + configuración desde:
GET https://graph.facebook.com/v18.0/{instagram_business_account_id}/messaging_feature_review
```

## 🧪 **Cómo Probarlo**

### **1. Ejecutar Scripts SQL**
```sql
-- Crear tablas multi-plataforma
\i scripts/022_create_multi_platform_integrations.sql
```

### **2. Configurar Integraciones**
```sql
-- Instagram
INSERT INTO instagram_integrations (bot_id, instagram_business_account_id, page_id, access_token)
VALUES ('bot_uuid', 'ig_account_id', 'page_id', 'access_token');

-- Email  
INSERT INTO email_integrations (bot_id, user_id, provider, api_key, from_email, from_name)
VALUES ('bot_uuid', 'user_uuid', 'sendgrid', 'api_key', 'bot@empresa.com', 'Mi Bot');
```

### **3. Probar APIs**
```bash
# Obtener plantillas
curl -X GET "https://tu-dominio.com/api/templates?platform=all"

# Sincronizar plantillas
curl -X POST "https://tu-dominio.com/api/templates" \
  -d '{"platform": "all", "force_refresh": true}'

# Procesar cola
curl -X POST "https://tu-dominio.com/api/automations/process-queue" \
  -d '{"batch_size": 10}'
```

### **4. Crear Automatización Multi-Plataforma**
En `/dashboard/automatizaciones`:
1. Selecciona un bot (WhatsApp, Instagram, o Email)
2. El sistema automáticamente usará la plataforma correcta
3. Las plantillas se cargarán desde las APIs correspondientes

## 🔄 **Flujo Completo**

```
1. Usuario crea automatización 
   ↓
2. Sistema detecta plataforma del bot
   ↓  
3. Carga plantillas desde API correspondiente (Meta/SendGrid/etc.)
   ↓
4. Usuario personaliza mensaje
   ↓
5. Cron job ejecuta automatización
   ↓
6. Sistema programa mensajes en cola
   ↓
7. Procesador detecta plataforma y envía via API correcta
   ↓
8. Logs multi-plataforma en automation_logs
```

¡El sistema ahora funciona para **WhatsApp**, **Instagram** y **Email** de forma completamente unificada! 🚀