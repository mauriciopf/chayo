import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

/**
 * POST /api/whatsapp/send-message
 * Send a WhatsApp template message to a customer
 */
export async function POST(request: NextRequest) {
  try {
    const { organizationId, recipientPhone, templateName, parameters } = await request.json()

    if (!organizationId || !recipientPhone || !templateName) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, recipientPhone, templateName' },
        { status: 400 }
      )
    }

    // Get WhatsApp connection for this organization
    const supabase = await getSupabaseServerClient()
    const { data: whatsappAccount, error: fetchError } = await supabase
      .from('whatsapp_business_accounts')
      .select('phone_number_id, access_token')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle()

    if (fetchError || !whatsappAccount) {
      return NextResponse.json(
        { error: 'WhatsApp not connected for this organization' },
        { status: 404 }
      )
    }

    const { phone_number_id, access_token } = whatsappAccount

    // Send WhatsApp template message
    const messageResponse = await sendWhatsAppTemplate({
      phoneNumberId: phone_number_id,
      accessToken: access_token,
      recipientPhone,
      templateName,
      parameters: parameters || []
    })

    return NextResponse.json({
      success: true,
      messageId: messageResponse.messages[0].id
    })
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    )
  }
}

/**
 * Send a WhatsApp template message
 */
async function sendWhatsAppTemplate({
  phoneNumberId,
  accessToken,
  recipientPhone,
  templateName,
  parameters
}: {
  phoneNumberId: string
  accessToken: string
  recipientPhone: string
  templateName: string
  parameters: string[]
}) {
  // Format phone number (remove any non-digits)
  const formattedPhone = recipientPhone.replace(/\D/g, '')

  // Build template components with parameters
  // For chayo_tool_link template:
  // - Body component uses {{1}} for the link text
  // - Button component uses {{1}} for the URL (same parameter)
  const components = parameters.length > 0 ? [
    {
      type: 'body',
      parameters: parameters.map((value) => ({
        type: 'text',
        text: value
      }))
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0', // First button
      parameters: [
        {
          type: 'text',
          text: parameters[0] // URL button uses same parameter as body
        }
      ]
    }
  ] : []

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: 'es' // Spanish - adjust based on your needs
      },
      components
    }
  }

  console.log('📤 Sending WhatsApp template:', {
    to: formattedPhone,
    template: templateName,
    parameters,
    payload: JSON.stringify(payload, null, 2)
  })

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  )

  if (!response.ok) {
    const error = await response.json()
    console.error('❌ WhatsApp API error:', error)
    throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  console.log('✅ Message sent successfully:', data)
  return data
}

