import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Endpoint para gestión de automatizaciones desde el dashboard
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = data.user.id

    // Obtener estadísticas de automatizaciones
    const [automationsResult, messagesResult, executionsResult] = await Promise.all([
      // Automatizaciones del usuario
      supabase
        .from('automations')
        .select(`
          *,
          bots!inner(id, name, platform)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // Mensajes en cola
      supabase
        .from('scheduled_messages')
        .select('status, automation_type, scheduled_for')
        .eq('user_id', userId)
        .gte('scheduled_for', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()), // Últimas 24 horas

      // Ejecuciones recientes
      supabase
        .from('automation_executions')
        .select('*, automations!inner(name, user_id)')
        .eq('automations.user_id', userId)
        .gte('execution_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('execution_date', { ascending: false })
    ])

    // Procesar estadísticas
    const automations = automationsResult.data || []
    const messages = messagesResult.data || []
    const executions = executionsResult.data || []

    const stats = {
      total_automations: automations.length,
      active_automations: automations.filter(a => a.is_active).length,
      pending_messages: messages.filter(m => m.status === 'pending').length,
      sent_today: messages.filter(m => 
        m.status === 'sent' && 
        new Date(m.scheduled_for).toDateString() === new Date().toDateString()
      ).length,
      recent_executions: executions.length
    }

    // Agrupar ejecuciones por tipo
    const executionsByType = executions.reduce((acc, exec) => {
      const type = exec.automation_type || 'unknown'
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(exec)
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        automations,
        stats,
        recent_executions: executionsByType
      }
    })

  } catch (error) {
    console.error('Error fetching automation data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Crear nueva automatización
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = data.user.id
    const automationData = await request.json()

    // Validar datos requeridos
    const requiredFields = ['name', 'trigger_type', 'message_template', 'bot_id']
    const missingFields = requiredFields.filter(field => !automationData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required fields',
        missing: missingFields
      }, { status: 400 })
    }

    // Verificar límites del plan del usuario
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('plan_type')
      .eq('id', userId)
      .single()

    const { data: existingAutomations } = await supabase
      .from('automations')
      .select('id')
      .eq('user_id', userId)

    const planLimits = {
      trial: { max_automations: 0 },
      basic: { max_automations: 1 },
      premium: { max_automations: 10 },
      enterprise: { max_automations: -1 } // unlimited
    }

    const planType = userProfile?.plan_type || 'trial'
    const maxAutomations = planLimits[planType as keyof typeof planLimits]?.max_automations || 0
    const currentCount = existingAutomations?.length || 0

    if (maxAutomations !== -1 && currentCount >= maxAutomations) {
      return NextResponse.json({
        error: 'Automation limit reached',
        current: currentCount,
        max: maxAutomations,
        plan: planType
      }, { status: 400 })
    }

    // Verificar que el bot pertenece al usuario
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id, is_active')
      .eq('id', automationData.bot_id)
      .eq('user_id', userId)
      .single()

    if (botError || !bot || !bot.is_active) {
      return NextResponse.json({
        error: 'Invalid or inactive bot'
      }, { status: 400 })
    }

    // Crear la automatización
    const { data: newAutomation, error: createError } = await supabase
      .from('automations')
      .insert({
        user_id: userId,
        name: automationData.name,
        trigger_type: automationData.trigger_type,
        trigger_config: automationData.trigger_config || {},
        message_template: automationData.message_template,
        bot_id: automationData.bot_id,
        is_active: automationData.is_active !== undefined ? automationData.is_active : true
      })
      .select(`
        *,
        bots!inner(id, name, platform)
      `)
      .single()

    if (createError) {
      console.error('Error creating automation:', createError)
      return NextResponse.json({
        error: 'Failed to create automation'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newAutomation
    })

  } catch (error) {
    console.error('Error creating automation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Actualizar automatización existente
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = data.user.id
    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({
        error: 'Automation ID is required'
      }, { status: 400 })
    }

    // Verificar que la automatización pertenece al usuario
    const { data: existingAutomation } = await supabase
      .from('automations')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!existingAutomation) {
      return NextResponse.json({
        error: 'Automation not found or access denied'
      }, { status: 404 })
    }

    // Si se está cambiando el bot, verificar que pertenece al usuario
    if (updateData.bot_id) {
      const { data: bot, error: botError } = await supabase
        .from('bots')
        .select('id, is_active')
        .eq('id', updateData.bot_id)
        .eq('user_id', userId)
        .single()

      if (botError || !bot || !bot.is_active) {
        return NextResponse.json({
          error: 'Invalid or inactive bot'
        }, { status: 400 })
      }
    }

    // Actualizar la automatización
    const { data: updatedAutomation, error: updateError } = await supabase
      .from('automations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        bots!inner(id, name, platform)
      `)
      .single()

    if (updateError) {
      console.error('Error updating automation:', updateError)
      return NextResponse.json({
        error: 'Failed to update automation'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedAutomation
    })

  } catch (error) {
    console.error('Error updating automation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Eliminar automatización
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = data.user.id
    const { searchParams } = new URL(request.url)
    const automationId = searchParams.get('id')

    if (!automationId) {
      return NextResponse.json({
        error: 'Automation ID is required'
      }, { status: 400 })
    }

    // Verificar que la automatización pertenece al usuario
    const { data: existingAutomation } = await supabase
      .from('automations')
      .select('id, name')
      .eq('id', automationId)
      .eq('user_id', userId)
      .single()

    if (!existingAutomation) {
      return NextResponse.json({
        error: 'Automation not found or access denied'
      }, { status: 404 })
    }

    // Eliminar mensajes programados relacionados
    await supabase
      .from('scheduled_messages')
      .delete()
      .eq('automation_id', automationId)
      .eq('status', 'pending')

    // Eliminar la automatización
    const { error: deleteError } = await supabase
      .from('automations')
      .delete()
      .eq('id', automationId)

    if (deleteError) {
      console.error('Error deleting automation:', deleteError)
      return NextResponse.json({
        error: 'Failed to delete automation'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Automation "${existingAutomation.name}" deleted successfully`
    })

  } catch (error) {
    console.error('Error deleting automation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}