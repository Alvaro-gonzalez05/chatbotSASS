import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications'

// Webhook que recibe eventos de Supabase para procesar automatizaciones en tiempo real
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    console.log('🔔 Webhook received:', {
      type: payload.type,
      table: payload.table,
      record: payload.record?.id
    })

    // Verificar que el payload tiene la estructura correcta
    if (!payload.type || !payload.table || !payload.record) {
      console.error('❌ Invalid webhook payload:', payload)
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { type, table, record, old_record } = payload
    const supabase = createAdminClient()

    // Procesar diferentes tipos de eventos
    switch (table) {
      case 'clients':
        if (type === 'INSERT') {
          await handleNewClient(supabase, record)
        }
        break
        
      case 'orders':
        if (type === 'INSERT') {
          await handleNewOrder(supabase, record)
        } else if (type === 'UPDATE') {
          await handleOrderStatusChange(supabase, record, old_record)
        }
        break
        
      case 'reservations':
        if (type === 'INSERT') {
          await handleNewReservation(supabase, record)
        } else if (type === 'UPDATE') {
          await handleReservationStatusChange(supabase, record, old_record)
        }
        break
        
      case 'promotions':
        if (type === 'INSERT') {
          await handleNewPromotion(supabase, record)
        }
        break
        
      case 'automations':
        // Nuevo: manejar cuando se crea/activa una automatización de promoción
        if (type === 'INSERT' && record.trigger_type === 'new_promotion' && record.promotion) {
          // Esperar 5 segundos para permitir que la UI del cliente muestre la confirmación antes de iniciar el procesamiento pesado
          await new Promise(resolve => setTimeout(resolve, 5000))
          await handlePromotionAutomation(supabase, record)
        }
        break
        
      default:
        console.log(`ℹ️ Unhandled table: ${table}`)
    }

    return NextResponse.json({ success: true, processed: true })
    
  } catch (error) {
    console.error('💥 Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Manejar nuevo cliente registrado → Mensaje de bienvenida
async function handleNewClient(supabase: any, client: any) {
  console.log('👋 Processing new client welcome:', client.id)
  
  try {
    // Buscar automatizaciones de bienvenida activas para este usuario
    const { data: automations, error: automationsError } = await supabase
      .from('automations')
      .select('*, bots!inner(*)')
      .eq('user_id', client.user_id)
      .eq('trigger_type', 'welcome')
      .eq('is_active', true)
      .eq('bots.is_active', true)

    if (automationsError) {
      console.error('❌ Error fetching welcome automations:', automationsError)
      return
    }

    if (!automations || automations.length === 0) {
      console.log('ℹ️ No active welcome automations found for user:', client.user_id)
      return
    }

    // Procesar cada automatización de bienvenida
    for (const automation of automations) {
      const bot = automation.bots

      // Obtener configuración de timing para bienvenida
      const { data: config } = await supabase
        .from('automation_config')
        .select('welcome_delay_minutes')
        .eq('user_id', client.user_id)
        .single()

      const delayMinutes = config?.welcome_delay_minutes || 5

      // Programar mensaje de bienvenida
      const scheduledFor = new Date()
      scheduledFor.setMinutes(scheduledFor.getMinutes() + delayMinutes)

      // Generar mensaje personalizado
      let messageContent = automation.message_template
      messageContent = messageContent.replace('{nombre}', client.name || 'Cliente')
      
      // Obtener información del negocio si está disponible
      const { data: businessInfo } = await supabase
        .from('business_info')
        .select('name')
        .eq('user_id', client.user_id)
        .single()
      
      messageContent = messageContent.replace('{negocio}', businessInfo?.name || 'nuestro negocio')

      // Insertar en cola de mensajes programados
      const { data: scheduledMessage, error: scheduleError } = await supabase
        .from('scheduled_messages')
        .insert({
          user_id: client.user_id,
          automation_id: automation.id,
          client_id: client.id,
          bot_id: bot.id,
          message_content: messageContent,
          recipient_phone: client.phone,
          recipient_name: client.name,
          scheduled_for: scheduledFor.toISOString(),
          automation_type: 'welcome',
          priority: 4 // Prioridad media-alta para bienvenida
        })
        .select()
        .single()

      if (scheduleError) {
        console.error('❌ Error scheduling welcome message:', scheduleError)
        continue
      }

      // Log de la automatización
      await supabase
        .from('automation_logs')
        .insert({
          automation_id: automation.id,
          client_id: client.id,
          scheduled_message_id: scheduledMessage.id,
          log_type: 'queued',
          message_content: messageContent,
          recipient_phone: client.phone,
          success: true
        })

      console.log('✅ Welcome message scheduled for client:', {
        clientId: client.id,
        scheduledFor: scheduledFor.toISOString(),
        delayMinutes
      })
    }
    
  } catch (error) {
    console.error('💥 Error in handleNewPromotion:', error)
  }
}

// Nueva función: Manejar automatización de promoción cuando se crea/activa
async function handlePromotionAutomation(supabase: any, automationRecord: any) {
  console.log('🎁 Processing promotion automation:', automationRecord.id)
  
  try {
    const automation = automationRecord
    const promotion = automation.promotion // Datos de la promoción incluidos
    
    if (!promotion || !automation.is_active) {
      console.log('⚠️ Automation inactive or no promotion attached')
      return
    }

    // Obtener el bot
    const { data: bot } = await supabase
      .from('bots')
      .select('*')
      .eq('id', automation.bot_id)
      .eq('is_active', true)
      .single()

    if (!bot) {
      console.log('❌ Bot not found or inactive')
      return
    }

    // Obtener todos los clientes activos del usuario
    // Filtrar según la plataforma del bot
    let clientsQuery = supabase
      .from('clients')
      .select('*')
      .eq('user_id', automation.user_id)

    // Filtrar clientes según la plataforma del bot
    if (bot.platform === 'whatsapp') {
      clientsQuery = clientsQuery.not('phone', 'is', null)
    } else if (bot.platform === 'instagram') {
      clientsQuery = clientsQuery.not('instagram', 'is', null)
    } else if (bot.platform === 'gmail') {
      clientsQuery = clientsQuery.not('email', 'is', null)
    }

    const { data: clients, error: clientsError } = await clientsQuery

    if (clientsError || !clients || clients.length === 0) {
      console.log(`ℹ️ No active clients found for ${bot.platform} promotion broadcast`)
      return
    }

    console.log(`📢 Broadcasting to ${clients.length} clients for automation: ${automation.name}`)

    // Determinar timing de envío
    const sendImmediately = automation.trigger_config?.send_immediately !== false // Por defecto true
    const delayHours = automation.trigger_config?.delay_hours || 0

    let scheduledFor = new Date()
    if (!sendImmediately && delayHours > 0) {
      scheduledFor.setHours(scheduledFor.getHours() + delayHours)
    } else {
      // Envío inmediato con pequeño delay para evitar spam
      scheduledFor.setMinutes(scheduledFor.getMinutes() + 2)
    }


    // Obtener información del negocio una sola vez
    const { data: businessInfo } = await supabase
      .from('business_info')
      .select('name')
      .eq('user_id', automation.user_id)
      .single()
    
    const businessName = businessInfo?.name || 'nuestro negocio'

    // Arrays para inserción por lotes
    const messagesToInsert: any[] = []
    const logsToInsert: any[] = []

    // Programar mensaje para TODOS los clientes
    let messagesQueued = 0
    
    for (const client of clients) {
      try {
        // Generar mensaje personalizado
        let messageContent = automation.message_template
        messageContent = messageContent.replace(/\{nombre\}/g, client.name || 'Cliente')
        messageContent = messageContent.replace(/\{name\}/g, client.name || 'Cliente')
        messageContent = messageContent.replace(/\{client_name\}/g, client.name || 'Cliente')
        messageContent = messageContent.replace(/\{promocion\}/g, promotion.name)
        messageContent = messageContent.replace(/\{promotion_name\}/g, promotion.name)
        
        messageContent = messageContent.replace(/\{negocio\}/g, businessName)
        messageContent = messageContent.replace(/\{business_name\}/g, businessName)

        // Si la promoción tiene imagen, incluir referencia
        if (promotion.image_url) {
          messageContent += '\n\n📸 Ve la imagen de la promoción en nuestros canales.'
        }

        // Distribuir mensajes en el tiempo (evitar spam)
        // Reducido a 0.5 segundos entre mensajes para procesar 360 clientes en ~3 minutos
        const clientScheduledFor = new Date(scheduledFor)
        clientScheduledFor.setMilliseconds(clientScheduledFor.getMilliseconds() + (messagesQueued * 500)) 

        // Preparar metadata para plantilla de WhatsApp si corresponde
        let templateMetadata = {};
        if (bot.platform === 'whatsapp' && automation.template_variables?.meta_template_name) {
           const mapping = automation.template_variables.variable_mapping || {};
           const parameters = [];
           
           // Ordenar variables numéricas (var_1, var_2...)
           const sortedKeys = Object.keys(mapping).sort((a, b) => {
             const numA = parseInt(a.replace('var_', '')) || 0;
             const numB = parseInt(b.replace('var_', '')) || 0;
             return numA - numB;
           });

           for (const key of sortedKeys) {
             const fieldName = mapping[key];
             let value = '';
             
             // Resolver valor según el campo mapeado
             switch(fieldName) {
               case 'nombre':
               case 'nombre_cliente':
                 value = client.name || 'Cliente';
                 break;
               case 'email':
                 value = client.email || '';
                 break;
               case 'telefono':
                 value = client.phone || '';
                 break;
               case 'nombre_promocion':
                 value = promotion.name || '';
                 break;
               case 'descripcion_promocion':
                 value = promotion.description || '';
                 break;
               case 'fecha_inicio':
                 value = promotion.start_date ? new Date(promotion.start_date).toLocaleDateString() : '';
                 break;
               case 'fecha_fin':
                 value = promotion.end_date ? new Date(promotion.end_date).toLocaleDateString() : '';
                 break;
               default:
                 value = fieldName; // Fallback
             }
             
             parameters.push({
               type: "text",
               text: value
             });
           }
           
           templateMetadata = {
             is_meta_template: true,
             template_name: automation.template_variables.meta_template_name,
             template_language: automation.template_variables.meta_template_language || 'es',
             template_parameters: parameters
           };
        }

        // Preparar datos del mensaje
        const messageData: any = {
          user_id: automation.user_id,
          automation_id: automation.id,
          client_id: client.id,
          bot_id: bot.id,
          message_content: messageContent,
          recipient_name: client.name,
          scheduled_for: clientScheduledFor.toISOString(),
          automation_type: 'new_promotion',
          priority: 3, // Prioridad media para promociones
          metadata: {
            promotion_id: promotion.id,
            promotion_name: promotion.name,
            ...templateMetadata
          }
        }

        // Agregar el campo correcto según la plataforma
        if (bot.platform === 'whatsapp') {
          messageData.recipient_phone = client.phone
        } else if (bot.platform === 'instagram') {
          messageData.recipient_instagram_id = client.instagram // Instagram ID
        } else if (bot.platform === 'gmail') {
          messageData.recipient_email = client.email
        }

        messagesToInsert.push(messageData)

        // Preparar log
        const logData: any = {
          automation_id: automation.id,
          client_id: client.id,
          log_type: 'queued',
          message_content: messageContent,
          success: true,
          metadata: {
            promotion_id: promotion.id,
            broadcast_type: 'new_promotion',
            platform: bot.platform
          }
        }

        if (bot.platform === 'whatsapp') {
          logData.recipient_phone = client.phone
        } else if (bot.platform === 'instagram') {
          logData.recipient_phone = client.instagram
        } else if (bot.platform === 'gmail') {
          logData.recipient_phone = client.email
        }

        logsToInsert.push(logData)
        messagesQueued++

      } catch (clientError) {
        console.error(`💥 Error preparing client ${client.id} for automation:`, clientError)
      }
    }

    // Insertar en lotes de 100 para evitar timeouts y límites de payload
    const BATCH_SIZE = 100
    for (let i = 0; i < messagesToInsert.length; i += BATCH_SIZE) {
      const messageBatch = messagesToInsert.slice(i, i + BATCH_SIZE)
      const logBatch = logsToInsert.slice(i, i + BATCH_SIZE)
      
      const { error: scheduleError } = await supabase
        .from('scheduled_messages')
        .insert(messageBatch)

      if (scheduleError) {
        console.error(`❌ Error scheduling batch ${i/BATCH_SIZE + 1}:`, scheduleError)
      } else {
        // Solo insertar logs si los mensajes se programaron correctamente
        await supabase
          .from('automation_logs')
          .insert(logBatch)
      }
    }

    console.log(`✅ Promotion automation broadcast scheduled: ${automation.name} to ${messagesQueued} clients`)
    
    // Notificar que la promoción se ha programado
    await createNotification({
      userId: automation.user_id,
      title: "Automatización programada",
      message: `Se han programado ${messagesQueued} mensajes para la automatización "${automation.name}"`,
      type: "info",
      link: `/dashboard/automations`
    });
    
  } catch (error) {
    console.error('💥 Error in handlePromotionAutomation:', error)
  }
}

// Manejar nuevo pedido → Confirmación automática
async function handleNewOrder(supabase: any, order: any) {
  console.log('📦 Processing new order:', order.id)
  
  try {
    // Buscar automatizaciones de pedido activas
    const { data: automations, error: automationsError } = await supabase
      .from('automations')
      .select('*, bots!inner(*)')
      .eq('user_id', order.user_id)
      .eq('trigger_type', 'new_order') // Necesitaremos agregar este tipo
      .eq('is_active', true)
      .eq('bots.is_active', true)

    if (automationsError || !automations || automations.length === 0) {
      console.log('ℹ️ No active order automations found')
      return
    }

    // Procesar automatizaciones de confirmación de pedido
    for (const automation of automations) {
      // Programar mensaje inmediato de confirmación
      const scheduledFor = new Date()
      scheduledFor.setMinutes(scheduledFor.getMinutes() + 2) // 2 minutos de delay

      let messageContent = automation.message_template
      messageContent = messageContent.replace('{numero_pedido}', order.id.slice(0, 8))
      messageContent = messageContent.replace('{total}', `$${order.total_amount}`)

      await supabase
        .from('scheduled_messages')
        .insert({
          user_id: order.user_id,
          automation_id: automation.id,
          client_id: order.client_id,
          bot_id: automation.bots.id,
          message_content: messageContent,
          recipient_phone: order.delivery_phone || 'No disponible',
          recipient_name: order.customer_notes?.split(',')[0] || 'Cliente',
          scheduled_for: scheduledFor.toISOString(),
          automation_type: 'order_confirmation',
          priority: 2 // Alta prioridad para confirmaciones
        })

      console.log('✅ Order confirmation scheduled:', order.id)
    }
    
  } catch (error) {
    console.error('💥 Error in handleNewOrder:', error)
  }
}

// Manejar cambio de estado de pedido
async function handleOrderStatusChange(supabase: any, order: any, oldOrder: any) {
  console.log('📋 Processing order status change:', {
    orderId: order.id,
    oldStatus: oldOrder?.status,
    newStatus: order.status
  })

  // Si el pedido está listo
  if (order.status === 'ready' && oldOrder?.status !== 'ready') {
    // Programar notificación de "pedido listo"
    const scheduledFor = new Date()
    scheduledFor.setMinutes(scheduledFor.getMinutes() + 1)

    // Aquí iría la lógica similar para notificar que el pedido está listo
    console.log('🎉 Order ready notification would be scheduled')
  }
}

// Manejar nueva reserva
async function handleNewReservation(supabase: any, reservation: any) {
  console.log('📅 Processing new reservation:', reservation.id)
  
  // Programar recordatorio de reserva (24h antes)
  const reminderTime = new Date(reservation.reservation_date)
  reminderTime.setDate(reminderTime.getDate() - 1) // 1 día antes
  reminderTime.setHours(10, 0, 0, 0) // 10 AM

  // Solo programar si la fecha de recordatorio es futura
  if (reminderTime > new Date()) {
    console.log('⏰ Reservation reminder would be scheduled for:', reminderTime.toISOString())
  }
}

// Manejar cambio de estado de reserva
async function handleReservationStatusChange(supabase: any, reservation: any, oldReservation: any) {
  console.log('📋 Processing reservation status change:', {
    reservationId: reservation.id,
    oldStatus: oldReservation?.status,
    newStatus: reservation.status
  })

  // Si la reserva se confirma
  if (reservation.status === 'confirmed' && oldReservation?.status !== 'confirmed') {
    console.log('✅ Reservation confirmation would be sent')
  }
}

// Manejar nueva promoción → Difusión a todos los clientes del negocio
async function handleNewPromotion(supabase: any, promotion: any) {
  console.log('🎉 Processing new promotion broadcast:', promotion.id)
  
  try {
    // Buscar automatizaciones de nueva promoción activas para este usuario
    const { data: automations, error: automationsError } = await supabase
      .from('automations')
      .select('*, bots!inner(*)')
      .eq('user_id', promotion.user_id)
      .eq('trigger_type', 'new_promotion')
      .eq('is_active', true)
      .eq('bots.is_active', true)

    if (automationsError) {
      console.error('❌ Error fetching promotion automations:', automationsError)
      return
    }

    if (!automations || automations.length === 0) {
      console.log('ℹ️ No active promotion automations found for user:', promotion.user_id)
      return
    }

    // Obtener TODOS los clientes (activos e inactivos) de este usuario/negocio
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, phone, user_id')
      .eq('user_id', promotion.user_id)
      .not('phone', 'is', null)

    if (clientsError || !clients || clients.length === 0) {
      console.log('ℹ️ No active clients found for promotion broadcast')
      return
    }

    console.log(`📢 Broadcasting to ${clients.length} clients for promotion: ${promotion.name}`)

    // Procesar cada automatización de promoción
    for (const automation of automations) {
      const bot = automation.bots

      // Determinar timing de envío
      const sendImmediately = automation.trigger_config?.send_immediately || false
      const delayHours = automation.trigger_config?.delay_hours || 0

      let scheduledFor = new Date()
      if (!sendImmediately && delayHours > 0) {
        scheduledFor.setHours(scheduledFor.getHours() + delayHours)
      } else {
        // Envío inmediato con pequeño delay para evitar spam
        scheduledFor.setMinutes(scheduledFor.getMinutes() + 2)
      }

      // Programar mensaje para TODOS los clientes
      for (const client of clients) {
        try {
          // Generar mensaje personalizado
          let messageContent = automation.message_template
          messageContent = messageContent.replace('{nombre}', client.name || 'Cliente')
          messageContent = messageContent.replace('{promocion}', promotion.name)
          
          // Obtener información del negocio si está disponible
          const { data: businessInfo } = await supabase
            .from('business_info')
            .select('name')
            .eq('user_id', promotion.user_id)
            .single()
          
          messageContent = messageContent.replace('{negocio}', businessInfo?.name || 'nuestro negocio')

          // Si la promoción tiene imagen, incluir referencia
          if (promotion.image_url) {
            messageContent += '\n\n📸 Ve la imagen de la promoción en nuestros canales.'
          }

          // Insertar en cola de mensajes programados
          const { data: scheduledMessage, error: scheduleError } = await supabase
            .from('scheduled_messages')
            .insert({
              user_id: promotion.user_id,
              automation_id: automation.id,
              client_id: client.id,
              bot_id: bot.id,
              message_content: messageContent,
              recipient_phone: client.phone,
              recipient_name: client.name,
              scheduled_for: scheduledFor.toISOString(),
              automation_type: 'new_promotion',
              priority: 3, // Prioridad media para promociones
              metadata: {
                promotion_id: promotion.id,
                promotion_name: promotion.name
              }
            })
            .select()
            .single()

          if (scheduleError) {
            console.error(`❌ Error scheduling promotion message for client ${client.id}:`, scheduleError)
            continue
          }

          // Log de la automatización
          await supabase
            .from('automation_logs')
            .insert({
              automation_id: automation.id,
              client_id: client.id,
              scheduled_message_id: scheduledMessage.id,
              log_type: 'queued',
              message_content: messageContent,
              recipient_phone: client.phone,
              success: true,
              metadata: {
                promotion_id: promotion.id,
                broadcast_type: 'new_promotion'
              }
            })

        } catch (clientError) {
          console.error(`💥 Error processing client ${client.id} for promotion:`, clientError)
        }
      }

      console.log(`✅ Promotion broadcast scheduled: ${automation.name} to ${clients.length} clients`)
      
      // Notificar que la promoción se ha programado
      await createNotification({
        userId: promotion.user_id,
        title: "Promoción programada",
        message: `Se han programado ${clients.length} mensajes para la promoción "${promotion.name}"`,
        type: "info",
        link: `/dashboard/automations`
      });
    }
    
  } catch (error) {
    console.error('💥 Error in handleNewPromotion:', error)
  }
}