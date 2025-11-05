import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'
import crypto from 'crypto'

// Facebook webhook verification token (set this in your .env)
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'your_verify_token_here'
const APP_SECRET = process.env.FACEBOOK_APP_SECRET

/**
 * GET handler for webhook verification
 * Facebook will call this to verify your webhook endpoint
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('📞 Webhook verification request:', { mode, token, challenge })

  // Check if a token and mode were sent
  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified')
    return new NextResponse(challenge, { status: 200 })
  }

  console.error('❌ Webhook verification failed')
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

/**
 * POST handler for webhook events
 * Handles all WhatsApp Business Platform webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    
    // Verify webhook signature if APP_SECRET is configured
    if (APP_SECRET) {
      const signature = request.headers.get('x-hub-signature-256')
      if (!signature || !verifySignature(body, signature, APP_SECRET)) {
        console.error('❌ Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    }

    const payload = JSON.parse(body)
    console.log('📨 Webhook received:', JSON.stringify(payload, null, 2))

    // Handle WhatsApp Business Account webhooks
    if (payload.object === 'whatsapp_business_account') {
      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          // Route to appropriate handler based on field
          switch (change.field) {
            case 'account_update':
              await handleAccountUpdate(change.value)
              break
            
            case 'messages':
              await handleMessages(change.value)
              break
            
            case 'message_template_status_update':
              await handleTemplateStatusUpdate(change.value)
              break
            
            default:
              console.log('ℹ️ Unhandled webhook field:', change.field)
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Verify webhook signature from Facebook
 */
function verifySignature(payload: string, signature: string, appSecret: string): boolean {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Handle account_update webhook events
 */
async function handleAccountUpdate(value: any) {
  const eventType = value.event
  console.log('🔔 Account update event:', eventType)

  switch (eventType) {
    case 'PARTNER_APP_INSTALLED':
      await handlePartnerAppInstalled(value)
      break
    
    case 'PARTNER_APP_UNINSTALLED':
      await handlePartnerAppUninstalled(value)
      break
    
    case 'ACCOUNT_VIOLATION':
      console.warn('⚠️ Account violation:', value.violation_info)
      // TODO: Notify organization about violation
      break
    
    case 'DISABLED_UPDATE':
      console.warn('⚠️ Account disabled:', value.ban_info)
      // TODO: Update account status and notify organization
      break
    
    case 'ACCOUNT_DELETED':
      await handleAccountDeleted(value)
      break
    
    default:
      console.log('ℹ️ Unhandled account update event:', eventType)
  }
}

/**
 * Handle PARTNER_APP_INSTALLED event
 * This is triggered when a customer completes Embedded Signup
 */
async function handlePartnerAppInstalled(value: any) {
  const wabaInfo = value.waba_info
  if (!wabaInfo) {
    console.error('❌ Missing waba_info in PARTNER_APP_INSTALLED event')
    return
  }

  const { waba_id, owner_business_id, partner_app_id } = wabaInfo
  console.log('✅ Partner app installed:', { waba_id, owner_business_id, partner_app_id })

  // Note: We don't have organizationId in the webhook
  // The actual linking happens in /api/whatsapp/signup when the user completes the flow
  // This webhook is mainly for logging and monitoring
  
  console.log('📝 WABA installed - awaiting user signup completion to link to organization')
}

/**
 * Handle PARTNER_APP_UNINSTALLED event
 * Customer revoked access or uninstalled the app
 */
async function handlePartnerAppUninstalled(value: any) {
  const wabaInfo = value.waba_info
  if (!wabaInfo?.waba_id) return

  const supabase = await getSupabaseServerClient()
  
  // Deactivate the WhatsApp Business Account
  const { error } = await supabase
    .from('whatsapp_business_accounts')
    .update({ is_active: false })
    .eq('waba_id', wabaInfo.waba_id)

  if (error) {
    console.error('❌ Error deactivating WABA:', error)
  } else {
    console.log('✅ Deactivated WABA:', wabaInfo.waba_id)
  }
}

/**
 * Handle ACCOUNT_DELETED event
 * WhatsApp Business Account was deleted
 */
async function handleAccountDeleted(value: any) {
  // Since we don't get waba_id in ACCOUNT_DELETED event,
  // we'd need to match by other means or just log it
  console.log('⚠️ WhatsApp Business Account deleted')
}

/**
 * Handle messages webhook events
 * Receives incoming WhatsApp messages
 */
async function handleMessages(value: any) {
  console.log('💬 Incoming message webhook:', value)
  
  // TODO: Implement message handling
  // - Parse incoming message
  // - Store in database
  // - Trigger any automated responses
  // - Notify relevant users
  
  const messages = value.messages || []
  for (const message of messages) {
    console.log('📩 Message received:', {
      from: message.from,
      type: message.type,
      id: message.id
    })
  }
}

/**
 * Handle message_template_status_update webhook events
 * Notifies when message templates are approved/rejected
 */
async function handleTemplateStatusUpdate(value: any) {
  console.log('📋 Template status update:', value)
  
  // TODO: Implement template status handling
  // - Update template status in database
  // - Notify organization about approval/rejection
  
  const event = value.event
  const messageTemplateId = value.message_template_id
  const messageTemplateName = value.message_template_name
  const messageTemplateLanguage = value.message_template_language
  
  console.log('📝 Template update:', {
    event,
    id: messageTemplateId,
    name: messageTemplateName,
    language: messageTemplateLanguage
  })
}

