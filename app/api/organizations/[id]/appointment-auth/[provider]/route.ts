import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// OAuth configuration - Only Calendly supports OAuth for our use case
const OAUTH_CONFIGS = {
  calendly: {
    clientId: process.env.CALENDLY_CLIENT_ID,
    clientSecret: process.env.CALENDLY_CLIENT_SECRET,
    authUrl: 'https://auth.calendly.com/oauth/authorize',
    tokenUrl: 'https://auth.calendly.com/oauth/token',
    scope: 'default',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/appointment-auth/calendly/callback`
  }
  // Note: Vagaro has no public OAuth API
  // Note: Square OAuth requires complex approval process, manual URL is simpler
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; provider: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const organizationId = params.id
    const provider = params.provider

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate provider and OAuth support
    if (provider !== 'calendly') {
      return NextResponse.json({
        error: 'OAuth not supported',
        message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} doesn't support OAuth integration. Please use manual URL setup instead.`,
        manualSetup: true
      }, { status: 400 })
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

    const config = OAUTH_CONFIGS.calendly
    
    // Check if Calendly OAuth credentials are configured
    if (!config.clientId || !config.clientSecret) {
      return NextResponse.json({
        error: 'OAuth not configured',
        message: 'Calendly OAuth integration is not yet configured. Please add CALENDLY_CLIENT_ID and CALENDLY_CLIENT_SECRET to environment variables.',
        manualSetup: true
      }, { status: 501 })
    }

    // Generate state parameter for security (includes org ID and user ID)
    const state = Buffer.from(JSON.stringify({
      organizationId,
      userId: user.id,
      provider,
      timestamp: Date.now()
    })).toString('base64url')

    // Build OAuth authorization URL
    const authUrl = new URL(config.authUrl)
    authUrl.searchParams.set('client_id', config.clientId)
    authUrl.searchParams.set('redirect_uri', config.redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', config.scope)
    authUrl.searchParams.set('state', state)

    return NextResponse.json({
      authUrl: authUrl.toString(),
      provider,
      state
    })

  } catch (error) {
    console.error('Appointment auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET handler is no longer needed - callback is handled by dedicated route