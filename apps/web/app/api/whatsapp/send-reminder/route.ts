import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

const SYSTEM_USER_TOKEN = process.env.FACEBOOK_SYSTEM_USER_TOKEN
const EDGE_FUNCTION_SECRET = process.env.EDGE_FUNCTION_SECRET

/**
 * POST /api/whatsapp/send-reminder
 * 
 * Sends a WhatsApp reminder using an approved template or falls back to wa.me link
 * 
 * This route is called by the Supabase Edge Function (send-reminders)
 * for WhatsApp-channel reminders.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is being called from our Edge Function
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== EDGE_FUNCTION_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      reminderId,
      organizationId,
      phone,
      templateName,
      message,
      customerName,
      businessName
    } = await request.json()

    if (!reminderId || !organizationId || !phone || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: reminderId, organizationId, phone, message' },
        { status: 400 }
      )
    }

    console.log('📲 Sending WhatsApp reminder:', {
      reminderId,
      organizationId,
      phone,
      templateName: templateName || 'fallback to wa.me',
      customerName,
      businessName
    })

    const supabase = await getSupabaseServerClient()

    // Get WhatsApp Business Account for this organization
    const { data: whatsappAccount, error: fetchError } = await supabase
      .from('whatsapp_business_accounts')
      .select('waba_id, phone_number_id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle()

    if (fetchError) {
      console.error('❌ Error fetching WhatsApp account:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch WhatsApp account' },
        { status: 500 }
      )
    }

    // If no WABA connected OR no template provided, return wa.me fallback link
    if (!whatsappAccount || !templateName) {
      const fallbackLink = generateWaMeFallbackLink(phone, message, customerName, businessName)
      
      console.log('💡 Using wa.me fallback:', fallbackLink)
      
      return NextResponse.json({
        success: true,
        method: 'fallback',
        fallbackLink,
        message: 'No WhatsApp Business Account or template found. Use wa.me direct link.'
      })
    }

    // Check if template is approved
    const { waba_id, phone_number_id } = whatsappAccount

    if (!SYSTEM_USER_TOKEN) {
      console.error('❌ System user token not configured')
      return NextResponse.json(
        { error: 'System user token not configured' },
        { status: 500 }
      )
    }

    // Fetch template from Meta to verify it exists and is APPROVED
    const templateResponse = await fetch(
      `https://graph.facebook.com/v23.0/${waba_id}/message_templates?name=${encodeURIComponent(templateName)}&fields=name,status,components`,
      {
        headers: {
          'Authorization': `Bearer ${SYSTEM_USER_TOKEN}`
        }
      }
    )

    if (!templateResponse.ok) {
      console.error('❌ Failed to fetch template:', await templateResponse.text())
      
      // Fall back to wa.me
      const fallbackLink = generateWaMeFallbackLink(phone, message, customerName, businessName)
      return NextResponse.json({
        success: true,
        method: 'fallback',
        fallbackLink,
        message: 'Template not found. Using wa.me direct link.'
      })
    }

    const templateData = await templateResponse.json()
    const templates = templateData.data || []
    const template = templates.find((t: any) => t.name === templateName)

    if (!template || template.status !== 'APPROVED') {
      console.warn(`⚠️ Template "${templateName}" is not approved (status: ${template?.status || 'NOT_FOUND'})`)
      
      // Fall back to wa.me
      const fallbackLink = generateWaMeFallbackLink(phone, message, customerName, businessName)
      return NextResponse.json({
        success: true,
        method: 'fallback',
        fallbackLink,
        message: `Template is ${template?.status || 'not found'}. Using wa.me direct link.`
      })
    }

    // ✅ Template is APPROVED - send via WhatsApp Business API
    console.log('✅ Template is approved, sending via WhatsApp Business API...')

    // Build message payload
    // Reminder template format: Body has {{1}} parameter for the reminder message
    const messagePayload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: template.language || 'es'
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: message // The actual reminder message
              }
            ]
          }
        ]
      }
    }

    const sendResponse = await fetch(
      `https://graph.facebook.com/v23.0/${phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SYSTEM_USER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messagePayload)
      }
    )

    if (!sendResponse.ok) {
      const errorData = await sendResponse.json()
      console.error('❌ Failed to send WhatsApp message:', errorData)
      
      // Fall back to wa.me
      const fallbackLink = generateWaMeFallbackLink(phone, message, customerName, businessName)
      return NextResponse.json({
        success: true,
        method: 'fallback',
        fallbackLink,
        message: 'Failed to send via WhatsApp API. Using wa.me direct link.',
        error: errorData
      })
    }

    const result = await sendResponse.json()
    console.log('✅ WhatsApp reminder sent successfully:', result)

    return NextResponse.json({
      success: true,
      method: 'template',
      messageId: result.messages?.[0]?.id,
      templateName
    })

  } catch (error) {
    console.error('❌ Error sending WhatsApp reminder:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send reminder',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Generate wa.me fallback link for direct WhatsApp sharing
 */
function generateWaMeFallbackLink(
  phone: string,
  message: string,
  customerName?: string,
  businessName?: string
): string {
  // Remove '+' and any spaces from phone number for wa.me
  const cleanPhone = phone.replace(/[+\s]/g, '')
  
  // Build message with greeting and signature
  const greeting = customerName ? `Hola ${customerName}! 👋\n\n` : 'Hola! 👋\n\n'
  const signature = businessName ? `\n\nGracias,\n${businessName}` : ''
  const fullMessage = `${greeting}📅 Recordatorio:\n\n${message}${signature}`
  
  // Encode message for URL
  const encodedMessage = encodeURIComponent(fullMessage)
  
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}