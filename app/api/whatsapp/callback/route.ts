import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const error_description = url.searchParams.get('error_description')

  console.log('📱 WhatsApp OAuth callback received:')
  console.log('- Code:', code)
  console.log('- State:', state)
  console.log('- Error:', error)
  console.log('- Error description:', error_description)

  // Si hay error en la autorización
  if (error) {
    console.error('WhatsApp OAuth error:', error, error_description)
    return redirect(`/dashboard/bots?error=${encodeURIComponent(error_description || error)}`)
  }

  // Si no hay código de autorización
  if (!code) {
    console.error('No authorization code received')
    return redirect('/dashboard/bots?error=no_code')
  }

  try {
    console.log('✅ WhatsApp authorization successful')
    console.log('Authorization code:', code)
    
    // Redirigir de vuelta al dashboard con éxito
    return redirect(`/dashboard/bots?whatsapp_auth=success&code=${code}`)
    
  } catch (error) {
    console.error('Error processing WhatsApp callback:', error)
    return redirect('/dashboard/bots?error=callback_processing_failed')
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'WhatsApp callback endpoint' })
}