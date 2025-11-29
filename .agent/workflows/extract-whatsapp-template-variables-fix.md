// Función auxiliar para extraer variables de WhatsApp
// IMPORTANTE: Solo detecta variables numéricas tipo {{1}}, {{2}}, etc.
// Las variables con nombres tipo {{nombre}}, {{Nombre_Cliente}} NO son parametrizables vía WhatsApp API
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
      // exampleParams es un array como ["John", "your email"]
      // La cantidad de elementos nos dice cuántas variables hay
      for (let i = 0; i < exampleParams.length; i++) {
        variables.push(`var_${i + 1}`)
      }
      return variables
    }
    
    // OPCIÓN 2: Si no hay example, buscar variables numéricas en el texto
    // SOLO las variables tipo {{1}}, {{2}}, etc. son parametrizables vía API
    // Las variables con nombres tipo {{nombre}}, {{Nombre_Cliente}} NO son parametrizables
    if (bodyComponent.text) {
      const matches = bodyComponent.text.match(/\{\{(\d+)\}\}/g)
      if (matches) {
        matches.forEach((match: string) => {
          // Extraer solo el número
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
