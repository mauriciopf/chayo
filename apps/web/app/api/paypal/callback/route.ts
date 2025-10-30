import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Handle PayPal OAuth callback
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(request.url)
    
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth error
    if (error) {
      console.error('PayPal OAuth error:', error)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=paypal_oauth_denied`)
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('PayPal OAuth callback missing code or state')
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=paypal_oauth_invalid`)
    }

    // Parse state to get organization ID
    const stateParts = state.split('_')
    if (stateParts.length < 3) {
      console.error('Invalid PayPal OAuth state format')
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=paypal_oauth_invalid`)
    }

    const organizationId = stateParts[0]

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('PayPal OAuth callback - user not authenticated')
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=access_denied`)
    }

    // Check if user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      console.error('PayPal OAuth callback - user access denied')
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=access_denied`)
    }

    // Exchange code for access token
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET
    const baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com'
    
    if (!clientId || !clientSecret) {
      console.error('PayPal configuration missing')
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=paypal_config_missing`)
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/callback`
    
    // Get access token from PayPal
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Accept': 'application/json',
        'Accept-Language': 'es_US',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirectUri
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('PayPal token exchange failed:', errorData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=paypal_token_failed`)
    }

    const tokenData = await tokenResponse.json()
    
    // Get user info from PayPal
    let paypalUserId = null
    let paypalUserEmail = null
    
    try {
      const userInfoResponse = await fetch(`${baseUrl}/v1/identity/oauth2/userinfo?schema=paypalv1.1`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json'
        }
      })
      
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json()
        paypalUserId = userInfo.user_id
        paypalUserEmail = userInfo.email
      }
    } catch (error) {
      console.warn('Failed to get PayPal user info:', error)
      // Continue without user info - not critical
    }

    // Store/update PayPal provider in database
    const providerData = {
      organization_id: organizationId,
      provider_type: 'paypal',
      provider_account_id: paypalUserId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
      scope: tokenData.scope,
      provider_settings: {
        client_id: clientId,
        user_email: paypalUserEmail,
        base_url: baseUrl,
        token_type: tokenData.token_type,
        app_id: tokenData.app_id,
        nonce: tokenData.nonce
      },
      is_active: true,
      is_default: false
    }

    // Check if PayPal provider already exists for this organization
    const { data: existingProvider } = await supabase
      .from('payment_providers')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('provider_type', 'paypal')
      .single()

    if (existingProvider) {
      // Update existing provider
      const { error: updateError } = await supabase
        .from('payment_providers')
        .update(providerData)
        .eq('id', existingProvider.id)

      if (updateError) {
        console.error('Failed to update PayPal provider:', updateError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=paypal_save_failed`)
      }
    } else {
      // Check if this should be the default provider (first provider for organization)
      const { data: existingProviders } = await supabase
        .from('payment_providers')
        .select('id')
        .eq('organization_id', organizationId)

      if (!existingProviders || existingProviders.length === 0) {
        providerData.is_default = true
      }

      // Create new provider
      const { error: createError } = await supabase
        .from('payment_providers')
        .insert(providerData)

      if (createError) {
        console.error('Failed to create PayPal provider:', createError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=paypal_save_failed`)
      }
    }

    // Redirect to dashboard with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=paypal_connected`)

  } catch (error) {
    console.error('PayPal OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=paypal_oauth_failed`)
  }
}
