import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

const FB_APP_ID = '1401599064442227'
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET || ''
const SYSTEM_USER_ACCESS_TOKEN = 'EAAT6vzZAahXMBPZBsy8uhis47Q4IUeL2yo3V0i7xF33NRCId4gjvhZC7QQ4T1gK3b8bGZA9SWs1hjtWInIAumikhK9C442CivCTCaTodigDxJfYNiHgCi1yCalwfHzZCEok7fb9B99MOG6rsZAdFSC2K4ZApjkJLp1MLvCQn0ijUNpgirfoRdFoGNK7GRzEZAgZDZD'

export async function POST(request: NextRequest) {
  try {
    const { code, wabaId, phoneNumberId, organizationId } = await request.json()

    console.log('📱 WhatsApp signup request:', { wabaId, phoneNumberId, organizationId })

    if (!code || !wabaId || !phoneNumberId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Step 1: Exchange code for access token
    console.log('🔄 Step 1: Exchanging code for access token...')
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&code=${code}`
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('❌ Token exchange failed:', errorData)
      return NextResponse.json(
        { error: 'Failed to exchange code for token', details: errorData },
        { status: 500 }
      )
    }

    const tokenData = await tokenResponse.json()
    const businessAccessToken = tokenData.access_token
    console.log('✅ Access token received')

    // Step 2: Register phone number for Cloud API
    console.log('🔄 Step 2: Registering phone number for Cloud API...')
    const registerUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/register`
    
    const registerResponse = await fetch(registerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${businessAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        pin: '123456' // Default PIN - business should change this
      })
    })

    if (!registerResponse.ok) {
      const errorData = await registerResponse.json()
      console.error('❌ Phone registration failed:', errorData)
      // Continue anyway - phone might already be registered
      console.warn('⚠️ Phone registration failed, but continuing...')
    } else {
      console.log('✅ Phone number registered')
    }

    // Step 3: Subscribe app to webhooks
    console.log('🔄 Step 3: Subscribing to webhooks...')
    const webhookUrl = `https://graph.facebook.com/v21.0/${wabaId}/subscribed_apps`
    
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
      // Continue anyway - can be configured later
      console.warn('⚠️ Webhook subscription failed, but continuing...')
    } else {
      console.log('✅ Webhooks subscribed')
    }

    // Step 4: Store WhatsApp configuration in database
    console.log('🔄 Step 4: Storing configuration in database...')
    const supabase = await getSupabaseServerClient()

    // Check if WhatsApp config already exists for this organization
    const { data: existingConfig } = await supabase
      .from('whatsapp_business_accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (existingConfig) {
      // Update existing config
      const { error: updateError } = await supabase
        .from('whatsapp_business_accounts')
        .update({
          waba_id: wabaId,
          phone_number_id: phoneNumberId,
          access_token: businessAccessToken,
          is_active: true
        })
        .eq('organization_id', organizationId)

      if (updateError) {
        console.error('❌ Database update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update WhatsApp configuration', details: updateError },
          { status: 500 }
        )
      }
    } else {
      // Create new config
      const { error: insertError } = await supabase
        .from('whatsapp_business_accounts')
        .insert({
          organization_id: organizationId,
          waba_id: wabaId,
          phone_number_id: phoneNumberId,
          access_token: businessAccessToken,
          is_active: true
        })

      if (insertError) {
        console.error('❌ Database insert error:', insertError)
        return NextResponse.json(
          { error: 'Failed to store WhatsApp configuration', details: insertError },
          { status: 500 }
        )
      }
    }

    console.log('✅ WhatsApp Business setup completed successfully')

    return NextResponse.json({
      success: true,
      wabaId,
      phoneNumberId,
      message: 'WhatsApp Business account connected successfully'
    })

  } catch (error) {
    console.error('❌ WhatsApp signup error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}


