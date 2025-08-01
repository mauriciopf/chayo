import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const organizationId = params.id
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { provider, providerUrl } = await request.json()

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    // Validate provider
    const validProviders = ['calendly', 'vagaro', 'square', 'custom']
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    // Validate URL for manual setup providers (Vagaro, Square)
    // Calendly might get URL from OAuth, so it's optional here
    if ((provider === 'vagaro' || provider === 'square') && !providerUrl) {
      return NextResponse.json({ error: 'Provider URL is required for Vagaro and Square' }, { status: 400 })
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

    // Create or update appointment settings
    const { data, error } = await supabase
      .from('appointment_settings')
      .upsert({
        organization_id: organizationId,
        provider,
        provider_url: providerUrl || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to save appointment settings' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Appointment settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const organizationId = params.id
    
    // Get the current user
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

    // Get appointment settings
    const { data, error } = await supabase
      .from('appointment_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch appointment settings' }, { status: 500 })
    }

    return NextResponse.json({
      settings: data || null
    })

  } catch (error) {
    console.error('Appointment settings fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const organizationId = params.id
    
    // Get the current user
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

    // Delete appointment settings
    const { error } = await supabase
      .from('appointment_settings')
      .delete()
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to disconnect provider' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Provider disconnected successfully'
    })

  } catch (error) {
    console.error('Disconnect provider error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

