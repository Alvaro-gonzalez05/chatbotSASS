# 📋 Configuración de Integraciones Multi-Plataforma

Este documento explica cómo configurar correctamente las integraciones en el campo `integrations` (JSONB) de la tabla `bots` para cada plataforma.

## 📱 WhatsApp Business API

### Campos requeridos:
```json
{
  "access_token": "EAAjYLYimS1EBPucE3fyHn39jhZBzjz9HGHZA1vOTMemGiM37HuoT45bCbHZALfsVV4WW8ZBPKD0ukRk2REeNPzUPM7ZCod271JUiuLpCLoVmve6waGhdcUWEvLtFtPJDCCyxqd9NBgjhBZC1J009nuScZCBkigTZBFE4ndBycRT3hmtA7d86MRnvFYlPHO2iNh1QLSZCqOuK4uEMciNCnfy103OTKL9ykscsQbSwzqOL2FZB9Q0PYZD",
  "phone_number_id": "793528520499781",
  "business_account_id": "1222850426258356",
  "webhook_url": "https://tu-dominio.com/api/whatsapp/webhook",
  "webhook_verify_token": "verify_f3edab4d-a751-4049-a815-1152330bc7dd_1761098514862"
}
```

### Dónde obtener cada campo:
- **access_token**: Meta Business Manager → Configuración → Tokens del sistema
- **phone_number_id**: WhatsApp Manager → Números de teléfono → ID del número
- **business_account_id**: WhatsApp Manager → Configuración → ID de la cuenta
- **webhook_url**: URL de tu servidor para recibir webhooks
- **webhook_verify_token**: Token personalizado para verificar webhooks

---

## 📷 Instagram Business API

### Campos requeridos:
```json
{
  "access_token": "EAAjYLYimS1EBPucE3fyHn39jhZBzjz9HGHZA1vOTMemGiM37HuoT45bCbHZALfsVV4WW8ZBPKD0ukRk2REeNPzUPM7ZCod271JUiuLpCLoVmve6waGhdcUWEvLtFtPJDCCyxqd9NBgjhBZC1J009nuScZCBkigTZBFE4ndBycRT3hmtA7d86MRnvFYlPHO2iNh1QLSZCqOuK4uEMciNCnfy103OTKL9ykscsQbSwzqOL2FZB9Q0PYZD",
  "instagram_business_account_id": "17841405309211844",
  "app_id": "23849583679124",
  "app_secret": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "business_account_id": "1222850426258356",
  "webhook_url": "https://tu-dominio.com/api/instagram/webhook",
  "webhook_verify_token": "verify_instagram_f3edab4d-a751-4049-a815-1152330bc7dd_1761098514862"
}
```

### Dónde obtener cada campo:
- **access_token**: Meta Business Manager → Configuración → Tokens del sistema
- **instagram_business_account_id**: Instagram → Configuración profesional → ID de cuenta
- **app_id**: Meta for Developers → Tu app → Configuración básica → ID de la app
- **app_secret**: Meta for Developers → Tu app → Configuración básica → Clave secreta
- **business_account_id**: Meta Business Manager → ID de cuenta business (opcional, para templates)
- **webhook_url**: URL de tu servidor para recibir webhooks de Instagram
- **webhook_verify_token**: Token personalizado para verificar webhooks

---

## 📧 Email (SendGrid, Mailgun, etc.)

### Campos requeridos:
```json
{
  "provider": "sendgrid",
  "api_key": "SG.xyz123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz",
  "from_email": "noreply@tudominio.com",
  "from_name": "Tu Negocio"
}
```

### Proveedores soportados:
- **sendgrid**: SendGrid API
- **mailgun**: Mailgun API  
- **ses**: Amazon SES
- **smtp**: Servidor SMTP personalizado

### Campos adicionales para SMTP:
```json
{
  "provider": "smtp",
  "smtp_host": "mail.tudominio.com",
  "smtp_port": 587,
  "smtp_username": "tu-usuario",
  "smtp_password": "tu-contraseña", 
  "smtp_secure": true,
  "from_email": "noreply@tudominio.com",
  "from_name": "Tu Negocio"
}
```

---

## 🔧 Configuración en la Base de Datos

### SQL para actualizar integración de WhatsApp:
```sql
UPDATE bots 
SET integrations = '{
  "access_token": "TU_TOKEN_AQUI",
  "phone_number_id": "TU_PHONE_ID",
  "business_account_id": "TU_BUSINESS_ID",
  "webhook_url": "https://tu-dominio.com/api/whatsapp/webhook",
  "webhook_verify_token": "tu_token_verificacion"
}'::jsonb
WHERE id = 'ID_DE_TU_BOT' AND platform = 'whatsapp';
```

### SQL para actualizar integración de Instagram:
```sql
UPDATE bots 
SET integrations = '{
  "access_token": "TU_TOKEN_AQUI",
  "instagram_business_account_id": "TU_INSTAGRAM_ID",
  "app_id": "TU_APP_ID",
  "app_secret": "TU_APP_SECRET",
  "business_account_id": "TU_BUSINESS_ID",
  "webhook_url": "https://tu-dominio.com/api/instagram/webhook",
  "webhook_verify_token": "tu_token_verificacion"
}'::jsonb
WHERE id = 'ID_DE_TU_BOT' AND platform = 'instagram';
```

---

## ⚠️ Notas Importantes

1. **Seguridad**: Nunca expongas tokens o claves secretas en el frontend
2. **Tokens**: Los access_token de Meta expiran, implementa renovación automática
3. **Webhooks**: Asegúrate de que las URLs sean HTTPS en producción
4. **Plantillas**: WhatsApp e Instagram requieren plantillas pre-aprobadas por Meta
5. **Rate Limits**: Respeta los límites de API de cada plataforma

---

## 🧪 Cómo Probar la Configuración

1. **Verifica la configuración**: El sistema mostrará errores específicos si falta algún campo
2. **Prueba las plantillas**: Las plantillas se cargan automáticamente si la configuración es correcta  
3. **Revisa logs**: Consulta los logs del servidor para errores de API
4. **Usa Postman**: Prueba las URLs de webhook manualmente

---

## 🆘 Solución de Problemas

### Error: "Configuración Incompleta"
- Verifica que todos los campos requeridos estén presentes
- Asegúrate de que el JSON sea válido

### Error: "Error de API" 
- Verifica que el access_token sea válido y no haya expirado
- Confirma que el business_account_id sea correcto
- Revisa permisos de la aplicación en Meta

### No aparecen plantillas:
- Crea plantillas en Meta Business Manager primero
- Espera aprobación (24-48 horas)
- Usa el botón "Actualizar plantillas" en la interfaz