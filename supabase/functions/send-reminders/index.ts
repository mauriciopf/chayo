// Supabase Edge Function to send scheduled reminders (Email & WhatsApp)
// This function should be called by a cron job to check for pending reminders
// 
// For EMAIL: Sends directly via Resend
// For WHATSAPP: Calls the API route /api/whatsapp/send-reminder

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@3'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const EDGE_FUNCTION_SECRET = Deno.env.get('EDGE_FUNCTION_SECRET') || 'edge-function-secret'
const API_BASE_URL = Deno.env.get('API_BASE_URL') || 'https://chayo.ai'

// Initialize Resend client
const resend = new Resend(RESEND_API_KEY)

interface PendingReminder {
  reminder_id: string
  organization_id: string
  customer_id: string | null
  customer_email: string | null
  customer_name: string | null
  channel: 'email' | 'whatsapp'
  whatsapp_phone: string | null
  whatsapp_template_name: string | null
  original_message: string
  html_content: string | null
  subject: string | null
  recurrence: string
}

serve(async (req) => {
  try {
    console.log('🚀 Reminders Function triggered (Email + WhatsApp)')
    
    // Verify authorization
    const authHeader = req.headers.get('authorization')
    const expectedAuth = Deno.env.get('CRON_SECRET') || 'cron-secret-key'
    
    if (authHeader !== `Bearer ${expectedAuth}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get pending reminders (both email and WhatsApp)
    const { data: reminders, error: remindersError } = await supabase
      .rpc('get_pending_reminders')

    if (remindersError) {
      console.error('❌ Error fetching pending reminders:', remindersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch reminders', details: remindersError }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!reminders || reminders.length === 0) {
      console.log('✅ No pending reminders to send')
      return new Response(
        JSON.stringify({ message: 'No pending reminders', count: 0 }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`📬 Found ${reminders.length} reminder(s) to send`)

    // Group by channel for logging
    const emailReminders = reminders.filter((r: PendingReminder) => r.channel === 'email')
    const whatsappReminders = reminders.filter((r: PendingReminder) => r.channel === 'whatsapp')
    console.log(`  📧 ${emailReminders.length} email reminders`)
    console.log(`  📱 ${whatsappReminders.length} WhatsApp reminders`)

    // Send each reminder (based on channel)
    const results = await Promise.allSettled(
      reminders.map(async (reminder: PendingReminder) => {
        try {
          if (reminder.channel === 'email') {
            // CHANNEL: EMAIL
            return await sendEmailReminder(reminder, supabase)
          } else if (reminder.channel === 'whatsapp') {
            // CHANNEL: WHATSAPP
            return await sendWhatsAppReminder(reminder, supabase)
          } else {
            throw new Error(`Unknown channel: ${reminder.channel}`)
          }
        } catch (error) {
          console.error(`❌ Error processing reminder ${reminder.reminder_id}:`, error)
          return { success: false, reminderId: reminder.reminder_id, error: String(error) }
        }
      })
    )

    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    console.log(`📊 Results: ${successful} sent, ${failed} failed`)

    return new Response(
      JSON.stringify({
        message: 'Reminder processing complete',
        total: reminders.length,
        successful,
        failed,
        results: results.map((r, i) => ({
          reminderId: reminders[i].reminder_id,
          channel: reminders[i].channel,
          status: r.status,
          result: r.status === 'fulfilled' ? r.value : r.reason
        }))
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('❌ Edge function error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined 
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

/**
 * Send EMAIL reminder via Resend
 */
async function sendEmailReminder(reminder: PendingReminder, supabase: any) {
  if (!reminder.customer_email || !reminder.subject) {
    throw new Error('Missing email or subject for email reminder')
  }

  // Get organization details for sender
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', reminder.organization_id)
    .single()

  const orgName = org?.name || 'Chayo AI'

  // Send email via Resend
  const { data: emailResult, error: emailError } = await resend.emails.send({
    from: `${orgName} <reminders@chayo.ai>`,
    to: reminder.customer_email,
    subject: reminder.subject,
    html: reminder.html_content || generateFallbackHTML(reminder),
  })

  if (emailError) {
    console.error(`❌ Failed to send email to ${reminder.customer_email}:`, emailError)
    
    // Mark as failed
    await supabase.rpc('mark_reminder_failed', {
      p_reminder_id: reminder.reminder_id,
      p_error_message: emailError.message || 'Failed to send email'
    })

    throw emailError
  }

  console.log(`✅ Email sent to ${reminder.customer_email} (${emailResult?.id})`)

  // Mark as sent and update next send time if recurring
  await supabase.rpc('mark_reminder_sent', {
    p_reminder_id: reminder.reminder_id
  })

  return { success: true, reminderId: reminder.reminder_id, emailId: emailResult?.id, channel: 'email' }
}

/**
 * Send WHATSAPP reminder via API route
 */
async function sendWhatsAppReminder(reminder: PendingReminder, supabase: any) {
  if (!reminder.whatsapp_phone) {
    throw new Error('Missing WhatsApp phone for WhatsApp reminder')
  }

  // Get organization details
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', reminder.organization_id)
    .single()

  const orgName = org?.name || 'Chayo AI'

  // Call our API route to send WhatsApp message
  const apiUrl = `${API_BASE_URL}/api/whatsapp/send-reminder`
  
  console.log(`📱 Calling WhatsApp API for reminder ${reminder.reminder_id}...`)

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${EDGE_FUNCTION_SECRET}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reminderId: reminder.reminder_id,
      organizationId: reminder.organization_id,
      phone: reminder.whatsapp_phone,
      templateName: reminder.whatsapp_template_name,
      message: reminder.original_message,
      customerName: reminder.customer_name,
      businessName: orgName
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    console.error(`❌ Failed to send WhatsApp to ${reminder.whatsapp_phone}:`, errorData)
    
    // Mark as failed
    await supabase.rpc('mark_reminder_failed', {
      p_reminder_id: reminder.reminder_id,
      p_error_message: errorData.error || 'Failed to send WhatsApp message'
    })

    throw new Error(errorData.error || 'WhatsApp API call failed')
  }

  const result = await response.json()
  
  console.log(`✅ WhatsApp sent to ${reminder.whatsapp_phone} (method: ${result.method || 'unknown'})`)

  // Mark as sent and update next send time if recurring
  await supabase.rpc('mark_reminder_sent', {
    p_reminder_id: reminder.reminder_id
  })

  return { 
    success: true, 
    reminderId: reminder.reminder_id, 
    channel: 'whatsapp',
    method: result.method, // 'template' or 'fallback'
    messageId: result.messageId,
    fallbackLink: result.fallbackLink
  }
}

/**
 * Fallback HTML template for email if AI-generated HTML is missing
 */
function generateFallbackHTML(reminder: PendingReminder): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(reminder.subject || 'Recordatorio')}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${escapeHtml(reminder.subject || 'Recordatorio')}</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="margin: 0 0 20px 0; font-size: 16px;">Hola ${escapeHtml(reminder.customer_name || 'Cliente')},</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; white-space: pre-wrap;">${escapeHtml(reminder.original_message)}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 13px;">
          <p style="margin: 0;">Gracias por tu atención</p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p style="margin: 0;">Chayo AI - Tu asistente de negocio 24/7</p>
      </div>
    </body>
    </html>
  `
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

