import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

const SYSTEM_USER_ACCESS_TOKEN = process.env.FACEBOOK_SYSTEM_USER_TOKEN || ''

/**
 * POST /api/whatsapp/link-existing
 * Link an existing WABA to an organization
 * 
 * This is different from signup route because:
 * - WABA already exists (no code exchange needed)
 * - We use System User Token for long-term access
 * - We get phone_number_id from the WABA
 */
export async function POST(request: NextRequest) {
  try {
    const { wabaId, businessId, organizationId, userAccessToken } = await request.json()

    console.log('🔗 Linking existing WABA:', { wabaId, businessId, organizationId })

    if (!wabaId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields: wabaId, organizationId' },
        { status: 400 }
      )
    }

    if (!SYSTEM_USER_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'System user token not configured' },
        { status: 500 }
      )
    }

    // Step 1: Get phone numbers for this WABA
    console.log('🔄 Step 1: Fetching phone numbers for WABA...')
    
    // Try user access token first, fallback to system token if it fails (e.g., expired)
    let phoneNumbersResponse = await fetch(
      `https://graph.facebook.com/v23.0/${wabaId}/phone_numbers?access_token=${userAccessToken}`
    )

    // If user token failed (expired, revoked, etc.), try system token
    if (!phoneNumbersResponse.ok && SYSTEM_USER_ACCESS_TOKEN) {
      console.log('⚠️ User token failed, trying system token...')
      phoneNumbersResponse = await fetch(
        `https://graph.facebook.com/v23.0/${wabaId}/phone_numbers?access_token=${SYSTEM_USER_ACCESS_TOKEN}`
      )
    }

    if (!phoneNumbersResponse.ok) {
      const error = await phoneNumbersResponse.json()
      console.error('❌ Failed to fetch phone numbers:', error)
      return NextResponse.json(
        { error: 'No se pudieron obtener los números de teléfono de esta cuenta' },
        { status: phoneNumbersResponse.status }
      )
    }

    const phoneNumbersData = await phoneNumbersResponse.json()
    const phoneNumbers = phoneNumbersData.data || []

    if (phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Esta cuenta de WhatsApp Business no tiene números de teléfono configurados' },
        { status: 400 }
      )
    }

    // Use the first phone number (or let user select in future enhancement)
    const phoneNumberId = phoneNumbers[0].id
    const displayPhoneNumber = phoneNumbers[0].display_phone_number
    console.log(`✅ Found phone number: ${displayPhoneNumber} (ID: ${phoneNumberId})`)

    // Step 2: Subscribe app to webhooks for this WABA
    console.log('🔄 Step 2: Subscribing to webhooks...')
    const webhookUrl = `https://graph.facebook.com/v23.0/${wabaId}/subscribed_apps`
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SYSTEM_USER_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!webhookResponse.ok) {
      const errorData = await webhookResponse.json()
      console.error('❌ Webhook subscription failed:', errorData)
      console.warn('⚠️ Webhook subscription failed, but continuing...')
    } else {
      console.log('✅ Webhooks subscribed')
    }

    // Step 2.5: Ensure default template exists for this WABA
    console.log('🔄 Step 2.5: Creating default template if needed...')
    try {
      await ensureDefaultTemplateExists(wabaId)
    } catch (templateError) {
      // Non-blocking - template can be created later
      console.error('⚠️ Template creation failed, but continuing:', templateError)
    }

    // Step 3: Store in database
    console.log('🔄 Step 3: Storing WABA configuration in database...')
    const supabase = await getSupabaseServerClient()

    // Check if WhatsApp config already exists for this organization
    const { data: existingConfig } = await supabase
      .from('whatsapp_business_accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle()

    const configData = {
      organization_id: organizationId,
      waba_id: wabaId,
      phone_number_id: phoneNumberId,
      access_token: SYSTEM_USER_ACCESS_TOKEN, // Use System User Token for existing WABAs
      is_active: true
    }

    if (existingConfig) {
      // Update existing config
      const { error: updateError } = await supabase
        .from('whatsapp_business_accounts')
        .update(configData)
        .eq('organization_id', organizationId)

      if (updateError) {
        console.error('❌ Database update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update WhatsApp configuration', details: updateError },
          { status: 500 }
        )
      }
      console.log('✅ Updated existing configuration')
    } else {
      // Create new config
      const { error: insertError } = await supabase
        .from('whatsapp_business_accounts')
        .insert(configData)

      if (insertError) {
        console.error('❌ Database insert error:', insertError)
        return NextResponse.json(
          { error: 'Failed to store WhatsApp configuration', details: insertError },
          { status: 500 }
        )
      }
      console.log('✅ Created new configuration')
    }

    console.log('✅ Existing WABA linked successfully')

    return NextResponse.json({
      success: true,
      wabaId,
      phoneNumberId,
      displayPhoneNumber,
      businessId,
      message: 'Existing WhatsApp Business account linked successfully'
    })

  } catch (error) {
    console.error('❌ Error linking existing WABA:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

/**
 * Ensure default Chayo template exists
 * Same logic as in webhooks/route.ts - creates template if it doesn't exist
 */
async function ensureDefaultTemplateExists(wabaId: string) {
  const systemUserToken = process.env.FACEBOOK_SYSTEM_USER_TOKEN
  if (!systemUserToken) {
    console.warn('⚠️ System user token not configured, skipping template creation')
    return
  }

  try {
    // Check if template already exists
    const listResponse = await fetch(
      `https://graph.facebook.com/v23.0/${wabaId}/message_templates?name=chayo_tool_link`,
      {
        headers: {
          'Authorization': `Bearer ${systemUserToken}`
        }
      }
    )

    if (listResponse.ok) {
      const data = await listResponse.json()
      if (data.data && data.data.length > 0) {
        console.log('✅ Template chayo_tool_link already exists for this WABA')
        return
      }
    }

    console.log('📝 Creating default template chayo_tool_link...')

    // Create the template (following official WhatsApp docs structure)
    const createResponse = await fetch(
      `https://graph.facebook.com/v23.0/${wabaId}/message_templates`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${systemUserToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'chayo_tool_link',
          language: 'es',
          category: 'UTILITY',
          components: [
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
        })
      }
    )

    if (createResponse.ok) {
      const result = await createResponse.json()
      console.log('✅ Default template created and submitted for approval:', result)
      console.log('ℹ️ Template status: PENDING - waiting for Meta approval')
    } else {
      const error = await createResponse.json()
      console.error('❌ Failed to create template:', error)
      throw new Error(`Template creation failed: ${JSON.stringify(error)}`)
    }
  } catch (error) {
    console.error('❌ Error ensuring template exists:', error)
    throw error
  }
}

