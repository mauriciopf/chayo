import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log('Twilio status webhook called')
    
    // Parse the status update from Twilio
    const formData = await request.formData()
    
    const messageSid = formData.get('MessageSid') as string
    const messageStatus = formData.get('MessageStatus') as string
    const errorCode = formData.get('ErrorCode') as string
    const errorMessage = formData.get('ErrorMessage') as string

    console.log('Message status update:', {
      messageSid,
      messageStatus,
      errorCode,
      errorMessage
    })

    // Update message status in database if needed
    if (messageSid) {
      const supabase = getSupabaseServerClient()
      // Authentication using server supabase client
      
      await supabase
        .from('messages')
        .update({
          status: messageStatus,
          error_code: errorCode,
          error_message: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('twilio_message_sid', messageSid)
    }

    // Return empty TwiML response
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`

    return new NextResponse(twimlResponse, {
      headers: {
        'Content-Type': 'text/xml'
      }
    })
  } catch (error) {
    console.error('Status webhook error:', error)
    return new NextResponse('Error', { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Twilio status webhook endpoint',
    timestamp: new Date().toISOString()
  })
}
