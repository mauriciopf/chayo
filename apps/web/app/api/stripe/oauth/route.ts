import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

// POST - Initialize Stripe OAuth flow
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
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

    // Check if Stripe is already connected for this organization
    const { data: existingProvider } = await supabase
      .from('payment_providers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('provider_type', 'stripe')
      .single()

    if (existingProvider?.is_active) {
      return NextResponse.json({ 
        error: 'Stripe already connected',
        message: 'This organization already has an active Stripe connection.' 
      }, { status: 400 })
    }

    // Stripe OAuth configuration
    const clientId = process.env.STRIPE_CLIENT_ID
    
    if (!clientId) {
      return NextResponse.json({ 
        error: 'Stripe configuration missing',
        message: 'Stripe credentials are not configured on the server.' 
      }, { status: 500 })
    }

    // Generate state for security
    const state = `${organizationId}_${Date.now()}_${Math.random().toString(36).substring(2)}`
    
    // Stripe OAuth parameters
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/callback`
    
    const authUrl = new URL('https://connect.stripe.com/oauth/authorize')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('scope', 'read_write')
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', state)

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state
    })

  } catch (error) {
    console.error('Stripe OAuth initialization error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
