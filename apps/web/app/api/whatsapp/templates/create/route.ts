import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

const SYSTEM_USER_TOKEN = process.env.FACEBOOK_SYSTEM_USER_TOKEN

/**
 * POST /api/whatsapp/templates/create
 * Create a new message template
 */
export async function POST(request: NextRequest) {
  try {
    const { organizationId, templateName, category, language, components } = await request.json()

    if (!organizationId || !templateName || !category || !components) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get WhatsApp account for this organization
    const supabase = await getSupabaseServerClient()
    const { data: whatsappAccount, error: fetchError } = await supabase
      .from('whatsapp_business_accounts')
      .select('waba_id, access_token')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle()

    if (fetchError || !whatsappAccount) {
      return NextResponse.json(
        { error: 'WhatsApp not connected for this organization' },
        { status: 404 }
      )
    }

    const { waba_id } = whatsappAccount

    // Use system user token for template creation (requires elevated permissions)
    if (!SYSTEM_USER_TOKEN) {
      return NextResponse.json(
        { error: 'System user token not configured' },
        { status: 500 }
      )
    }

    // Create template via WhatsApp API
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${waba_id}/message_templates`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SYSTEM_USER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: templateName,
          language: language || 'es',
          category: category || 'UTILITY',
          components
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Template creation failed:', error)
      return NextResponse.json(
        { error: error.error?.message || 'Failed to create template' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ Template created:', data)

    return NextResponse.json({
      success: true,
      templateId: data.id,
      status: data.status || 'PENDING'
    })
  } catch (error) {
    console.error('❌ Error creating template:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create template' },
      { status: 500 }
    )
  }
}

/**
 * Helper: Create default Chayo tool link template
 * Based on official WhatsApp docs: https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates
 * NOT exported - used internally by webhook only
 */
async function createDefaultToolLinkTemplate(wabaId: string) {
  if (!SYSTEM_USER_TOKEN) {
    throw new Error('System user token not configured')
  }

  const components = [
    {
      type: 'BODY',
      text: 'Hola! 👋\n\nAquí está el enlace que solicitaste:\n\n{{1}}\n\n¿Necesitas ayuda? Responde a este mensaje y te atenderemos.\n\nGracias,\nEquipo Chayo',
      example: {
        body_text: [
          [
            'https://chayo.onelink.me/SB63?deep_link_value=example&deep_link_sub1=chat'
          ]
        ]
      }
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: 'Abrir Enlace',
          url: '{{1}}',
          example: [
            'https://chayo.onelink.me/SB63'
          ]
        }
      ]
    }
  ]

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${wabaId}/message_templates`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SYSTEM_USER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'chayo_tool_link',
        language: 'es',
        category: 'UTILITY',
        components
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to create template: ${error.error?.message}`)
  }

  return await response.json()
}

