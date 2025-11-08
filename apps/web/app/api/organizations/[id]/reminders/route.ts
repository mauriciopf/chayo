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
      channel = 'email',
      customer_id,
      manual_email,
      manual_name,
      whatsapp_phone,
      whatsapp_template_name,
      original_message,
      ai_generated_html,
      subject,
      scheduled_at,
      recurrence = 'once'
    } = body

    // Validate channel
    if (!['email', 'whatsapp'].includes(channel)) {
      return NextResponse.json(
        { error: 'Invalid channel. Must be "email" or "whatsapp".' },
        { status: 400 }
      )
    }

    // Validate required fields based on channel
    if (channel === 'email') {
      if ((!customer_id && !manual_email) || !original_message || !subject || !scheduled_at) {
        return NextResponse.json(
          { error: 'Missing required fields for email reminder. Provide customer_id or manual_email, original_message, subject, and scheduled_at.' },
          { status: 400 }
        )
      }

      // Validate email format if using manual email
      if (manual_email && !manual_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    } else if (channel === 'whatsapp') {
      if (!whatsapp_phone || !original_message || !scheduled_at) {
        return NextResponse.json(
          { error: 'Missing required fields for WhatsApp reminder. Provide whatsapp_phone, original_message, and scheduled_at.' },
          { status: 400 }
        )
      }

      // Validate phone format (E.164)
      if (!whatsapp_phone.startsWith('+')) {
        return NextResponse.json(
          { error: 'WhatsApp phone number must be in E.164 format (e.g. +52XXXXXXXXXX)' },
          { status: 400 }
        )
      }
    }

    // Calculate next_send_at for recurring reminders
    const nextSendAt = recurrence === 'once' ? null : scheduled_at

    // Build reminder data
    const reminderData: any = {
      organization_id: organizationId,
      channel,
      original_message,
      scheduled_at,
      recurrence,
      next_send_at: nextSendAt,
      status: 'pending',
      created_by: user.id
    }

    // Add channel-specific fields
    if (channel === 'email') {
      reminderData.subject = subject
      reminderData.ai_generated_html = ai_generated_html

      // Add either customer_id OR manual email fields
      if (customer_id) {
        reminderData.customer_id = customer_id
      } else if (manual_email) {
        reminderData.manual_email = manual_email.toLowerCase().trim()
        reminderData.manual_name = manual_name || null
      }
    } else if (channel === 'whatsapp') {
      reminderData.whatsapp_phone = whatsapp_phone
      reminderData.whatsapp_template_name = whatsapp_template_name || null

      // Optionally link to customer if provided
      if (customer_id) {
        reminderData.customer_id = customer_id
      }
    }

    // Create reminder
    const { data: reminder, error } = await supabase
      .from('reminders_tool')
      .insert(reminderData)
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

