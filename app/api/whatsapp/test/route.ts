import { NextRequest, NextResponse } from 'next/server'

// Test endpoint para verificar que el webhook funciona sin autenticación
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    url: request.url
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: 'POST endpoint working',
    timestamp: new Date().toISOString()
  })
}