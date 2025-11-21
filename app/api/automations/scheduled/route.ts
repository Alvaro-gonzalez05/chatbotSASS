import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Endpoint para procesar eventos programados (llamado por cron jobs)
// Maneja cumpleaños, clientes inactivos, etc.
export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()
    
    console.log('🕒 Processing scheduled automation:', type)
    
    const supabase = createAdminClient()

    switch (type) {
      case 'birthday.check':
        return await processBirthdayAutomations(supabase)
      
      case 'inactive_client.check':
        return await processInactiveClientAutomations(supabase)
        
      case 'promotion.broadcast':
        return await processPromotionBroadcasts(supabase)
        
      default:
        return NextResponse.json({ error: 'Unknown automation type' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('💥 Scheduled automation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Procesar automatizaciones de cumpleaños
async function processBirthdayAutomations(supabase: any) {
  console.log('🎂 Processing birthday automations...')
  
  try {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD
    
    // Verificar si ya se procesaron cumpleaños hoy
    // NOTA: Se ha deshabilitado esta verificación para permitir múltiples ejecuciones diarias
    /*
    const { data: existingExecution } = await supabase
      .from('automation_executions')
      .select('id')
      .eq('automation_type', 'birthday')
      .eq('execution_date', todayStr)
      .eq('status', 'completed')
    
    if (existingExecution && existingExecution.length > 0) {
      console.log('ℹ️ Birthday automations already processed today')
      return NextResponse.json({ message: 'Already processed today', processed: 0 })
    }
    */

    // Obtener automatizaciones de cumpleaños activas
    const { data: automations } = await supabase
      .from('automations')
      .select(`
        *,
        bots!inner(*)
      `)
      .eq('trigger_type', 'birthday')
      .eq('is_active', true)
      .eq('bots.is_active', true)

    if (!automations || automations.length === 0) {
      console.log('ℹ️ No active birthday automations found')
      return NextResponse.json({ message: 'No active automations', processed: 0 })
    }

    let totalProcessed = 0

    // Procesar cada automatización de cumpleaños
    for (const automation of automations) {
      const processed = await processSingleBirthdayAutomation(supabase, automation, today)
      totalProcessed += processed
    }

    console.log(`✅ Birthday processing completed. Total processed: ${totalProcessed}`)
    
    return NextResponse.json({
      success: true,
      processed: totalProcessed,
      message: 'Birthday automations processed successfully'
    })
    
  } catch (error) {
    console.error('💥 Birthday automation error:', error)
    return NextResponse.json({ error: 'Failed to process birthday automations' }, { status: 500 })
  }
}

async function processSingleBirthdayAutomation(supabase: any, automation: any, today: Date) {
  try {
    const daysBefore = automation.trigger_config?.days_before || 0
    
    // Calcular la fecha objetivo (cumpleaños - días antes)
    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + daysBefore)
    
    const targetMonth = targetDate.getMonth() + 1 // getMonth() es 0-indexed
    const targetDay = targetDate.getDate()
    
    // Buscar clientes con cumpleaños en la fecha objetivo
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', automation.user_id)
      .not('birthday', 'is', null)
    
    if (!clients || clients.length === 0) {
      console.log(`ℹ️ No clients with birth dates for automation: ${automation.id}`)
      return 0
    }

    // Filtrar clientes con cumpleaños en la fecha objetivo
    const birthdayClients = clients.filter((client: any) => {
      if (!client.birthday) return false
      
      // Solución robusta para zonas horarias: parsear el string YYYY-MM-DD directamente
      // Evita que new Date('2025-11-27') se convierta en '2025-11-26 21:00' en zonas UTC-3
      try {
        const [year, month, day] = client.birthday.split('-').map(Number)
        return month === targetMonth && day === targetDay
      } catch (e) {
        // Fallback por si el formato no es YYYY-MM-DD
        const birthDate = new Date(client.birthday)
        return birthDate.getMonth() + 1 === targetMonth && birthDate.getDate() === targetDay
      }
    })

    if (birthdayClients.length === 0) {
      console.log(`ℹ️ No clients with birthday on target date for automation: ${automation.id}`)
      return 0
    }

    // Crear registro de ejecución (usando upsert para permitir re-ejecuciones en el mismo día)
    const { data: execution, error: executionError } = await supabase
      .from('automation_executions')
      .upsert({
        automation_id: automation.id,
        execution_date: today.toISOString().split('T')[0],
        automation_type: 'birthday',
        total_eligible_clients: birthdayClients.length,
        status: 'processing',
        messages_queued: 0 // Resetear contador
      }, { onConflict: 'automation_id, execution_date' })
      .select()
      .single()

    if (executionError) {
      console.error('❌ Error creating execution record for birthday:', executionError)
    }

    let messagesQueued = 0
    const messagesToInsert: any[] = []

    // Programar mensaje para cada cliente
    for (const client of birthdayClients) {
      // Personalizar mensaje
      let messageContent = automation.message_template
      if (messageContent) {
        messageContent = messageContent.replace(/\{name\}/g, client.name || 'Cliente')
        messageContent = messageContent.replace(/\{first_name\}/g, client.name?.split(' ')[0] || 'Cliente')
      }

      // Programar para envío inmediato (distribuido en 30 mins)
      const scheduledFor = new Date()
      scheduledFor.setMinutes(scheduledFor.getMinutes() + Math.floor(Math.random() * 30)) 

      // Preparar metadata
      const metadata: any = {
        is_meta_template: automation.message_type === 'template',
        template_name: automation.meta_template_name,
        template_language: automation.meta_template_language,
      }

      const messageData: any = {
        user_id: automation.user_id,
        automation_id: automation.id,
        client_id: client.id,
        bot_id: automation.bots.id,
        message_content: messageContent,
        recipient_name: client.name,
        scheduled_for: scheduledFor.toISOString(),
        automation_type: 'birthday',
        priority: 3,
        metadata: metadata
      }

      // Agregar identificador según plataforma del bot
      const botPlatform = automation.bots.platform
      if (botPlatform === 'whatsapp' && client.phone) {
        messageData.recipient_phone = client.phone
        messageData.platform = 'whatsapp'
      } else if (botPlatform === 'instagram' && client.instagram) {
        messageData.recipient_instagram_id = client.instagram
      } else if (botPlatform === 'gmail' && client.email) {
        messageData.recipient_email = client.email
        messageData.platform = 'email'
      } else {
        // Si el cliente no tiene el campo necesario para la plataforma, saltar
        console.log(`⚠️ Client ${client.id} doesn't have contact info for ${botPlatform}`)
        continue
      }

      messagesToInsert.push(messageData)
    }

    // Insertar en lotes (Bulk Insert)
    const BATCH_SIZE = 100
    for (let i = 0; i < messagesToInsert.length; i += BATCH_SIZE) {
      const batch = messagesToInsert.slice(i, i + BATCH_SIZE)
      const { error: insertError } = await supabase
        .from('scheduled_messages')
        .insert(batch)

      if (insertError) {
        console.error(`❌ Error scheduling batch of birthday messages (start index ${i}):`, insertError)
      } else {
        messagesQueued += batch.length
      }
    }

    // Actualizar registro de ejecución
    if (execution) {
      await supabase
        .from('automation_executions')
        .update({
          status: 'completed',
          clients_processed: birthdayClients.length,
          messages_queued: messagesQueued,
          completed_at: new Date().toISOString()
        })
        .eq('id', execution.id)
    }

    console.log(`✅ Birthday automation processed: ${automation.name} - ${messagesQueued} messages queued`)
    
    return messagesQueued

  } catch (error) {
    console.error(`💥 Error processing birthday automation ${automation.id}:`, error)
    return 0
  }
}

// Procesar automatizaciones de clientes inactivos
async function processInactiveClientAutomations(supabase: any) {
  console.log('😴 Processing inactive client automations...')
  
  try {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    // Verificar si ya se procesaron hoy
    // NOTA: Se ha deshabilitado esta verificación para permitir múltiples ejecuciones diarias si es necesario
    /*
    const { data: existingExecution } = await supabase
      .from('automation_executions')
      .select('id')
      .eq('automation_type', 'inactive_client')
      .eq('execution_date', todayStr)
      .eq('status', 'completed')
    
    if (existingExecution && existingExecution.length > 0) {
      console.log('ℹ️ Inactive client automations already processed today')
      return NextResponse.json({ message: 'Already processed today', processed: 0 })
    }
    */

    // Obtener automatizaciones de clientes inactivos activas
    const { data: automations } = await supabase
      .from('automations')
      .select(`
        *,
        bots!inner(*)
      `)
      .eq('trigger_type', 'inactive_client')
      .eq('is_active', true)
      .eq('bots.is_active', true)

    if (!automations || automations.length === 0) {
      console.log('ℹ️ No active inactive client automations found')
      return NextResponse.json({ message: 'No active automations', processed: 0 })
    }

    let totalProcessed = 0

    // Procesar cada automatización
    for (const automation of automations) {
      const processed = await processSingleInactiveClientAutomation(supabase, automation, today)
      totalProcessed += processed
    }

    console.log(`✅ Inactive client processing completed. Total processed: ${totalProcessed}`)
    
    return NextResponse.json({
      success: true,
      processed: totalProcessed,
      message: 'Inactive client automations processed successfully'
    })
    
  } catch (error) {
    console.error('💥 Inactive client automation error:', error)
    return NextResponse.json({ error: 'Failed to process inactive client automations' }, { status: 500 })
  }
}

async function processSingleInactiveClientAutomation(supabase: any, automation: any, today: Date) {
  try {
    const inactiveDays = automation.trigger_config?.inactive_days || 30
    
    // Calcular fecha límite de actividad
    const cutoffDate = new Date(today)
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays)
    
    console.log(`🔍 Checking for clients inactive since: ${cutoffDate.toISOString()} (Days: ${inactiveDays})`)

    // Buscar clientes inactivos:
    // 1. Tienen last_interaction_at antigua (menor al cutoff)
    // 2. O NO tienen last_interaction_at (nunca interactuaron)
    const { data: potentialInactiveClients } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', automation.user_id)
      .or(`last_interaction_at.is.null,last_interaction_at.lt.${cutoffDate.toISOString()}`)
    
    console.log(`DEBUG: Potential clients found in DB query: ${potentialInactiveClients?.length || 0}`)

    if (!potentialInactiveClients || potentialInactiveClients.length === 0) {
      console.log(`ℹ️ No inactive clients found for automation: ${automation.id}`)
      return 0
    }

    // Filtrar falsos positivos (clientes nuevos creados recientemente que aún no tienen interacción)
    const inactiveClients = potentialInactiveClients.filter((client: any) => {
      // Si tiene fecha de interacción, la query ya garantizó que es antigua (< cutoff)
      if (client.last_interaction_at) return true
      
      // Si NO tiene fecha de interacción (es NULL), verificamos cuándo se creó
      // Si se creó hace poco (después del cutoff), es un cliente NUEVO, no inactivo.
      // Si se creó hace mucho (antes del cutoff), es un cliente que nunca interactuó -> INACTIVO.
      const createdAt = new Date(client.created_at)
      const isOldEnough = createdAt < cutoffDate
      
      if (!isOldEnough) {
         // Solo loguear los primeros 5 para no saturar
         // console.log(`DEBUG: Client ${client.id} skipped (Too new). Created: ${createdAt.toISOString()}, Cutoff: ${cutoffDate.toISOString()}`)
      }
      
      return isOldEnough
    })

    console.log(`DEBUG: Clients after 'New Client' filter: ${inactiveClients.length}`)

    if (inactiveClients.length === 0) {
      console.log(`ℹ️ No truly inactive clients found (all nulls were new clients)`)
      return 0
    }

    console.log(`👥 Found ${inactiveClients.length} truly inactive clients`)

    // Crear registro de ejecución (usando upsert para permitir re-ejecuciones en el mismo día)
    const { data: execution, error: executionError } = await supabase
      .from('automation_executions')
      .upsert({
        automation_id: automation.id,
        execution_date: today.toISOString().split('T')[0],
        automation_type: 'inactive_client',
        total_eligible_clients: inactiveClients.length,
        status: 'processing',
        messages_queued: 0 // Resetear contador si se re-ejecuta
      }, { onConflict: 'automation_id, execution_date' })
      .select()
      .single()

    if (executionError) {
      console.error('❌ Error creating execution record:', executionError)
      // Continuamos aunque falle el registro de ejecución, pero no podremos actualizarlo al final
    }

    let messagesQueued = 0

    // Programar mensaje para cada cliente inactivo
    const messagesToInsert: any[] = []

    for (const client of inactiveClients) {
      // Verificar si ya se le envió mensaje recientemente (para evitar spam si el cron corre varias veces o si la lógica falla)
      // Esto es opcional pero recomendado. Por ahora confiamos en automation_executions para el día.

      // Personalizar mensaje (si es texto simple)
      // Si es template, se maneja diferente en el envío, pero aquí preparamos el contenido base
      let messageContent = automation.message_template || ''
      if (messageContent) {
        messageContent = messageContent.replace(/\{name\}/g, client.name || 'Cliente')
        messageContent = messageContent.replace(/\{first_name\}/g, client.name?.split(' ')[0] || 'Cliente')
      }

      // Programar para envío distribuido
      const scheduledFor = new Date()
      scheduledFor.setHours(scheduledFor.getHours() + Math.floor(Math.random() * 8) + 1) // Distribuir en las próximas 8 horas

      // Preparar metadata para templates
      const metadata: any = {
        is_meta_template: automation.message_type === 'template',
        template_name: automation.meta_template_name,
        template_language: automation.meta_template_language,
        // Mapear variables si es necesario (esto requeriría lógica más compleja similar al broadcast)
        // Por simplicidad, asumimos que si es template, el usuario configuró variables estáticas o simples
      }

      // Verificar que automation.bots existe
      if (!automation.bots) {
        console.error(`❌ Automation ${automation.id} has no bot assigned`)
        continue
      }

      const messageData: any = {
        user_id: automation.user_id,
        automation_id: automation.id,
        client_id: client.id,
        bot_id: automation.bots.id,
        message_content: messageContent, // Texto fallback o contenido
        recipient_name: client.name,
        scheduled_for: scheduledFor.toISOString(),
        automation_type: 'inactive_client',
        priority: 4,
        metadata: metadata
      }

      // Agregar identificador según plataforma del bot
      const botPlatform = automation.bots.platform
      
      if (botPlatform === 'whatsapp') {
        messageData.recipient_phone = client.phone
        messageData.platform = 'whatsapp'
      } else if (botPlatform === 'instagram') {
        messageData.recipient_instagram_id = client.instagram
        messageData.platform = 'instagram'
      } else if (botPlatform === 'email') {
        messageData.recipient_email = client.email
        messageData.platform = 'email'
      }

      // Validar que tenga destino
      if (!messageData.recipient_phone && !messageData.recipient_instagram_id && !messageData.recipient_email) {
        console.warn(`⚠️ Client ${client.id} has no contact info for platform ${botPlatform}`)
        continue
      }

      messagesToInsert.push(messageData)
    }

    // Insertar en lotes para optimizar rendimiento (Bulk Insert)
    const BATCH_SIZE = 100
    for (let i = 0; i < messagesToInsert.length; i += BATCH_SIZE) {
      const batch = messagesToInsert.slice(i, i + BATCH_SIZE)
      const { error: insertError } = await supabase
        .from('scheduled_messages')
        .insert(batch)

      if (insertError) {
        console.error(`❌ Error scheduling batch of messages (start index ${i}):`, insertError)
      } else {
        messagesQueued += batch.length
      }
    }

    // Actualizar ejecución si existe
    if (execution) {
      await supabase
        .from('automation_executions')
        .update({
          status: 'completed',
          messages_queued: messagesQueued,
          completed_at: new Date().toISOString()
        })
        .eq('id', execution.id)
    }

    console.log(`✅ Inactive client automation processed: ${automation.name} - ${messagesQueued} messages queued`)
    
    return messagesQueued

  } catch (error) {
    console.error(`💥 Error processing inactive client automation ${automation.id}:`, error)
    return 0
  }
}

// Procesar difusión de promociones
async function processPromotionBroadcasts(supabase: any) {
  console.log('🎉 Processing promotion broadcasts...')
  
  try {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD
    
    // Verificar si ya se procesaron promociones hoy
    const { data: existingExecution } = await supabase
      .from('automation_executions')
      .select('id')
      .eq('automation_type', 'promotion_broadcast')
      .eq('execution_date', todayStr)
      .limit(1)

    if (existingExecution && existingExecution.length > 0) {
      console.log('ℹ️ Promotion broadcasts already processed today')
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'Already processed today',
        date: todayStr
      })
    }

    // Buscar promociones nuevas que necesiten difusión programada
    // Esto es para promociones con configuración de delay, no inmediatas
    const { data: promotionsToProcess, error: promotionsError } = await supabase
      .from('promotions')
      .select(`
        *,
        automations!inner(*)
      `)
      .eq('is_active', true)
      .eq('automations.trigger_type', 'new_promotion')
      .eq('automations.is_active', true)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24 horas
      
    if (promotionsError) {
      console.error('❌ Error fetching promotions for processing:', promotionsError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    let processedCount = 0

    if (promotionsToProcess && promotionsToProcess.length > 0) {
      console.log(`📢 Found ${promotionsToProcess.length} promotions to potentially broadcast`)
      
      // Este endpoint se usa principalmente para verificar mensajes pendientes
      // La lógica principal está en el webhook que se dispara inmediatamente
      processedCount = promotionsToProcess.length
    }

    // Registrar la ejecución
    await supabase
      .from('automation_executions')
      .insert({
        automation_type: 'promotion_broadcast',
        execution_date: todayStr,
        processed_count: processedCount,
        executed_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      processed: processedCount,
      message: `Processed ${processedCount} promotion broadcasts`,
      date: todayStr
    })

  } catch (error) {
    console.error('💥 Promotion broadcast processing error:', error)
    return NextResponse.json(
      { error: 'Processing error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Endpoint GET para verificar el estado del sistema
export async function GET() {
  try {
    const supabase = createAdminClient()
    
    const today = new Date().toISOString().split('T')[0]
    
    // Obtener estadísticas de ejecuciones de hoy
    const { data: todayExecutions } = await supabase
      .from('automation_executions')
      .select('*')
      .eq('execution_date', today)
    
    // Obtener mensajes pendientes
    const { data: pendingMessages } = await supabase
      .from('scheduled_messages')
      .select('status')
      .eq('status', 'pending')
    
    return NextResponse.json({
      date: today,
      executions_today: todayExecutions?.length || 0,
      pending_messages: pendingMessages?.length || 0,
      last_check: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}