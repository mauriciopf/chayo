// Supabase Edge Function to send customer support email notifications
// This function is triggered by a database webhook when a customer sends a message

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Initialize Resend client
const resend = new Resend(RESEND_API_KEY)

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    conversation_id: string
    sender_type: string
    sender_name: string
    sender_email: string
    content: string
    created_at: string
  }
  schema: string
}

serve(async (req) => {
  try {
    // Parse the webhook payload
    const payload: WebhookPayload = await req.json()

    // Only process customer messages
    if (payload.record.sender_type !== 'customer') {
      return new Response(
        JSON.stringify({ message: 'Not a customer message, skipping' }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get conversation details with organization info
    const { data: conversation, error: convError } = await supabase
      .from('customer_support_conversations')
      .select(`
        id,
        subject,
        customer_name,
        organization_id,
        organizations (
          id,
          name,
          owner_id
        )
      `)
      .eq('id', payload.record.conversation_id)
      .single()

    if (convError || !conversation) {
      console.error('Error fetching conversation:', convError)
      return new Response(
        JSON.stringify({ error: 'Conversation not found', details: convError }),
        { headers: { 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Get owner email using the helper function
    const { data: ownerEmailResult, error: ownerError } = await supabase
      .rpc('get_organization_owner_email', { 
        org_id: conversation.organization_id 
      })

    if (ownerError || !ownerEmailResult) {
      console.error('Error fetching owner email:', ownerError)
      return new Response(
        JSON.stringify({ error: 'Owner email not found', details: ownerError }),
        { headers: { 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    const ownerEmail = ownerEmailResult

    // Send email using Resend SDK
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'Chayo AI Support <support@chayo.ai>',
      to: ownerEmail,
      subject: `Nuevo mensaje de ${payload.record.sender_name || 'Cliente'} - ${conversation.subject || 'Soporte'}`,
      html: generateEmailHTML({
        customerName: payload.record.sender_name || conversation.customer_name || 'Cliente',
        subject: conversation.subject || 'Solicitud de soporte',
        messageContent: payload.record.content,
        conversationId: payload.record.conversation_id,
        organizationName: conversation.organizations.name,
      }),
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: emailError }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({
        message: 'Email sent successfully',
        emailId: emailResult?.id,
        recipient: ownerEmail,
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function generateEmailHTML(data: {
  customerName: string
  subject: string
  messageContent: string
  conversationId: string
  organizationName: string
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nuevo mensaje de soporte</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📬 Nuevo mensaje de cliente</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">${data.organizationName}</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <div style="margin-bottom: 20px;">
          <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">De:</p>
          <p style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">${data.customerName}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">Asunto:</p>
          <p style="margin: 0; font-size: 16px; color: #333;">${data.subject}</p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Mensaje:</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
            <p style="margin: 0; color: #333; white-space: pre-wrap;">${escapeHtml(data.messageContent)}</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://chayo.ai/es/dashboard?view=customer-support&conversation=${data.conversationId}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Ver y responder →
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 13px;">
          <p style="margin: 0;">💡 Responde desde tu dashboard de Chayo AI</p>
          <p style="margin: 5px 0 0 0;">Tu cliente recibirá tu respuesta en tiempo real</p>
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
