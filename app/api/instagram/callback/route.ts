import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const error_description = url.searchParams.get('error_description')

  console.log('📸 Instagram OAuth callback received:')
  console.log('- Code:', code)
  console.log('- State:', state)
  console.log('- Error:', error)
  console.log('- Error description:', error_description)

  // Si hay error en la autorización
  if (error) {
    console.error('Instagram OAuth error:', error, error_description)
    return redirect(`/dashboard/bots?error=${encodeURIComponent(error_description || error)}`)
  }

  // Si no hay código de autorización
  if (!code) {
    console.error('No authorization code received')
    return redirect('/dashboard/bots?error=no_code')
  }

  try {
    // Aquí puedes procesar el código de autorización
    // Por ejemplo, intercambiarlo por un access token
    console.log('✅ Instagram authorization successful')
    console.log('Authorization code:', code)
    
    // Redirigir de vuelta al dashboard con éxito
    return redirect(`/dashboard/bots?instagram_auth=success&code=${code}`)
    
  } catch (error) {
    console.error('Error processing Instagram callback:', error)
    return redirect('/dashboard/bots?error=callback_processing_failed')
  }
}

export async function POST(request: NextRequest) {
  // Manejar POST si es necesario
  return NextResponse.json({ message: 'Instagram callback endpoint' })
}