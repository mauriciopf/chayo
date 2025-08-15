import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const testData = {
    endpoints: {
      setup: '/api/whatsapp/setup',
      status: '/api/whatsapp/status',
      webhook: '/api/twilio/webhook',
      fallback: '/api/twilio/fallback',
      statusWebhook: '/api/twilio/status'
    },
    environment: {
      hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasMessagingService: !!process.env.TWILIO_MESSAGING_SERVICE_SID,
      webhookUrl: process.env.TWILIO_WEBHOOK_URL
    },
    status: 'WhatsApp integration endpoints are ready'
  }

  return NextResponse.json(testData)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      message: 'Test endpoint received data',
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      message: 'Test endpoint error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 })
  }
}
