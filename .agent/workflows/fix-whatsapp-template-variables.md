# Solución: Plantillas de WhatsApp con Variables con Nombres

## Problema Identificado

WhatsApp API **NO SOPORTA** variables con nombres personalizados como `{{Nombre_Cliente}}`, `{{nombre}}`, etc. cuando se envían mensajes vía AP

I.

Solo soporta variables **numéricas** como `{{1}}`, `{{2}}`, etc.

## Evidencia

- ✅ Plantilla "prueba" con `{{1}}` y `{{2}}` → **FUNCIONÓ**
- ❌ Plantilla "hola" con `{{Nombre_Cliente}}` → **FALLÓ** (Meta espera 0 parámetros)

##  Soluciones

### **Solución Recomendada: Rediseñar la plantilla en Meta**

**En WhatsApp Business Manager, edita tu plantilla "hola" para usar variables numéricas:**

Texto actual:
```
Hola *{{Nombre_Cliente}}*, estas fiestas *Staff Catering*...
```

Texto corregido:
```
Hola *{{1}}*, estas fiestas *Staff Catering*...
```

Luego en el formulario de automatización, mapeas:
- `{{1}}` → `nombre` (nombre del cliente)

### **Solución Alternativa (Temporal): No usar variables en esa plantilla**

Si no puedes cambiar la plantilla en Meta, otra opción es que el sistema detecte que NO tiene variables parametrizables y no intente mapearlas.

## Fix Técnico Requerido

Necesitas actualizar el archivo `app/api/templates/route.ts`, función `extractWhatsAppTemplateVariables` (línea 634) para que:

1. Use el campo `example.body_text` de Meta (fuente confiable)
2. Solo detecte variables numéricas `{{1}}`, `{{2}}`, etc.
3. Ignore variables con nombres `{{Nombre_Cliente}}`, `{{nombre}}`, etc.

### Código correcto:

```typescript
// Función auxiliar para extraer variables de WhatsApp
// IMPORTANTE: Solo detecta variables numéricas como {{1}}, {{2}}, etc.
// Las variables con nombres como {{nombre}}, {{Nombre_Cliente}} NO son parametrizables vía WhatsApp API
function extractWhatsAppTemplateVariables(components: any[]): string[] {
  if (!components) return []
  
  const variables: string[] = []
  
  // Buscar en el componente BODY que es donde van los parámetros
  const bodyComponent = components.find(comp => comp.type === 'BODY')
  
  if (bodyComponent) {
    // OPCIÓN 1: Usar el campo example.body_text que Meta proporciona
    // Este es el método más confiable porque Meta nos dice exactamente cuántas variables hay
    if (bodyComponent.example?.body_text?.[0]) {
      const exampleParams = bodyComponent.example.body_text[0]
      // La cantidad de elementos nos dice cuántas variables hay
      for (let i = 0; i < exampleParams.length; i++) {
        variables.push(`var_${i + 1}`)
      }
      return variables
    }
    
    // OPCIÓN 2: Si no hay example, buscar SOLO variables numér icas en el texto
    // Solo {{1}}, {{2}}, etc. son parametrizables vía API
    if (bodyComponent.text) {
      const matches = bodyComponent.text.match(/\{\{(\d+)\}\}/g)
      if (matches) {
        matches.forEach((match: string) => {
          const num = match.replace(/[{}]/g, '').trim()
          if (/^\d+$/.test(num)) { // Verificar que sea un número
            variables.push(`var_${num}`)
          }
        })
      }
    }
  }
  
  return [...new Set(variables)] // Remover duplicados
}
```

### Cómo aplicar el fix:

1. Abre `app/api/templates/route.ts`
2. Busca la función `extractWhatsAppTemplateVariables` (línea ~634)
3. Reemplaza toda la función con el código de arriba
4. Guarda el archivo
5. Ahora las plantillas con variables con nombres (como "hola") aparecerán con 0 variables
6. Solo las plantillas con variables numéricas (como "prueba") mostrarán variables para mapear

## Resumen

**Para usar tu plantilla "hola":**
1. Ve a WhatsApp Business Manager
2. Edita la plantilla "hola"
3. Cambia `{{Nombre_Cliente}}` por `{{1}}`
4. Envía para aprobación
5. Una vez aprobada, recarga las plantillas en tu sistema
6. Al crear la automatización, mapea `{{1}}` → `nombre`

**O deja la plantilla como está si no necesitas personalización**, pero entonces no intentes mapear variables.
