import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

// SignatureAPI webhook handler for signing completion events
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    console.log('SignatureAPI Webhook received:', payload)

    const { 
      event_type, 
      envelope_id, 
      signed_at, 
      signer_name,
      signer_email,
      status 
    } = payload

    if (!envelope_id) {
      return NextResponse.json({ error: 'Missing envelope_id' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Find the ceremony in our database
    const { data: ceremony, error: fetchError } = await supabase
      .from('agent_document_tool')
      .select('*')
      .eq('envelope_id', envelope_id)
      .single()

    if (fetchError || !ceremony) {
      console.error('Ceremony not found for envelope_id:', envelope_id)
      return NextResponse.json({ error: 'Ceremony not found' }, { status: 404 })
    }

    // Determine the status based on event type
    let ceremonyStatus = ceremony.status
    if (event_type === 'document.signed' || event_type === 'envelope.completed') {
      ceremonyStatus = 'completed'
    } else if (event_type === 'envelope.cancelled') {
      ceremonyStatus = 'cancelled'
    } else if (event_type === 'envelope.expired') {
      ceremonyStatus = 'expired'
    }

    // Update ceremony status with signer information
    const { error: updateError } = await supabase.rpc('update_ceremony_status', {
      ceremony_envelope_id: envelope_id,
      new_status: ceremonyStatus,
      signed_timestamp: signed_at ? new Date(signed_at).toISOString() : null,
      signer_name: signer_name || null,
      signer_email: signer_email || null
    })

    if (updateError) {
      console.error('Error updating ceremony status:', updateError)
      return NextResponse.json({ error: 'Failed to update ceremony' }, { status: 500 })
    }

    // Send completion email notification
    if (ceremonyStatus === 'completed') {
      await sendCompletionEmail(ceremony, signer_name, signer_email)
    }

    console.log(`Ceremony ${envelope_id} updated to status: ${ceremonyStatus}`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Placeholder function for sending completion emails
async function sendCompletionEmail(ceremony: any, signerName?: string, signerEmail?: string) {
  // TODO: Implement actual email sending logic
  console.log(`📧 Email notification (TODO):`)
  console.log(`   To: ${ceremony.business_owner_email}`)
  console.log(`   Subject: Document "${ceremony.document_name}" signed`)
  console.log(`   Signer: ${signerName} (${signerEmail})`)
  console.log(`   Document: ${ceremony.document_name}`)
  console.log(`   Signed at: ${ceremony.signed_at}`)
  
  // This is where you'd integrate with your email service
  // e.g., SendGrid, Mailgun, AWS SES, etc.
}

// GET endpoint for webhook verification (if required by SignatureAPI)
export async function GET(request: NextRequest) {
  // Some webhook services require a verification challenge
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('challenge')
  
  if (challenge) {
    return NextResponse.json({ challenge })
  }
  
  return NextResponse.json({ message: 'SignatureAPI webhook endpoint is active' })
}