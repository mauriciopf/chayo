// Supabase Edge Function to send QR code and app links via email
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@3'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Initialize Resend client
const resend = new Resend(RESEND_API_KEY)

interface EmailRequest {
  emails: string[]
  organizationSlug: string
  businessName: string
  qrCodeDataUrl: string
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 405 
      }
    )
  }

  try {
    console.log('📧 QR Code Email Function triggered')
    
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Create Supabase client with user's JWT
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: authHeader }
      }
    })

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Parse request body
    const body: EmailRequest = await req.json()
    const { emails, organizationSlug, businessName, qrCodeDataUrl } = body

    // Validate inputs
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one email is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!organizationSlug || !qrCodeDataUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emails.filter(email => !emailRegex.test(email))
    if (invalidEmails.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format', invalidEmails }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const chatUrl = `chayo://business/${organizationSlug}`
    const base64Data = qrCodeDataUrl.split(',')[1]
    const displayName = businessName || 'Tu negocio'

    console.log(`📤 Sending to ${emails.length} recipient(s)`)

    // Send emails in parallel
    const results = await Promise.allSettled(
      emails.map(async (email: string) => {
        try {
          const { data: emailResult, error: emailError } = await resend.emails.send({
            from: 'Chayo <noreply@chayo.app>',
            to: email,
            subject: `${displayName} - Conecta con nosotros en Chayo`,
            html: generateEmailHTML(displayName),
            attachments: [
              {
                filename: 'qr-code.png',
                content: base64Data,
                content_id: 'qrcode',
              },
            ],
          })

          if (emailError) {
            console.error(`❌ Failed to send to ${email}:`, emailError)
            throw emailError
          }

          console.log(`✅ Email sent to ${email} (${emailResult?.id})`)
          return { success: true, email, emailId: emailResult?.id }
        } catch (error) {
          console.error(`Error sending to ${email}:`, error)
          return { success: false, email, error: String(error) }
        }
      })
    )

    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    console.log(`📊 Results: ${successful} sent, ${failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        failed: failed,
        message: `Successfully sent ${successful} email(s)${failed > 0 ? `, ${failed} failed` : ''}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('❌ Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send emails',
        details: error instanceof Error ? error.message : String(error)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function generateEmailHTML(businessName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conecta con ${escapeHtml(businessName)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                📱 Conecta con ${escapeHtml(businessName)}
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                Acceso directo en la app de Chayo
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                ¡Hola! 👋
              </p>
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                ${escapeHtml(businessName)} te invita a conectar directamente a través de la app móvil de Chayo. 
                Con nuestro asistente inteligente puedes:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td style="padding: 12px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="30" style="font-size: 20px;">💬</td>
                        <td style="color: #374151; font-size: 15px; line-height: 1.5;">
                          Chatear en tiempo real con nuestro asistente IA
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="30" style="font-size: 20px;">📅</td>
                        <td style="color: #374151; font-size: 15px; line-height: 1.5;">
                          Hacer citas y reservaciones
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="30" style="font-size: 20px;">🛍️</td>
                        <td style="color: #374151; font-size: 15px; line-height: 1.5;">
                          Ver productos y servicios
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="30" style="font-size: 20px;">🔔</td>
                        <td style="color: #374151; font-size: 15px; line-height: 1.5;">
                          Recibir actualizaciones y ofertas personalizadas
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- QR Code -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; display: inline-block;">
                      <img src="cid:qrcode" alt="QR Code" width="200" height="200" style="display: block; border-radius: 8px;" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 16px;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      Escanea el código QR con tu cámara
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- App Download Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; font-weight: 600;">
                      O descarga la app:
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="https://apps.apple.com/app/chayo" style="display: inline-block; text-decoration: none;">
                            <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&releaseDate=1654819200" alt="Download on App Store" width="140" style="display: block;" />
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="https://play.google.com/store/apps/details?id=com.chayo" style="display: inline-block; text-decoration: none;">
                            <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" width="157" style="display: block;" />
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                ¡Esperamos verte pronto! 🎉
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                Este correo fue enviado por ${escapeHtml(businessName)} a través de Chayo.<br>
                Chayo es una plataforma de comunicación inteligente para negocios.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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

