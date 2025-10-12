import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/organizations/[id]/reminders/[reminderId]
 * Update a reminder
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const { id: organizationId, reminderId } = await params
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
      original_message,
      ai_generated_html,
      subject,
      scheduled_at,
      recurrence,
      status
    } = body

    // Build update object (only include provided fields)
    const updates: any = {}
    if (original_message !== undefined) updates.original_message = original_message
    if (ai_generated_html !== undefined) updates.ai_generated_html = ai_generated_html
    if (subject !== undefined) updates.subject = subject
    if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at
    if (recurrence !== undefined) {
      updates.recurrence = recurrence
      // Update next_send_at if recurrence changed
      updates.next_send_at = recurrence === 'once' ? null : scheduled_at
    }
    if (status !== undefined) updates.status = status

    // Update reminder
    const { data: reminder, error } = await supabase
      .from('reminders_tool')
      .update(updates)
      .eq('id', reminderId)
      .eq('organization_id', organizationId)
      .select(`
        *,
        customer:customers(id, email, full_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Error updating reminder:', error)
      return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 })
    }

    return NextResponse.json({ reminder })
  } catch (error) {
    console.error('Error in update reminder route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/organizations/[id]/reminders/[reminderId]
 * Delete a reminder
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const { id: organizationId, reminderId } = await params
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

    // Delete reminder
    const { error } = await supabase
      .from('reminders_tool')
      .delete()
      .eq('id', reminderId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting reminder:', error)
      return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete reminder route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

