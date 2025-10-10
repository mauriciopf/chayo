import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/organizations/[id]/customers
 * Fetch all customers for an organization
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const organizationId = params.id

    // Verify user has access to this organization
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is owner or team member
    const { data: membership } = await supabase
      .from('team_members')
      .select('id, role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    const { data: organization } = await supabase
      .from('organizations')
      .select('owner_user_id')
      .eq('id', organizationId)
      .single()

    if (!organization || (organization.owner_user_id !== user.id && !membership)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch customers
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .contains('organization_ids', [organizationId])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching customers:', error)
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }

    return NextResponse.json({ customers: customers || [] })
  } catch (error) {
    console.error('Error in customers route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

