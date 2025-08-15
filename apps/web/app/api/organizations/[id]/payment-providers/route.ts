import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

// GET - List payment providers for organization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const organizationId = params.id

    // Get the current user and verify access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Get payment providers for this organization
    const { data: providers, error: providersError } = await supabase
      .from('payment_providers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_default', { ascending: false })
      .order('provider_type')

    if (providersError) {
      console.error('Error fetching payment providers:', providersError)
      return NextResponse.json({ error: 'Failed to fetch payment providers' }, { status: 500 })
    }

    return NextResponse.json({ providers: providers || [] })
  } catch (error) {
    console.error('Error in payment providers GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new payment provider (used during OAuth flow)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const organizationId = params.id

    // Get the current user and verify access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const {
      provider_type,
      provider_account_id,
      access_token,
      refresh_token,
      token_expires_at,
      scope,
      provider_settings,
      payment_type = 'manual_price_id',
      is_default = false
    } = await request.json()

    // Validate required fields
    if (!provider_type || !['stripe', 'paypal', 'square'].includes(provider_type)) {
      return NextResponse.json({ error: 'Valid provider_type is required' }, { status: 400 })
    }

    // Check if provider already exists for this organization
    const { data: existingProvider } = await supabase
      .from('payment_providers')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('provider_type', provider_type)
      .single()

    if (existingProvider) {
      return NextResponse.json({ 
        error: `${provider_type.toUpperCase()} is already connected to this organization` 
      }, { status: 400 })
    }

    // If this is the first provider, make it default
    const { data: existingProviders } = await supabase
      .from('payment_providers')
      .select('id')
      .eq('organization_id', organizationId)

    const shouldBeDefault = is_default || (existingProviders?.length === 0)

    // Create new payment provider
    const { data: newProvider, error: createError } = await supabase
      .from('payment_providers')
      .insert({
        organization_id: organizationId,
        provider_type,
        provider_account_id,
        access_token,
        refresh_token,
        token_expires_at,
        scope,
        provider_settings: provider_settings || {},
        payment_type,
        is_active: true,
        is_default: shouldBeDefault
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating payment provider:', createError)
      return NextResponse.json({ error: 'Failed to create payment provider' }, { status: 500 })
    }

    return NextResponse.json({ provider: newProvider })
  } catch (error) {
    console.error('Error in payment providers POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}