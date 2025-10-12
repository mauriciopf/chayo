import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/organizations/[id]/reminders
 * Fetch all reminders for an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params
    const supabase = await getSupabaseServerClient()

    // Verify user has access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check access
    const { data: membership } = await supabase
      .from('team_members')
      .select('id, role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    const { data: organization } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', organizationId)
      .single()

    if (!organization || (organization.owner_id !== user.id && !membership)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch reminders with customer info
    const { data: reminders, error } = await supabase
      .from('reminders_tool')
      .select(`
        *,
        customer:customers(id, email, full_name, avatar_url)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reminders:', error)
      return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
    }

    return NextResponse.json({ reminders: reminders || [] })
  } catch (error) {
    console.error('Error in reminders route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/organizations/[id]/reminders
 * Create a new reminder
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params
    const supabase = await getSupabaseServerClient()

    // Verify user has access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check access
    const { data: membership } = await supabase
      .from('team_members')
      .select('id, role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    const { data: organization } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', organizationId)
      .single()

    if (!organization || (organization.owner_id !== user.id && !membership)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const {
      customer_id,
      original_message,
      ai_generated_html,
      subject,
      scheduled_at,
      recurrence = 'once'
    } = body

    // Validate required fields
    if (!customer_id || !original_message || !subject || !scheduled_at) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate next_send_at for recurring reminders
    const nextSendAt = recurrence === 'once' ? null : scheduled_at

    // Create reminder
    const { data: reminder, error } = await supabase
      .from('reminders_tool')
      .insert({
        organization_id: organizationId,
        customer_id,
        original_message,
        ai_generated_html,
        subject,
        scheduled_at,
        recurrence,
        next_send_at: nextSendAt,
        status: 'pending',
        created_by: user.id
      })
      .select(`
        *,
        customer:customers(id, email, full_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Error creating reminder:', error)
      return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 })
    }

    return NextResponse.json({ reminder }, { status: 201 })
  } catch (error) {
    console.error('Error in create reminder route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

