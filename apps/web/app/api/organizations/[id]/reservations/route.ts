import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

// GET - Fetch reservations for organization (authenticated)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { id: organizationId } = await params;
    
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
    const productId = searchParams.get('productId')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    // Build query with product info
    let query = supabase
      .from('reservations_tool')
      .select(`
        id,
        product_id,
        customer_id,
        client_name,
        client_email,
        client_phone,
        reservation_date,
        reservation_time,
        notes,
        status,
        created_at,
        updated_at,
        products_list_tool (
          id,
          name,
          description,
          image_url,
          price
        )
      `)
      .eq('organization_id', organizationId)
      .order('reservation_date', { ascending: true })
      .order('reservation_time', { ascending: true })
      .limit(limit)

    // Apply filters if provided
    if (status) {
      query = query.eq('status', status)
    }

    if (productId) {
      query = query.eq('product_id', productId)
    }

    if (startDate) {
      query = query.gte('reservation_date', startDate)
    }

    if (endDate) {
      query = query.lte('reservation_date', endDate)
    }

    const { data: reservations, error: queryError } = await query

    if (queryError) {
      console.error('Error fetching reservations:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch reservations' },
        { status: 500 }
      )
    }

    // Get counts by status
    const { data: countData } = await supabase
      .from('reservations_tool')
      .select('status', { count: 'exact', head: false })
      .eq('organization_id', organizationId)

    const counts = {
      total: countData?.length || 0,
      pending: countData?.filter(r => r.status === 'pending').length || 0,
      confirmed: countData?.filter(r => r.status === 'confirmed').length || 0,
      completed: countData?.filter(r => r.status === 'completed').length || 0,
      cancelled: countData?.filter(r => r.status === 'cancelled').length || 0,
      no_show: countData?.filter(r => r.status === 'no_show').length || 0,
    }

    return NextResponse.json({
      reservations,
      counts
    })

  } catch (error) {
    console.error('Error in reservations GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update reservation status (authenticated)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { id: organizationId } = await params;
    
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

    const { reservationId, status } = await request.json()

    if (!reservationId || !status) {
      return NextResponse.json(
        { error: 'Reservation ID and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Update the reservation
    const { data: reservation, error: updateError } = await supabase
      .from('reservations_tool')
      .update({ status })
      .eq('id', reservationId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating reservation:', updateError)
      return NextResponse.json(
        { error: 'Failed to update reservation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reservation
    })

  } catch (error) {
    console.error('Error in reservations PATCH:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel/delete reservation (authenticated)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { id: organizationId } = await params;
    
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

    const { searchParams } = new URL(request.url)
    const reservationId = searchParams.get('reservationId')

    if (!reservationId) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      )
    }

    // Delete the reservation
    const { error: deleteError } = await supabase
      .from('reservations_tool')
      .delete()
      .eq('id', reservationId)
      .eq('organization_id', organizationId)

    if (deleteError) {
      console.error('Error deleting reservation:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete reservation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Reservation deleted successfully'
    })

  } catch (error) {
    console.error('Error in reservations DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

