import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

// GET - Fetch appointments for organization (authenticated)
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

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    // Build query
    let query = supabase
      .from('appointments')
      .select(`
        id,
        client_name,
        client_email,
        client_phone,
        appointment_date,
        appointment_time,
        service_type,
        notes,
        status,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(limit)

    // Apply filters if provided
    if (status) {
      query = query.eq('status', status)
    }

    if (startDate) {
      query = query.gte('appointment_date', startDate)
    }

    if (endDate) {
      query = query.lte('appointment_date', endDate)
    }

    const { data: appointments, error: fetchError } = await query

    if (fetchError) {
      console.error('Database error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      )
    }

    // Get appointment counts by status
    const { data: statusCounts, error: countError } = await supabase
      .from('appointments')
      .select('status')
      .eq('organization_id', organizationId)

    const counts = {
      total: statusCounts?.length || 0,
      pending: statusCounts?.filter(a => a.status === 'pending').length || 0,
      confirmed: statusCounts?.filter(a => a.status === 'confirmed').length || 0,
      completed: statusCounts?.filter(a => a.status === 'completed').length || 0,
      cancelled: statusCounts?.filter(a => a.status === 'cancelled').length || 0
    }

    return NextResponse.json({
      appointments,
      counts,
      total: appointments?.length || 0
    })

  } catch (error) {
    console.error('Fetch appointments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update appointment status (authenticated)
export async function PATCH(
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

    const { appointmentId, status, notes } = await request.json()

    // Validate required fields
    if (!appointmentId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: appointmentId, status' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, confirmed, cancelled, completed' },
        { status: 400 }
      )
    }

    // Update the appointment
    const updateData: any = { status }
    if (notes !== undefined) {
      updateData.notes = notes
    }

    const { data: appointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      )
    }

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      appointment,
      message: 'Appointment updated successfully!'
    })

  } catch (error) {
    console.error('Update appointment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}