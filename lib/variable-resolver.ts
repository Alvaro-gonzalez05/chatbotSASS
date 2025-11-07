import { createClient } from '@/lib/supabase/server'

/**
 * Servicio para resolver variables de plantillas con datos reales
 */

export interface VariableContext {
  userId: string
  clientId?: string
  businessId?: string
  promotionId?: string
  orderId?: string
  platform: 'whatsapp' | 'instagram' | 'email'
}

/**
 * Resuelve todas las variables de una plantilla con datos reales de la base de datos
 */
export async function resolveTemplateVariables(
  template: string,
  context: VariableContext
): Promise<string> {
  try {
    const supabase = await createClient()
    const variableValues: Record<string, string> = {}

    // Extraer variables del template
    const variables = extractVariablesFromTemplate(template)
    
    if (variables.length === 0) {
      return template
    }

    // Obtener datos del cliente si hay clientId
    if (context.clientId) {
      const clientData = await getClientData(supabase, context.clientId)
      Object.assign(variableValues, clientData)
    }

    // Obtener datos del negocio/usuario
    const businessData = await getBusinessData(supabase, context.userId)
    Object.assign(variableValues, businessData)

    // Obtener datos de la promoción si hay promotionId
    if (context.promotionId) {
      const promotionData = await getPromotionData(supabase, context.promotionId)
      Object.assign(variableValues, promotionData)
    }

    // Obtener datos del pedido si hay orderId
    if (context.orderId) {
      const orderData = await getOrderData(supabase, context.orderId)
      Object.assign(variableValues, orderData)
    }

    // Agregar variables de fecha/hora
    const datetimeData = getDateTimeData()
    Object.assign(variableValues, datetimeData)

    // Reemplazar variables en el template
    return replaceVariables(template, variableValues)

  } catch (error) {
    console.error('Error resolving template variables:', error)
    return template // Devolver template original si hay error
  }
}

/**
 * Extrae variables del template usando el patrón {variable}
 */
function extractVariablesFromTemplate(template: string): string[] {
  const matches = template.match(/\{([^}]+)\}/g)
  return matches ? matches.map(match => match.replace(/[{}]/g, '')) : []
}

/**
 * Obtiene datos del cliente desde la base de datos
 */
async function getClientData(supabase: any, clientId: string): Promise<Record<string, string>> {
  try {
    // Si es un cliente de muestra, devolver datos ficticios
    if (clientId === 'sample-client-preview') {
      return {
        nombre: 'María González',
        email: 'maria.gonzalez@email.com',
        telefono: '+57 300 123 4567',
        instagram_usuario: '@mariagonzalez',
        puntos: '250 puntos',
        total_compras: '$487.50',
        ultima_compra: '28 de octubre, 2024',
      }
    }

    const { data: client } = await supabase
      .from('clients')
      .select('name, email, phone, instagram_username, points, total_purchases, last_purchase_date')
      .eq('id', clientId)
      .single()

    if (!client) return {}

    return {
      nombre: client.name || '',
      email: client.email || '',
      telefono: client.phone || '',
      instagram_usuario: client.instagram_username || '',
      puntos: client.points ? `${client.points} puntos` : '0 puntos',
      total_compras: client.total_purchases ? `$${client.total_purchases}` : '$0.00',
      ultima_compra: client.last_purchase_date ? formatDate(client.last_purchase_date) : 'Sin compras registradas',
    }
  } catch (error) {
    console.error('Error fetching client data:', error)
    return {}
  }
}

/**
 * Obtiene datos del negocio/usuario desde la base de datos
 */
async function getBusinessData(supabase: any, userId: string): Promise<Record<string, string>> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, business_description, location, menu_link')
      .eq('id', userId)
      .single()

    if (!profile) return {}

    return {
      nombre_negocio: profile.business_name || '',
      descripcion_negocio: profile.business_description || '',
      ubicacion: profile.location || '',
      enlace_menu: profile.menu_link || '',
    }
  } catch (error) {
    console.error('Error fetching business data:', error)
    return {}
  }
}

/**
 * Obtiene datos de la promoción desde la base de datos
 */
async function getPromotionData(supabase: any, promotionId: string): Promise<Record<string, string>> {
  try {
    const { data: promotion } = await supabase
      .from('promotions')
      .select('name, description, start_date, end_date, max_uses, current_uses, image_url')
      .eq('id', promotionId)
      .single()

    if (!promotion) return {}

    return {
      nombre_promocion: promotion.name || '',
      descripcion_promocion: promotion.description || '',
      fecha_inicio: promotion.start_date ? formatDate(promotion.start_date) : '',
      fecha_fin: promotion.end_date ? formatDate(promotion.end_date) : '',
      usos_maximos: promotion.max_uses ? `${promotion.max_uses} personas` : 'Sin límite',
      usos_actuales: promotion.current_uses ? `${promotion.current_uses} personas` : '0 personas',
    }
  } catch (error) {
    console.error('Error fetching promotion data:', error)
    return {}
  }
}

/**
 * Obtiene datos del pedido desde la base de datos
 */
async function getOrderData(supabase: any, orderId: string): Promise<Record<string, string>> {
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('order_number, total_amount, status, estimated_delivery_date')
      .eq('id', orderId)
      .single()

    if (!order) return {}

    return {
      numero_pedido: order.order_number || '',
      total_pedido: order.total_amount ? `$${order.total_amount}` : '',
      estado_pedido: order.status || '',
      fecha_entrega: order.estimated_delivery_date ? formatDate(order.estimated_delivery_date) : '',
    }
  } catch (error) {
    console.error('Error fetching order data:', error)
    return {}
  }
}

/**
 * Obtiene datos de fecha y hora actuales
 */
function getDateTimeData(): Record<string, string> {
  const now = new Date()
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  
  return {
    fecha_actual: formatDate(now.toISOString()),
    hora_actual: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    dia_semana: days[now.getDay()],
  }
}

/**
 * Reemplaza variables en el template con valores reales
 */
function replaceVariables(template: string, values: Record<string, string>): string {
  let result = template
  
  Object.entries(values).forEach(([variable, value]) => {
    const pattern = new RegExp(`\\{${variable}\\}`, 'g')
    result = result.replace(pattern, value || `{${variable}}`) // Mantener variable si no hay valor
  })
  
  return result
}

/**
 * Formatea una fecha ISO a formato legible
 */
function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return isoDate
  }
}