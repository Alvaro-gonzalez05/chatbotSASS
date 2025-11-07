import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Endpoint para crear plantillas personalizadas locales
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = data.user.id
    const body = await request.json()
    
    const { 
      name,
      platform,
      bot_id,
      body_text,
      subject,
      html_content,
      variables = []
    } = body

    // Validaciones
    if (!name || !platform || !body_text) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: name, platform, body_text' }, 
        { status: 400 }
      )
    }

    if (!['instagram', 'gmail'].includes(platform)) {
      return NextResponse.json(
        { error: 'Plataforma no válida. Solo se permiten plantillas locales para Instagram y Gmail' }, 
        { status: 400 }
      )
    }

    // Crear la plantilla en la base de datos
    const templateData = {
      user_id: userId,
      bot_id: bot_id || null,
      name: name,
      platform: platform,
      category: 'general',
      body_text: body_text,
      html_content: html_content || null,
      subject: subject || null,
      source: 'local',
      external_id: null,
      variables: variables || [],
      automation_types: ['birthday', 'inactive_client', 'new_promotion', 'comment_reply'],
      external_data: null,
      status: 'active',
      is_system: false
    }

    const { data: newTemplate, error: insertError } = await supabase
      .from('templates')
      .insert(templateData)
      .select('*')
      .single()

    if (insertError) {
      console.error('Error creating template:', insertError)
      return NextResponse.json(
        { error: 'Error al crear la plantilla' }, 
        { status: 500 }
      )
    }

    // Formatear la respuesta para que sea compatible con el frontend
    const formattedTemplate = {
      id: newTemplate.id,
      name: newTemplate.name,
      platform: newTemplate.platform,
      body_content: newTemplate.body_text,
      subject: newTemplate.subject,
      html_content: newTemplate.html_content,
      variables: Array.isArray(newTemplate.variables) 
        ? newTemplate.variables.map((v: any) => typeof v === 'string' ? v : `{${v}}`) 
        : [],
      status: newTemplate.status,
      can_use: true,
      source: 'local_db'
    }

    return NextResponse.json({
      success: true,
      message: 'Plantilla creada exitosamente',
      template: formattedTemplate
    })

  } catch (error) {
    console.error('Error in template creation:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}