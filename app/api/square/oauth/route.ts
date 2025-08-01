import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// POST - Initialize Square OAuth flow
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

    // Check if Square is already connected for this organization
    const { data: existingProvider } = await supabase
      .from('payment_providers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('provider_type', 'square')
      .single()

    if (existingProvider?.is_active) {
      return NextResponse.json({ 
        error: 'Square already connected',
        message: 'This organization already has an active Square connection.' 
      }, { status: 400 })
    }

    // Square OAuth configuration
    const applicationId = process.env.SQUARE_APPLICATION_ID
    const applicationSecret = process.env.SQUARE_APPLICATION_SECRET
    const environment = process.env.SQUARE_ENVIRONMENT || 'sandbox' // sandbox or production
    
    if (!applicationId || !applicationSecret) {
      return NextResponse.json({ 
        error: 'Square configuration missing',
        message: 'Square credentials are not configured on the server.' 
      }, { status: 500 })
    }

    // Generate state for security
    const state = `${organizationId}_${Date.now()}_${Math.random().toString(36).substring(2)}`
    
    // Square OAuth parameters
    const scopes = [
      'PAYMENTS_READ',
      'PAYMENTS_WRITE',
      'ORDERS_READ',
      'ORDERS_WRITE',
      'CUSTOMERS_READ',
      'CUSTOMERS_WRITE',
      'ITEMS_READ',
      'ITEMS_WRITE'
    ].join(' ')

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/square/callback`
    
    const baseUrl = environment === 'production' 
      ? 'https://connect.squareup.com' 
      : 'https://connect.squareupsandbox.com'
    
    const authUrl = new URL(`${baseUrl}/oauth2/authorize`)
    authUrl.searchParams.set('client_id', applicationId)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('session', 'false') // Don't require Square account session

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state
    })

  } catch (error) {
    console.error('Square OAuth initialization error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}