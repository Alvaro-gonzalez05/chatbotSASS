import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Endpoint para testing manual de automatizaciones
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = data.user.id
    const { automation_id, test_phone, test_name } = await request.json()

    if (!automation_id) {
      return NextResponse.json({
        error: 'Automation ID is required'
      }, { status: 400 })
    }

    // Obtener la automatización
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select(`
        *,
        bots!inner(id, name, platform)
      `)
      .eq('id', automation_id)
      .eq('user_id', userId)
      .single()

    if (automationError || !automation) {
      return NextResponse.json({
        error: 'Automation not found or access denied'
      }, { status: 404 })
    }

    // Verificar que el bot está activo
    if (!automation.bots.id) {
      return NextResponse.json({
        error: 'No active bot associated with this automation'
      }, { status: 400 })
    }

    // Personalizar mensaje de prueba
    let testMessage = automation.message_template
    const testClientName = test_name || 'Cliente de Prueba'
    const testClientPhone = test_phone || '+1234567890'

    testMessage = testMessage.replace(/\{name\}/g, testClientName)
    testMessage = testMessage.replace(/\{first_name\}/g, testClientName.split(' ')[0])
    testMessage = testMessage.replace(/\{phone\}/g, testClientPhone)

    // Agregar prefijo de prueba
    testMessage = `🧪 MENSAJE DE PRUEBA 🧪\n\n${testMessage}\n\n---\nEste es un mensaje de prueba de la automatización: "${automation.name}"`

    // Programar mensaje de prueba para envío inmediato
    const scheduledFor = new Date()
    scheduledFor.setMinutes(scheduledFor.getMinutes() + 1) // 1 minuto en el futuro

    const { data: testMessage_data, error: scheduleError } = await supabase
      .from('scheduled_messages')
      .insert({
        user_id: userId,
        automation_id: automation.id,
        bot_id: automation.bots.id,
        message_content: testMessage,
        recipient_phone: testClientPhone,
        recipient_name: testClientName,
        scheduled_for: scheduledFor.toISOString(),
        automation_type: `${automation.trigger_type}_test`,
        priority: 1 // Alta prioridad para pruebas
      })
      .select()
      .single()

    if (scheduleError) {
      console.error('Error scheduling test message:', scheduleError)
      return NextResponse.json({
        error: 'Failed to schedule test message'
      }, { status: 500 })
    }

    // Registrar en logs
    await supabase
      .from('automation_logs')
      .insert({
        automation_id: automation.id,
        log_type: 'queued',
        message_content: testMessage,
        recipient_phone: testClientPhone,
        success: true,
        scheduled_message_id: testMessage_data.id
      })

    return NextResponse.json({
      success: true,
      message: 'Test message scheduled successfully',
      data: {
        scheduled_message_id: testMessage_data.id,
        scheduled_for: scheduledFor.toISOString(),
        test_message: testMessage,
        automation_name: automation.name,
        bot_name: automation.bots.name
      }
    })

  } catch (error) {
    console.error('Error in automation test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Obtener estadísticas de testing
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = data.user.id
    const { searchParams } = new URL(request.url)
    const automationId = searchParams.get('automation_id')

    let query = supabase
      .from('scheduled_messages')
      .select(`
        *,
        automations!inner(name)
      `)
      .eq('user_id', userId)
      .like('automation_type', '%_test')
      .order('created_at', { ascending: false })
      .limit(10)

    if (automationId) {
      query = query.eq('automation_id', automationId)
    }

    const { data: testMessages, error: queryError } = await query

    if (queryError) {
      console.error('Error fetching test messages:', queryError)
      return NextResponse.json({
        error: 'Failed to fetch test messages'
      }, { status: 500 })
    }

    // Obtener estadísticas de logs de automatización
    const { data: logs } = await supabase
      .from('automation_logs')
      .select('log_type, success, execution_time')
      .eq('automations.user_id', userId)
      .gte('execution_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24 horas
      .limit(50)

    const stats = {
      total_test_messages: testMessages?.length || 0,
      pending_tests: testMessages?.filter(m => m.status === 'pending').length || 0,
      sent_tests: testMessages?.filter(m => m.status === 'sent').length || 0,
      failed_tests: testMessages?.filter(m => m.status === 'failed').length || 0,
      recent_logs: logs || []
    }

    return NextResponse.json({
      success: true,
      data: {
        test_messages: testMessages || [],
        stats
      }
    })

  } catch (error) {
    console.error('Error fetching test data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}