import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveTemplateVariables } from '@/lib/variable-resolver'

/**
 * Endpoint para previsualizar mensajes con variables resueltas
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      template,
      platform,
      clientId,
      promotionId,
      orderId,
    } = body

    if (!template || !platform) {
      return NextResponse.json({ 
        error: 'Template and platform are required' 
      }, { status: 400 })
    }

    // Resolver variables con datos de ejemplo si no hay IDs específicos
    const resolvedTemplate = await resolveTemplateVariables(template, {
      userId: data.user.id,
      clientId: clientId || generateSampleClientId(),
      promotionId,
      orderId,
      platform: platform as 'whatsapp' | 'instagram' | 'email'
    })

    return NextResponse.json({
      success: true,
      original: template,
      resolved: resolvedTemplate,
      message: 'Template resolved successfully'
    })

  } catch (error) {
    console.error('Error resolving template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Genera datos de ejemplo para preview cuando no hay cliente específico
 */
function generateSampleClientId(): string {
  // En una implementación real, podrías crear un cliente de muestra temporal
  // o usar datos ficticios predefinidos
  return 'sample-client-preview'
}

/**
 * Endpoint para obtener variables disponibles según contexto
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const triggerType = searchParams.get('trigger_type')
    const hasPromotion = searchParams.get('has_promotion') === 'true'
    const platform = searchParams.get('platform')

    // Importar la función para obtener variables disponibles
    const { getAllAvailableVariables } = await import('@/lib/template-variables')
    
    const variables = getAllAvailableVariables(triggerType || '', hasPromotion)

    return NextResponse.json({
      success: true,
      variables,
      context: {
        trigger_type: triggerType,
        has_promotion: hasPromotion,
        platform
      }
    })

  } catch (error) {
    console.error('Error fetching available variables:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}