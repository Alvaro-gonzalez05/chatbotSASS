/**
 * Utilidades para manejo de variables en plantillas
 */

export interface TemplateVariable {
  name: string
  type: 'client' | 'business' | 'promotion' | 'order' | 'custom'
  description: string
  example: string
}

/**
 * Variables disponibles según el contexto de la automatización
 * Basadas en la estructura real de la base de datos
 */
export const AVAILABLE_VARIABLES: Record<string, TemplateVariable[]> = {
  // Variables de cliente (basadas en la tabla clients actualizada)
  client: [
    { name: 'nombre', type: 'client', description: 'Nombre completo del cliente', example: 'Juan Pérez' },
    { name: 'email', type: 'client', description: 'Email del cliente', example: 'juan@email.com' },
    { name: 'telefono', type: 'client', description: 'Teléfono del cliente', example: '+57 300 123 4567' },
    { name: 'instagram_usuario', type: 'client', description: 'Usuario público de Instagram', example: '@juanperez' },
    { name: 'puntos', type: 'client', description: 'Puntos acumulados', example: '150 puntos' },
    { name: 'total_compras', type: 'client', description: 'Total de compras realizadas', example: '$1,250.00' },
    { name: 'ultima_compra', type: 'client', description: 'Fecha de la última compra', example: '15 de octubre, 2024' },
  ],
  
  // Variables del negocio (basadas en la tabla profiles)
  business: [
    { name: 'nombre_negocio', type: 'business', description: 'Nombre del negocio', example: 'Mi Tienda' },
    { name: 'descripcion_negocio', type: 'business', description: 'Descripción del negocio', example: 'Tu tienda de confianza' },
    { name: 'ubicacion', type: 'business', description: 'Ubicación del negocio', example: 'Centro Comercial Plaza' },
    { name: 'enlace_menu', type: 'business', description: 'Enlace al menú', example: 'www.mitienda.com/menu' },
  ],

  // Variables de promoción (basadas en la tabla promotions simplificada)
  promotion: [
    { name: 'nombre_promocion', type: 'promotion', description: 'Nombre de la promoción', example: 'Black Friday Especial' },
    { name: 'descripcion_promocion', type: 'promotion', description: 'Descripción de la promoción', example: 'Aprovecha nuestras ofertas especiales' },
    { name: 'fecha_inicio', type: 'promotion', description: 'Fecha de inicio', example: '15 de noviembre' },
    { name: 'fecha_fin', type: 'promotion', description: 'Fecha de finalización', example: '30 de noviembre' },
    { name: 'usos_maximos', type: 'promotion', description: 'Número máximo de usos', example: '100 personas' },
    { name: 'usos_actuales', type: 'promotion', description: 'Usos realizados hasta ahora', example: '45 personas' },
  ],

  // Variables de pedido (para automatizaciones de pedidos)
  order: [
    { name: 'numero_pedido', type: 'order', description: 'Número del pedido', example: '#12345' },
    { name: 'total_pedido', type: 'order', description: 'Total del pedido', example: '$99.99' },
    { name: 'estado_pedido', type: 'order', description: 'Estado del pedido', example: 'En preparación' },
    { name: 'fecha_entrega', type: 'order', description: 'Fecha de entrega estimada', example: '15/11/2024' },
  ],

  // Variables de fecha/hora
  datetime: [
    { name: 'fecha_actual', type: 'custom', description: 'Fecha actual', example: '15/11/2024' },
    { name: 'hora_actual', type: 'custom', description: 'Hora actual', example: '14:30' },
    { name: 'dia_semana', type: 'custom', description: 'Día de la semana', example: 'Lunes' },
  ],
}

/**
 * Extrae variables de un texto usando patrones como {variable}
 */
export function extractVariablesFromText(text: string): string[] {
  if (!text) return []
  
  // Patrón para encontrar {variable_name}
  const variablePattern = /\{([^}]+)\}/g
  const matches = text.match(variablePattern)
  
  if (!matches) return []
  
  return matches
    .map(match => match.replace(/[{}]/g, ''))
    .filter(variable => variable.length > 0)
    .filter((variable, index, array) => array.indexOf(variable) === index) // Remover duplicados
}

/**
 * Valida si las variables usadas están disponibles según el contexto
 */
export function validateVariables(
  variables: string[], 
  triggerType: string, 
  hasPromotion: boolean = false
): { valid: string[], invalid: string[] } {
  const availableVars = getAllAvailableVariables(triggerType, hasPromotion)
  const availableVarNames = availableVars.map(v => v.name)
  
  const valid = variables.filter(v => availableVarNames.includes(v))
  const invalid = variables.filter(v => !availableVarNames.includes(v))
  
  return { valid, invalid }
}

/**
 * Obtiene todas las variables disponibles según el contexto
 */
export function getAllAvailableVariables(
  triggerType: string, 
  hasPromotion: boolean = false
): TemplateVariable[] {
  let variables: TemplateVariable[] = [
    ...AVAILABLE_VARIABLES.client,
    ...AVAILABLE_VARIABLES.business,
    ...AVAILABLE_VARIABLES.datetime,
  ]

  // Agregar variables específicas según el tipo de trigger
  switch (triggerType) {
    case 'new_order':
    case 'order_ready':
      variables = [...variables, ...AVAILABLE_VARIABLES.order]
      break
  }

  // Agregar variables de promoción si hay una promoción vinculada
  if (hasPromotion) {
    variables = [...variables, ...AVAILABLE_VARIABLES.promotion]
  }

  return variables
}

/**
 * Genera sugerencias de variables basadas en el contexto
 */
export function getVariableSuggestions(
  currentText: string,
  triggerType: string,
  hasPromotion: boolean = false
): TemplateVariable[] {
  const availableVars = getAllAvailableVariables(triggerType, hasPromotion)
  const usedVars = extractVariablesFromText(currentText)
  
  // Retornar variables no usadas aún
  return availableVars.filter(v => !usedVars.includes(v.name))
}

/**
 * Convierte variables de formato Meta ({{1}}) a formato personalizado ({nombre})
 */
export function convertMetaVariablesToCustom(
  text: string, 
  variableMapping: Record<string, string>
): string {
  let convertedText = text
  
  Object.entries(variableMapping).forEach(([metaVar, customVar]) => {
    const metaPattern = new RegExp(`\\{\\{${metaVar}\\}\\}`, 'g')
    convertedText = convertedText.replace(metaPattern, `{${customVar}}`)
  })
  
  return convertedText
}

/**
 * Reemplaza variables en el texto con valores reales
 */
export function replaceVariablesWithValues(
  text: string, 
  values: Record<string, string>
): string {
  let processedText = text
  
  Object.entries(values).forEach(([variable, value]) => {
    const pattern = new RegExp(`\\{${variable}\\}`, 'g')
    processedText = processedText.replace(pattern, value)
  })
  
  return processedText
}