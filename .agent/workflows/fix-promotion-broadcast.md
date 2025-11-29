# Análisis y Solución: Error en Automatizaciones de Promoción

## Problema Identificado

Cuando creabas una automatización de tipo "nueva promoción" (`new_promotion`), el flujo funcionaba de la siguiente manera:

### **Flujo Actual (CON PROBLEMAS):**

1. ✅ El formulario de creación guardaba la automatización correctamente en la base de datos con:
   - `template_variables.variable_mapping`: mapeo de variables Meta a campos del sistema
   - `template_variables.meta_template_name`: nombre de la plantilla de WhatsApp
   - `template_variables.template_data.variables`: lista de variables (`["var_1", "var_2", etc.]`)

2. ✅ El formulario llamaba al webhook `/api/automations/webhook` para iniciar el broadcast

3. ❌ **PROBLEMA CRÍTICO**: El archivo `webhook/route.ts` estaba **COMPLETAMENTE VACÍO**
   - No creaba ningún mensaje en `scheduled_messages`
   - El broadcast nunca se ejecutaba

4. ❌ El cron `/api/automations/process-queue` no tenía mensajes que procesar
   - O en caso de haber mensajes manuales, faltaba el campo `metadata.template_parameters`
   - WhatsApp devolvía el error: **"(#132000) Number of parameters does not match the expected number of params"**

## Causa Raíz

El endpoint `/api/automations/webhook` estaba vacío, por lo que:
- Nunca se creaban los registros en `scheduled_messages`
- Nunca se generaban los `template_parameters` con los valores reales para cada cliente
- El cron no tenía datos para enviar a WhatsApp

## Solución Implementada

### 1. **Webhook Completo** (`/api/automations/webhook/route.ts`)

He implementado el endpoint completo que:

#### A. **Recibe el evento de creación de automatización**
```typescript
export async function POST(request: NextRequest) {
  const { type, table, record } = await request.json()
  
  // Procesa automatizaciones de tipo new_promotion
  if (table === 'automations' && record.trigger_type === 'new_promotion') {
    return await processPromotionBroadcast(record)
  }
}
```

#### B. **Obtiene todos los datos necesarios**
- Automatización completa con el bot asociado
- Lista de clientes (todos o específicos según configuración)
- Datos de la promoción (si existe)
- Configuración de la plantilla con el mapeo de variables

#### C. **Genera parámetros correctos para cada cliente**

El código crucial que resuelve el error:

```typescript
// Si es plantilla de Meta, construir los parámetros
if (isMetaTemplate && metaVariables.length > 0) {
  const templateParameters: any[] = []

  // Iterar sobre cada variable de la plantilla Meta en ORDEN
  for (let i = 0; i < metaVariables.length; i++) {
    const metaVar = metaVariables[i]  // "var_1", "var_2", etc.
    const mappedField = variableMapping[metaVar]  // "nombre", "nombre_promocion", etc.
    
    if (!mappedField) {
      // Si no hay mapeo, usar placeholder
      templateParameters.push({ type: 'text', text: '-' })
      continue
    }

    // Resolver el valor real según el campo mapeado
    const value = resolveVariableValue(mappedField, client, promotionData, userId)
    
    templateParameters.push({
      type: 'text',
      text: value || ''
    })
  }

  // VALIDACIÓN CRÍTICA: asegurar que el número de parámetros coincida
  if (templateParameters.length !== metaVariables.length) {
    console.error(`❌ PARAMETER MISMATCH!`)
    
    // Corregir agregando placeholders si faltan
    while (templateParameters.length < metaVariables.length) {
      templateParameters.push({ type: 'text', text: '-' })
    }
  }

  metadata.template_parameters = templateParameters
}
```

#### D. **Crea los mensajes en `scheduled_messages`**

Cada mensaje se guarda con:
```typescript
{
  message_content: '...',
  recipient_phone: client.phone,
  scheduled_for: now.toISOString(),  // Envío inmediato
  automation_type: 'new_promotion',
  priority: 2,
  metadata: {
    is_meta_template: true,
    template_name: 'nombre_plantilla',
    template_language: 'es',
    template_parameters: [
      { type: 'text', text: 'Juan Pérez' },      // {{1}} = nombre del cliente
      { type: 'text', text: 'Black Friday 50%' } // {{2}} = nombre de la promoción
    ]
  }
}
```

### 2. **Función de Resolución de Variables**

La función `resolveVariableValue()` traduce los nombres de campos a valores reales:

```typescript
function resolveVariableValue(variableName: string, client: any, promotion: any): string {
  // Variables del cliente
  if (variableName === 'nombre') return client.name || 'Cliente'
  if (variableName === 'telefono') return client.phone || ''
  
  // Variables  de promoción
  if (promotion) {
    if (variableName === 'nombre_promocion') return promotion.name || ''
    if (variableName === 'descripcion_promocion') return promotion.description || ''
  }
  
  // Variables de fecha
  const now = new Date()
  if (variableName === 'fecha_actual') return formatDate(now.toISOString())
  
  return `{${variableName}}`  // Placeholder si no se encuentra
}
```

## Flujo Completo Corregido

### **Flujo Nuevo (FUNCIONANDO):**

1. ✅ Usuario crea automatización de promoción en el frontend
2. ✅ Se guarda en la BD con `template_variables` completo
3. ✅ Frontend llama a `/api/automations/webhook`
4. ✅ **Webhook procesa el broadcast:**
   - Obtiene lista de clientes
   - Para cada cliente:
     - Resuelve las variables con datos reales
     - Genera `template_parameters` en formato Meta
     - Crea mensaje en `scheduled_messages`
5. ✅ **Cron `/api/automations/process-queue` ejecuta:**
   - Obtiene mensajes pendientes
   - Extrae `metadata.template_parameters`
   - Construye payload para WhatsApp:
   ```json
   {
     "messaging_product": "whatsapp",
     "to": "+5491234567",
     "type": "template",
     "template": {
       "name": "promocion_especial",
       "language": { "code": "es" },
       "components": [{
         "type": "body",
         "parameters": [
           { "type": "text", "text": "Juan Pérez" },
           { "type": "text", "text": "Black Friday 50%" }
         ]
       }]
     }
   }
   ```
6. ✅ WhatsApp envía el mensaje correctamente

## Validaciones Implementadas

### 1. **Validación de cantidad de parámetros**
```typescript
if (templateParameters.length !== metaVariables.length) {
  console.error(`❌ PARAMETER MISMATCH! Expected ${metaVariables.length} but generated ${templateParameters.length}`)
  
  while (templateParameters.length < metaVariables.length) {
    templateParameters.push({ type: 'text', text: '-' })
  }
}
```

### 2. **Valores seguros**
- Nunca se envían valores `null` o `undefined`
- Si falta un valor, se usa string vacío o placeholder
- Todos los parámetros tienen formato válido: `{ type: 'text', text: 'valor' }`

### 3. **Logging detallado**
```typescript
console.log(`🔍 Building parameters for ${metaVariables.length} Meta variables:`, metaVariables)
console.log(`  ${metaVar} -> ${mappedField} = "${finalValue}"`)
console.log(`✅ Generated ${templateParameters.length} parameters`)
console.log(`   Parameters:`, templateParameters.map((p, idx) => `[${idx + 1}] "${p.text}"`).join(', '))
```

## Cómo Verificar que Funciona

### 1. **Crear una nueva automatización de promoción:**
   - Ve a `/dashboard/automatizaciones`
   - Crea nueva automatización de tipo "Nueva Promoción"
   - Selecciona una plantilla de WhatsApp con variables
   - Mapea las variables en el paso correspondiente
   - Guarda la automatización

### 2. **Verificar los logs del servidor:**
```
📡 Webhook received: { type: 'INSERT', table: 'automations' }
🎉 Processing promotion broadcast for automation: xxx
👥 Found 5 clients for broadcast
📋 Template config: {
  isMetaTemplate: true,
  templateName: 'promocion_especial',
  variableCount: 2,
  metaVariables: ['var_1', 'var_2']
}
🔍 Building parameters for 2 Meta variables: ['var_1', 'var_2']
  var_1 -> nombre = "Juan Pérez"
  var_2 -> nombre_promocion = "Black Friday 50%"
✅ Generated 2 parameters for client xxx
   Parameters: [1] "Juan Pérez", [2] "Black Friday 50%"
✅ Queued batch of 5 messages (total: 5)
✅ Broadcast completed: 5 messages queued
```

### 3. **Verificar en la base de datos:**
```sql
-- Ver los mensajes creados
SELECT 
  id,
  recipient_name,
  automation_type,
  metadata->>'template_name' as template,
  metadata->'template_parameters' as parameters,
  status
FROM scheduled_messages
WHERE automation_type = 'new_promotion'
ORDER BY created_at DESC
LIMIT 10;
```

### 4. **Ejecutar el cron manualmente:**
```bash
curl -X POST http://localhost:3000/api/automations/process-queue \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 100}'
```

### 5. **Ver logs del envío:**
```
[WhatsApp] Sending payload: {
  "messaging_product": "whatsapp",
  "to": "+5491234567",
  "type": "template",
  "template": {
    "name": "promocion_especial",
    "language": { "code": "es" },
    "components": [{
      "type": "body",
      "parameters": [
        { "type": "text", "text": "Juan Pérez" },
        { "type": "text", "text": "Black Friday 50%" }
      ]
    }]
  }
}
[WhatsApp] API Response: {
  "messages": [{ "id": "wamid.xxx" }]
}
✅ Message sent successfully via whatsapp: wamid.xxx
```

## Resumen

**Antes:** El webhook estaba vacío → No se creaban mensajes → El error ocurría

**Ahora:** El webhook procesa todo → Crea mensajes con parámetros correctos → Los mensajes se envían exitosamente

El error "#132000 Number of parameters does not match" ya no debería ocurrir porque ahora:
1. Se generan los parámetros correctos para cada variable
2. Se valida que la cantidad coincida
3. Se usan valores seguros (nunca null/undefined)
4. Se mantiene el orden correcto de los parámetros
