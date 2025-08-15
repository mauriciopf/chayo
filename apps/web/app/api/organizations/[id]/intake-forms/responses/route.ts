import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

// GET: Fetch form responses for an organization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const organizationId = params.id
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId') // Optional filter by specific form

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a member of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build the query
    let query = supabase
      .from('intake_form_responses')
      .select(`
        id,
        form_id,
        client_name,
        client_email,
        responses,
        submitted_at,
        intake_forms (
          id,
          name,
          description
        )
      `)
      .eq('organization_id', organizationId)
      .order('submitted_at', { ascending: false })

    // Filter by specific form if provided
    if (formId) {
      query = query.eq('form_id', formId)
    }

    const { data: responses, error } = await query

    if (error) {
      console.error('Error fetching form responses:', error)
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
    }

    return NextResponse.json({ responses })

  } catch (error) {
    console.error('Form responses GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}