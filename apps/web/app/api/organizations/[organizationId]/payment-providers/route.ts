import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

/**
 * GET /api/organizations/[organizationId]/payment-providers
 * Fetches all active payment providers for an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params
    const supabase = await getSupabaseServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch payment providers for this organization
    const { data: providers, error: providersError } = await supabase
      .from('payment_providers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (providersError) {
      console.error('Error fetching payment providers:', providersError)
      return NextResponse.json(
        { error: 'Failed to fetch payment providers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      providers: providers || []
    })

  } catch (error) {
    console.error('Payment providers API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

