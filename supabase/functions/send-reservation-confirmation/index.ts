// Supabase Edge Function to send reservation confirmation emails
// This function is triggered by a database webhook when a reservation is created

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@3'

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
    organization_id: string
    product_id: string
    customer_id?: string
    client_name?: string
    client_email: string
    client_phone?: string
    reservation_date: string
    reservation_time: string
    notes?: string
    status: string
    created_at: string
  }
  schema: string
}

serve(async (req) => {
  try {
    console.log('🚀 Reservation Email Function triggered')
    
    // Parse the webhook payload
    const payload: WebhookPayload = await req.json()
    console.log('📦 Payload received:', JSON.stringify(payload, null, 2))

    const reservation = payload.record

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get organization and product details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', reservation.organization_id)
      .single()

    if (orgError || !organization) {
      console.error('Error fetching organization:', orgError)
      return new Response(
        JSON.stringify({ error: 'Organization not found', details: orgError }),
        { headers: { 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    const { data: product, error: productError } = await supabase
      .from('products_list_tool')
      .select('id, name, description, price')
      .eq('id', reservation.product_id)
      .single()

    if (productError || !product) {
      console.error('Error fetching product:', productError)
      return new Response(
        JSON.stringify({ error: 'Product not found', details: productError }),
        { headers: { 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Send confirmation email to customer
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'Chayo AI Reservaciones <reservations@chayo.ai>',
      to: reservation.client_email,
      subject: `Confirmación de Reservación - ${product.name}`,
      html: generateCustomerEmailHTML({
        customerName: reservation.client_name || 'Cliente',
        organizationName: organization.name,
        productName: product.name,
        productDescription: product.description || '',
        productPrice: product.price,
        reservationDate: reservation.reservation_date,
        reservationTime: reservation.reservation_time,
        reservationId: reservation.id,
        notes: reservation.notes || '',
      }),
    })

    if (emailError) {
      console.error('Error sending customer email:', emailError)
      return new Response(
        JSON.stringify({ error: 'Failed to send customer email', details: emailError }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('✅ Customer confirmation email sent:', emailResult?.id)

    // Also notify the organization owner
    const { data: ownerEmailResult, error: ownerError } = await supabase
      .rpc('get_organization_owner_email', { 
        org_id: reservation.organization_id 
      })

    if (ownerError || !ownerEmailResult) {
      console.warn('Could not get owner email:', ownerError)
      // Don't fail if owner email fails
    } else {
      // Send notification to owner
      const { data: ownerEmailSent, error: ownerEmailError } = await resend.emails.send({
        from: 'Chayo AI Reservaciones <reservations@chayo.ai>',
        to: ownerEmailResult,
        subject: `Nueva Reservación: ${product.name}`,
        html: generateOwnerEmailHTML({
          customerName: reservation.client_name || reservation.client_email,
          customerEmail: reservation.client_email,
          customerPhone: reservation.client_phone || 'No proporcionado',
          organizationName: organization.name,
          productName: product.name,
          reservationDate: reservation.reservation_date,
          reservationTime: reservation.reservation_time,
          reservationId: reservation.id,
          notes: reservation.notes || 'Sin notas',
        }),
      })

      if (ownerEmailError) {
        console.warn('Error sending owner notification:', ownerEmailError)
      } else {
        console.log('✅ Owner notification email sent:', ownerEmailSent?.id)
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Reservation confirmation emails sent successfully',
        customerEmailId: emailResult?.id,
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

// Customer confirmation email template
function generateCustomerEmailHTML(data: {
  customerName: string
  organizationName: string
  productName: string
  productDescription: string
  productPrice?: number
  reservationDate: string
  reservationTime: string
  reservationId: string
  notes: string
}): string {
  const formattedDate = new Date(data.reservationDate).toLocaleDateString('es', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedTime = formatTime(data.reservationTime)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Reservación</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">✅ Reservación Confirmada</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">${data.organizationName}</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="margin: 0 0 20px 0; font-size: 16px;">Hola ${escapeHtml(data.customerName)},</p>
        
        <p style="margin: 0 0 20px 0; font-size: 16px;">Tu reservación ha sido confirmada exitosamente. Aquí están los detalles:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #667eea;">📦 Servicio/Producto</h2>
          <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: 600;">${escapeHtml(data.productName)}</p>
          ${data.productDescription ? `<p style="margin: 5px 0; font-size: 14px; color: #666;">${escapeHtml(data.productDescription)}</p>` : ''}
          ${data.productPrice ? `<p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600; color: #667eea;">$${data.productPrice.toFixed(2)}</p>` : ''}
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #667eea;">📅 Fecha y Hora</h2>
          <p style="margin: 0 0 5px 0; font-size: 16px;"><strong>Fecha:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0 0 0; font-size: 16px;"><strong>Hora:</strong> ${formattedTime}</p>
        </div>
        
        ${data.notes ? `
          <div style="background: #fff4e6; padding: 15px; border-radius: 8px; border-left: 4px solid #ffa726; margin-bottom: 20px;">
            <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; color: #e65100;">📝 Notas:</p>
            <p style="margin: 0; font-size: 14px; color: #555;">${escapeHtml(data.notes)}</p>
          </div>
        ` : ''}
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; color: #0d47a1;">
            <strong>Número de Confirmación:</strong> ${data.reservationId.substring(0, 8).toUpperCase()}
          </p>
        </div>
        
        <div style="margin: 30px 0; padding: 20px; background: #f0f0f0; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px;">💡 Consejos:</h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #666;">
            <li>Por favor, llega 5 minutos antes de tu cita</li>
            <li>Si necesitas cancelar o reagendar, contáctanos con anticipación</li>
            <li>Guarda este correo como confirmación</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">¿Necesitas hacer cambios?</p>
          <p style="margin: 0; font-size: 13px; color: #999;">Contáctanos directamente en ${data.organizationName}</p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p style="margin: 0;">Chayo AI - Tu asistente de negocio 24/7</p>
        <p style="margin: 5px 0 0 0;">Este es un correo automático de confirmación</p>
      </div>
    </body>
    </html>
  `
}

// Owner notification email template
function generateOwnerEmailHTML(data: {
  customerName: string
  customerEmail: string
  customerPhone: string
  organizationName: string
  productName: string
  reservationDate: string
  reservationTime: string
  reservationId: string
  notes: string
}): string {
  const formattedDate = new Date(data.reservationDate).toLocaleDateString('es', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedTime = formatTime(data.reservationTime)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nueva Reservación</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Nueva Reservación</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">${data.organizationName}</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="margin: 0 0 20px 0; font-size: 16px;">Tienes una nueva reservación:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #667eea;">👤 Cliente</h2>
          <p style="margin: 0 0 5px 0; font-size: 16px;"><strong>Nombre:</strong> ${escapeHtml(data.customerName)}</p>
          <p style="margin: 5px 0; font-size: 16px;"><strong>Email:</strong> ${escapeHtml(data.customerEmail)}</p>
          <p style="margin: 5px 0 0 0; font-size: 16px;"><strong>Teléfono:</strong> ${escapeHtml(data.customerPhone)}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #667eea;">📦 Servicio</h2>
          <p style="margin: 0; font-size: 16px; font-weight: 600;">${escapeHtml(data.productName)}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #667eea;">📅 Fecha y Hora</h2>
          <p style="margin: 0 0 5px 0; font-size: 16px;"><strong>Fecha:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0 0 0; font-size: 16px;"><strong>Hora:</strong> ${formattedTime}</p>
        </div>
        
        ${data.notes !== 'Sin notas' ? `
          <div style="background: #fff4e6; padding: 15px; border-radius: 8px; border-left: 4px solid #ffa726; margin-bottom: 20px;">
            <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; color: #e65100;">📝 Notas del Cliente:</p>
            <p style="margin: 0; font-size: 14px; color: #555;">${escapeHtml(data.notes)}</p>
          </div>
        ` : ''}
        
        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; color: #1b5e20;">
            <strong>ID:</strong> ${data.reservationId.substring(0, 8).toUpperCase()}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://chayo.ai/es/dashboard" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Ver en Dashboard →
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 13px;">
          <p style="margin: 0;">💡 Recuerda confirmar la reservación con tu cliente</p>
          <p style="margin: 5px 0 0 0;">Puedes gestionar esta reservación desde tu dashboard</p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p style="margin: 0;">Chayo AI - Tu asistente de negocio 24/7</p>
      </div>
    </body>
    </html>
  `
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${minutes} ${ampm}`
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

