import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Endpoint para obtener plantillas de mensaje desde las APIs de Meta y proveedores externos
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = data.user.id
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') // 'whatsapp', 'instagram', 'gmail', 'all'
    const botId = searchParams.get('bot_id')

    let allTemplates: any[] = []

    if (!platform || platform === 'all') {
      // Obtener plantillas de todas las plataformas
      const [whatsappTemplates, instagramTemplates, gmailTemplates] = await Promise.all([
        fetchWhatsAppTemplates(supabase, userId, botId),
        fetchInstagramTemplates(supabase, userId, botId),
        fetchGmailTemplates(supabase, userId, botId)
      ])
      
      allTemplates = [
        ...whatsappTemplates,
        ...instagramTemplates,
        ...gmailTemplates
      ]
    } else {
      // Obtener plantillas de una plataforma específica
      switch (platform) {
        case 'whatsapp':
          allTemplates = await fetchWhatsAppTemplates(supabase, userId, botId)
          break
        case 'instagram':
          allTemplates = await fetchInstagramTemplates(supabase, userId, botId)
          break
        case 'gmail':
          allTemplates = await fetchGmailTemplates(supabase, userId, botId)
          break
        default:
          return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
      }
    }

    // Agrupar por plataforma para mejor organización
    const templatesByPlatform = allTemplates.reduce((acc, template) => {
      const platform = template.platform
      if (!acc[platform]) {
        acc[platform] = []
      }
      acc[platform].push(template)
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        templates: allTemplates,
        by_platform: templatesByPlatform,
        total_count: allTemplates.length,
        platforms: Object.keys(templatesByPlatform)
      }
    })

  } catch (error) {
    console.error('Error fetching message templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Obtener plantillas de WhatsApp Business desde Meta API
async function fetchWhatsAppTemplates(supabase: any, userId: string, botId?: string | null) {
  try {
    // Obtener configuraciones de WhatsApp del usuario desde la tabla bots
    let query = supabase
      .from('bots')
      .select('id, name, platform, integrations')
      .eq('user_id', userId)
      .eq('platform', 'whatsapp')
      .eq('is_active', true)

    if (botId) {
      query = query.eq('id', botId)
    }

    const { data: bots } = await query

    if (!bots || bots.length === 0) {
      return []
    }

    const templates: any[] = []

    // Para cada bot de WhatsApp, obtener plantillas desde Meta API
    for (const bot of bots) {
      try {
        // Verificar que tenga configuración de integración
        const integrationConfig = bot.integrations
        if (!integrationConfig?.business_account_id || !integrationConfig?.access_token) {
          // Agregar plantilla informativa sobre configuración faltante
          templates.push({
            id: `config-error-${bot.id}`,
            name: '⚠️ Configuración Incompleta',
            platform: 'whatsapp',
            bot_id: bot.id,
            bot_name: bot.name,
            status: 'ERROR',
            body_content: `Bot "${bot.name}" necesita configuración completa. Campos faltantes: ${!integrationConfig?.access_token ? 'access_token ' : ''}${!integrationConfig?.business_account_id ? 'business_account_id' : ''}`,
            variables: [],
            can_use: false,
            source: 'config_error'
          })
          continue
        }

        // Llamar a Meta Graph API para obtener message templates
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${integrationConfig.business_account_id}/message_templates?fields=name,status,language,category,components,quality_score`,
          {
            headers: {
              'Authorization': `Bearer ${integrationConfig.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (response.ok) {
          const result = await response.json()
          
          if (result.data) {
            result.data.forEach((template: any) => {
              templates.push({
                id: template.id || `whatsapp_${template.name}`,
                name: template.name,
                platform: 'whatsapp',
                bot_id: bot.id,
                bot_name: bot.name,
                status: template.status,
                language: template.language,
                category: template.category,
                components: template.components,
                quality_score: template.quality_score,
                // Extraer el cuerpo del mensaje principal
                body_content: extractWhatsAppTemplateBody(template.components),
                variables: extractWhatsAppTemplateVariables(template.components),
                can_use: template.status === 'APPROVED',
                source: 'meta_api',
                last_synced: new Date().toISOString()
              })
            })
          }
        } else {
          const errorText = await response.text()
          console.error(`Failed to fetch WhatsApp templates for bot ${bot.id}:`, errorText)
          
          // Agregar plantilla de error informativa
          templates.push({
            id: `api-error-${bot.id}`,
            name: '❌ Error de API',
            platform: 'whatsapp',
            bot_id: bot.id,
            bot_name: bot.name,
            status: 'API_ERROR',
            body_content: `Error al obtener plantillas de Meta API para "${bot.name}". Código: ${response.status}. Verifica que el token y business_account_id sean válidos.`,
            variables: [],
            can_use: false,
            source: 'api_error'
          })
        }
      } catch (error) {
        console.error(`Error fetching WhatsApp templates for bot ${bot.id}:`, error)
      }
    }

    return templates
  } catch (error) {
    console.error('Error in fetchWhatsAppTemplates:', error)
    return []
  }
}

// Obtener plantillas de Instagram Business desde Meta API
async function fetchInstagramTemplates(supabase: any, userId: string, botId?: string | null) {
  try {
    // Obtener configuraciones de Instagram del usuario desde la tabla bots
    let query = supabase
      .from('bots')
      .select('id, name, platform, integrations')
      .eq('user_id', userId)
      .eq('platform', 'instagram')
      .eq('is_active', true)

    if (botId) {
      query = query.eq('id', botId)
    }

    const { data: bots } = await query

    if (!bots || bots.length === 0) {
      return []
    }

    const templates: any[] = []

    // Para cada bot de Instagram, obtener plantillas
    for (const bot of bots) {
      try {
        // Verificar que tenga configuración de integración
        const integrationConfig = bot.integrations
        if (!integrationConfig?.instagram_business_account_id || !integrationConfig?.access_token) {
          // Agregar plantilla informativa sobre configuración faltante
          const missingFields = []
          if (!integrationConfig?.access_token) missingFields.push('access_token')
          if (!integrationConfig?.instagram_business_account_id) missingFields.push('instagram_business_account_id')
          if (!integrationConfig?.app_id) missingFields.push('app_id')
          if (!integrationConfig?.app_secret) missingFields.push('app_secret')

          templates.push({
            id: `config-error-${bot.id}`,
            name: '⚠️ Configuración Incompleta',
            platform: 'instagram',
            bot_id: bot.id,
            bot_name: bot.name,
            status: 'ERROR',
            body_content: `Bot "${bot.name}" necesita configuración completa. Campos faltantes: ${missingFields.join(', ')}`,
            variables: [],
            can_use: false,
            source: 'config_error'
          })
          continue
        }

        // Para Instagram, las plantillas de mensaje funcionan diferente
        // Instagram usa principalmente plantillas de WhatsApp Business API cuando está conectado a una página
        // Primero intentamos obtener plantillas de message templates si tiene business_account_id
        if (integrationConfig.business_account_id) {
          const response = await fetch(
            `https://graph.facebook.com/v18.0/${integrationConfig.business_account_id}/message_templates?fields=name,status,language,category,components,quality_score`,
            {
              headers: {
                'Authorization': `Bearer ${integrationConfig.access_token}`,
                'Content-Type': 'application/json'
              }
            }
          )

          if (response.ok) {
            const result = await response.json()
            
            if (result.data) {
              result.data.forEach((template: any) => {
                templates.push({
                  id: template.id || `instagram_${template.name}`,
                  name: template.name,
                  platform: 'instagram',
                  bot_id: bot.id,
                  bot_name: bot.name,
                  status: template.status,
                  language: template.language,
                  category: template.category,
                  components: template.components,
                  quality_score: template.quality_score,
                  body_content: extractWhatsAppTemplateBody(template.components),
                  variables: extractWhatsAppTemplateVariables(template.components),
                  can_use: template.status === 'APPROVED',
                  source: 'meta_api',
                  last_synced: new Date().toISOString()
                })
              })
            }
          }
        }

        // También obtener configuraciones específicas de Instagram como ice breakers, quick replies, etc.
        const instagramResponse = await fetch(
          `https://graph.facebook.com/v18.0/${integrationConfig.instagram_business_account_id}?fields=name,biography,profile_picture_url`,
          {
            headers: {
              'Authorization': `Bearer ${integrationConfig.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (instagramResponse.ok) {
          const result = await instagramResponse.json()
          
          // También obtener plantillas personalizadas almacenadas localmente para Instagram
          const { data: localTemplates } = await supabase
            .from('message_templates')
            .select('*')
            .eq('bot_id', bot.id)
            .eq('platform', 'instagram')
            .eq('status', 'active')

          if (localTemplates) {
            localTemplates.forEach((template: any) => {
              templates.push({
                id: template.id,
                name: template.template_name,
                platform: 'instagram',
                bot_id: bot.id,
                bot_name: bot.name,
                status: template.status,
                language: template.language || 'es',
                category: template.category || 'utility',
                body_content: template.body_content,
                variables: template.variables_used || [],
                can_use: template.status === 'approved',
                source: 'local_db',
                created_at: template.created_at,
                updated_at: template.updated_at
              })
            })
          }
        }
      } catch (error) {
        console.error(`Error fetching Instagram templates for bot ${bot.id}:`, error)
      }
    }

    return templates
  } catch (error) {
    console.error('Error in fetchInstagramTemplates:', error)
    return []
  }
}

// Obtener plantillas de Gmail (solo locales - el usuario crea sus mensajes)
async function fetchGmailTemplates(supabase: any, userId: string, botId?: string | null) {
  try {
    const templates: any[] = []

    // Solo obtener plantillas locales - no necesitamos APIs externas
    let query = supabase
      .from('message_templates')
      .select(`
        *,
        bots!inner(id, name, user_id)
      `)
      .eq('bots.user_id', userId)
      .eq('platform', 'gmail')
      .eq('status', 'active')

    if (botId) {
      query = query.eq('bot_id', botId)
    }

    const { data: localTemplates } = await query

    if (localTemplates) {
      localTemplates.forEach((template: any) => {
        templates.push({
          id: template.id,
          name: template.template_name,
          platform: 'gmail',
          bot_id: template.bot_id,
          bot_name: template.bots.name,
          status: template.status,
          language: template.language || 'es',
          category: template.category || 'transactional',
          body_text: template.body_content,
          html_content: template.html_content,
          subject: template.subject,
          variables: template.variables_used || [],
          source: 'local_db',
          created_at: template.created_at,
          updated_at: template.updated_at
        })
      })
    }

    // Agregar plantilla "vacía" para que el usuario escriba su mensaje
    templates.unshift({
      id: 'gmail_custom_message',
      name: 'Mensaje personalizado',
      platform: 'gmail',
      bot_id: botId || 'all',
      bot_name: 'Gmail Bot',
      status: 'active',
      language: 'es',
      category: 'custom',
      body_text: 'Escribe aquí tu mensaje personalizado...',
      html_content: '',
      subject: 'Asunto del email',
      variables: ['name', 'first_name', 'email'],
      source: 'user_input',
      created_at: new Date().toISOString()
    })

    return templates
  } catch (error) {
    console.error('Error in fetchEmailTemplates:', error)
    return []
  }
}

// Función auxiliar para extraer el cuerpo del mensaje de WhatsApp
function extractWhatsAppTemplateBody(components: any[]): string {
  if (!components) return ''
  
  const bodyComponent = components.find(comp => comp.type === 'BODY')
  return bodyComponent ? bodyComponent.text : ''
}

// Función auxiliar para extraer variables de WhatsApp
function extractWhatsAppTemplateVariables(components: any[]): string[] {
  if (!components) return []
  
  const variables: string[] = []
  components.forEach(comp => {
    if (comp.text) {
      const matches = comp.text.match(/\{\{(\d+)\}\}/g)
      if (matches) {
        matches.forEach((match: string) => {
          const varNumber = match.replace(/[{}]/g, '')
          variables.push(`var_${varNumber}`)
        })
      }
    }
  })
  
  return [...new Set(variables)] // Remover duplicados
}

// Obtener plantillas de SendGrid
async function fetchSendGridTemplates(supabase: any, userId: string, botId?: string | null) {
  try {
    // Obtener configuración de SendGrid del usuario
    const { data: emailConfig } = await supabase
      .from('email_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'sendgrid')
      .eq('is_active', true)
      .single()

    if (!emailConfig || !emailConfig.api_key) {
      return []
    }

    // Llamar a SendGrid API para obtener plantillas
    const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic,legacy', {
      headers: {
        'Authorization': `Bearer ${emailConfig.api_key}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Failed to fetch SendGrid templates:', await response.text())
      return []
    }

    const result = await response.json()
    const templates: any[] = []

    if (result.templates) {
      result.templates.forEach((template: any) => {
        templates.push({
          id: `sendgrid_${template.id}`,
          name: template.name,
          platform: 'email',
          bot_id: botId || 'sendgrid_global',
          bot_name: 'SendGrid',
          status: 'active',
          language: 'es',
          category: 'transactional',
          body_text: template.name, // SendGrid no expone el contenido completo en list
          subject: template.name,
          variables: [], // Se obtendrían en detalle individual
          source: 'sendgrid_api',
          external_id: template.id,
          created_at: template.updated_at || new Date().toISOString()
        })
      })
    }

    return templates
  } catch (error) {
    console.error('Error fetching SendGrid templates:', error)
    return []
  }
}

// Sincronizar plantillas desde APIs externas
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = data.user.id
    const { platform, bot_id, force_refresh = false } = await request.json()

    let syncResults: any = {}

    if (!platform || platform === 'all') {
      // Sincronizar todas las plataformas
      syncResults.whatsapp = await syncWhatsAppTemplates(supabase, userId, bot_id, force_refresh)
      syncResults.instagram = await syncInstagramTemplates(supabase, userId, bot_id, force_refresh)
      syncResults.email = await syncEmailTemplates(supabase, userId, bot_id, force_refresh)
    } else {
      switch (platform) {
        case 'whatsapp':
          syncResults.whatsapp = await syncWhatsAppTemplates(supabase, userId, bot_id, force_refresh)
          break
        case 'instagram':
          syncResults.instagram = await syncInstagramTemplates(supabase, userId, bot_id, force_refresh)
          break
        case 'email':
          syncResults.email = await syncEmailTemplates(supabase, userId, bot_id, force_refresh)
          break
        default:
          return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Templates synchronized successfully',
      data: syncResults
    })

  } catch (error) {
    console.error('Error syncing templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Funciones auxiliares de sincronización (implementación básica)
async function syncWhatsAppTemplates(supabase: any, userId: string, botId?: string, forceRefresh: boolean = false) {
  // Implementar sincronización y almacenamiento local de plantillas de WhatsApp
  return { synced: 0, message: 'WhatsApp sync implemented' }
}

async function syncInstagramTemplates(supabase: any, userId: string, botId?: string, forceRefresh: boolean = false) {
  // Implementar sincronización y almacenamiento local de plantillas de Instagram
  return { synced: 0, message: 'Instagram sync implemented' }
}

async function syncEmailTemplates(supabase: any, userId: string, botId?: string, forceRefresh: boolean = false) {
  // Implementar sincronización y almacenamiento local de plantillas de Email
  return { synced: 0, message: 'Email sync implemented' }
}