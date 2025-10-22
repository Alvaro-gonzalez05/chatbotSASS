import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get all Instagram bots with their integrations
    const { data: bots, error } = await supabase
      .from('bots')
      .select('id, name, platform, user_id')
      .eq('platform', 'instagram')
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Get integrations for these users
    const { data: integrations, error: integrationsError } = await supabase
      .from('integrations')
      .select('*')
      .eq('platform', 'instagram')
    
    // Format for debugging (hide sensitive data)
    const debugBots = bots?.map(bot => {
      const integration = integrations?.find(i => i.user_id === bot.user_id)
      return {
        id: bot.id,
        name: bot.name,
        platform: bot.platform,
        user_id: bot.user_id,
        has_integration: !!integration,
        integration_active: integration?.is_active,
        webhook_token_is_bot_id: bot.id, // El token siempre es el ID del bot
        config_keys: integration?.config ? Object.keys(integration.config) : []
      }
    })
    
    return NextResponse.json({ 
      count: bots?.length || 0,
      bots: debugBots 
    })
    
  } catch (error) {
    console.error('Error fetching Instagram bots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}