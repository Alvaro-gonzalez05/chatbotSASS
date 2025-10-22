import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔍 DEBUG: Instagram webhook verification test')
  console.log('- Full URL:', request.url)
  console.log('- Method:', request.method)
  console.log('- Headers:', Object.fromEntries(request.headers.entries()))
  
  const url = new URL(request.url)
  const allParams = Object.fromEntries(url.searchParams.entries())
  console.log('- All parameters:', allParams)
  
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')
  
  console.log('- Mode:', mode)
  console.log('- Token:', token)
  console.log('- Challenge:', challenge)
  
  // Return challenge regardless for testing
  if (challenge) {
    console.log('✅ Returning challenge for debugging')
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
  
  return new NextResponse('No challenge provided', { status: 400 })
}

export async function POST(request: NextRequest) {
  console.log('🔍 DEBUG: Instagram webhook POST received')
  return new NextResponse('Debug endpoint', { status: 200 })
}