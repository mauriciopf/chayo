import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// POST - Initialize PayPal OAuth flow
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = await request.json()

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Check if user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if PayPal is already connected for this organization
    const { data: existingProvider } = await supabase
      .from('payment_providers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('provider_type', 'paypal')
      .single()

    if (existingProvider?.is_active) {
      return NextResponse.json({ 
        error: 'PayPal already connected',
        message: 'This organization already has an active PayPal connection.' 
      }, { status: 400 })
    }

    // PayPal OAuth configuration
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET
    const baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com' // sandbox by default
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: 'PayPal configuration missing',
        message: 'PayPal credentials are not configured on the server.' 
      }, { status: 500 })
    }

    // Generate state for security
    const state = `${organizationId}_${Date.now()}_${Math.random().toString(36).substring(2)}`
    
    // PayPal OAuth parameters
    const scopes = [
      'https://uri.paypal.com/services/invoicing',
      'https://uri.paypal.com/services/payments/payment/authcapture',
      'openid',
      'profile',
      'email'
    ].join(' ')

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/callback`
    
    const authUrl = new URL(`${baseUrl}/v1/oauth2/authorize`)
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', state)

    // Store state in session or database for validation
    // For now, we'll include it in the redirect and validate it in the callback
    
    return NextResponse.json({
      authUrl: authUrl.toString(),
      state
    })

  } catch (error) {
    console.error('PayPal OAuth initialization error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}