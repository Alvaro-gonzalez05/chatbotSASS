import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const error = url.searchParams.get('error')
  const error_description = url.searchParams.get('error_description')

  console.log('❌ Instagram authorization cancelled:')
  console.log('- Error:', error)
  console.log('- Description:', error_description)

  // Redirigir al dashboard con mensaje de cancelación
  return redirect('/dashboard/bots?auth_cancelled=true&platform=instagram')
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Instagram authorization cancelled endpoint',
    status: 'cancelled' 
  })
}