// Supabase Edge Function to send scheduled reminder emails
// This function should be called by a cron job to check for pending reminders

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@3'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Initialize Resend client
const resend = new Resend(RESEND_API_KEY)

interface PendingReminder {
  reminder_id: string
  organization_id: string
  customer_email: string
  customer_name: string | null
  subject: string
  html_content: string
  recurrence: string
}

serve(async (req) => {
  try {
    console.log('🚀 Reminder Email Function triggered')
    
    // Verify authorization (simple secret key check)
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

    // Get pending reminders
    const { data: reminders, error: remindersError } = await supabase
      .rpc('get_pending_reminders')

    if (remindersError) {
      console.error('Error fetching pending reminders:', remindersError)
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

    console.log(`📧 Found ${reminders.length} reminder(s) to send`)

    // Send each reminder
    const results = await Promise.allSettled(
      reminders.map(async (reminder: PendingReminder) => {
        try {
          // Get organization details for sender
          const { data: org, error: orgError } = await supabase
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

          return { success: true, reminderId: reminder.reminder_id, emailId: emailResult?.id }
        } catch (error) {
          console.error(`Error processing reminder ${reminder.reminder_id}:`, error)
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

// Fallback HTML template if AI-generated HTML is missing
function generateFallbackHTML(reminder: PendingReminder): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(reminder.subject)}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${escapeHtml(reminder.subject)}</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="margin: 0 0 20px 0; font-size: 16px;">Hola ${escapeHtml(reminder.customer_name || 'Cliente')},</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; white-space: pre-wrap;">${escapeHtml(reminder.html_content || 'Mensaje de recordatorio')}</p>
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

