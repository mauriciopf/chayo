import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export const dynamic = 'force-dynamic'

// GET - Handle Square OAuth callback
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(request.url)
    
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth error
    if (error) {
      console.error('Square OAuth error:', error)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=square_oauth_denied`)
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('Square OAuth callback missing code or state')
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=square_oauth_invalid`)
    }

    // Parse state to get organization ID
    const stateParts = state.split('_')
    if (stateParts.length < 3) {
      console.error('Invalid Square OAuth state format')
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=square_oauth_invalid`)
    }

    const organizationId = stateParts[0]

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Square OAuth callback - user not authenticated')
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
      console.error('Square OAuth callback - user access denied')
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=access_denied`)
    }

    // Exchange code for access token
    const applicationId = process.env.SQUARE_APPLICATION_ID
    const applicationSecret = process.env.SQUARE_APPLICATION_SECRET
    const environment = process.env.SQUARE_ENVIRONMENT || 'sandbox'
    
    if (!applicationId || !applicationSecret) {
      console.error('Square configuration missing')
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=square_config_missing`)
    }

    const baseUrl = environment === 'production' 
      ? 'https://connect.squareup.com' 
      : 'https://connect.squareupsandbox.com'
    
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/square/callback`
    
    // Get access token from Square
    const tokenResponse = await fetch(`${baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-12-18', // Use latest API version
        'Authorization': `Client ${applicationSecret}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: applicationId,
        client_secret: applicationSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Square token exchange failed:', errorData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=square_token_failed`)
    }

    const tokenData = await tokenResponse.json()
    
    // Get merchant info from Square
    let merchantId = null
    let merchantInfo = null
    
    try {
      const apiUrl = environment === 'production' 
        ? 'https://connect.squareup.com' 
        : 'https://connect.squareupsandbox.com'
      
      const merchantResponse = await fetch(`${apiUrl}/v2/merchants`, {
        headers: {
          'Square-Version': '2024-12-18',
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json'
        }
      })
      
      if (merchantResponse.ok) {
        const merchantData = await merchantResponse.json()
        if (merchantData.merchants && merchantData.merchants.length > 0) {
          merchantInfo = merchantData.merchants[0]
          merchantId = merchantInfo.id
        }
      }
    } catch (error) {
      console.warn('Failed to get Square merchant info:', error)
      // Continue without merchant info - not critical
    }

    // Store/update Square provider in database
    const providerData = {
      organization_id: organizationId,
      provider_type: 'square',
      provider_account_id: merchantId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: tokenData.expires_at ? new Date(tokenData.expires_at).toISOString() : null,
      scope: tokenData.scope,
      provider_settings: {
        application_id: applicationId,
        environment: environment,
        merchant_id: merchantId,
        merchant_info: merchantInfo,
        token_type: tokenData.token_type
      },
      payment_type: 'manual_price_id',
      is_active: true,
      is_default: false
    }

    // Check if Square provider already exists for this organization
    const { data: existingProvider } = await supabase
      .from('payment_providers')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('provider_type', 'square')
      .single()

    if (existingProvider) {
      // Update existing provider
      const { error: updateError } = await supabase
        .from('payment_providers')
        .update(providerData)
        .eq('id', existingProvider.id)

      if (updateError) {
        console.error('Failed to update Square provider:', updateError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=square_save_failed`)
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
        console.error('Failed to create Square provider:', createError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=square_save_failed`)
      }
    }

    // Redirect to dashboard with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=square_connected`)

  } catch (error) {
    console.error('Square OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=square_oauth_failed`)
  }
}