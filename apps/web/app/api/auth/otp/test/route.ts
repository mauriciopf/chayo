import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 TEST: OTP test endpoint called')
    
    const body = await req.json()
    console.log('🧪 TEST: Request body:', body)
    
    const { email, code } = body
    
    if (!email || !code) {
      console.log('🧪 TEST: Missing email or code')
      return NextResponse.json({ 
        error: 'Missing email or code',
        received: { email, code }
      }, { status: 400 })
    }
    
    console.log('🧪 TEST: All good, returning success')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test endpoint working',
      received: { email, code: code.substring(0, 2) + '****' }
    })
    
  } catch (error) {
    console.error('🧪 TEST: Error in test endpoint:', error)
    return NextResponse.json({ 
      error: 'Test endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 