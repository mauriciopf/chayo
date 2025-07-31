import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// Stripe OAuth configuration
const STRIPE_CONFIG = {
  clientId: process.env.STRIPE_CLIENT_ID,
  clientSecret: process.env.STRIPE_CLIENT_SECRET,
  authorizeUrl: 'https://connect.stripe.com/oauth/authorize',
  tokenUrl: 'https://connect.stripe.com/oauth/token',
  scope: 'read_write',
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/callback`
}

// POST - Initialize Stripe OAuth flow
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

    // Check if Stripe OAuth credentials are configured
    if (!STRIPE_CONFIG.clientId || !STRIPE_CONFIG.clientSecret) {
      return NextResponse.json({
        error: 'Stripe OAuth not configured',
        message: 'Stripe OAuth integration is not yet configured. Please add STRIPE_CLIENT_ID and STRIPE_CLIENT_SECRET to environment variables.',
        manualSetup: true
      }, { status: 501 })
    }

    // Generate state parameter for security (includes org ID and user ID)
    const state = Buffer.from(JSON.stringify({
      organizationId,
      userId: user.id,
      timestamp: Date.now()
    })).toString('base64url')

    // Build OAuth authorization URL
    const authUrl = new URL(STRIPE_CONFIG.authorizeUrl)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', STRIPE_CONFIG.clientId)
    authUrl.searchParams.set('scope', STRIPE_CONFIG.scope)
    authUrl.searchParams.set('redirect_uri', STRIPE_CONFIG.redirectUri)
    authUrl.searchParams.set('state', state)

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state
    })

  } catch (error) {
    console.error('Stripe OAuth initialization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}