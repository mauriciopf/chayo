import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

// GET - Fetch reservations for a customer by email (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const organizationId = searchParams.get('organizationId')

    if (!email || !organizationId) {
      return NextResponse.json(
        { error: 'Email and organizationId are required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient();

    // Fetch reservations for this email and organization, including product info
    const { data: reservations, error } = await supabase
      .from('reservations_tool')
      .select(`
        id,
        product_id,
        client_name,
        client_email,
        client_phone,
        reservation_date,
        reservation_time,
        notes,
        status,
        created_at,
        products_list_tool (
          id,
          name,
          description,
          image_url,
          price
        )
      `)
      .eq('organization_id', organizationId)
      .eq('client_email', email)
      .order('reservation_date', { ascending: false })
      .order('reservation_time', { ascending: false })

    if (error) {
      console.error('Error fetching reservations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reservations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reservations: reservations || []
    })

  } catch (error) {
    console.error('Reservations GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new reservation (public endpoint for clients)
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    const {
      organizationId,
      productId,
      customerId,
      clientName,
      clientEmail,
      clientPhone,
      reservationDate,
      reservationTime,
      notes
    } = await request.json()

        // Validate required fields
        if (!organizationId || !productId || !clientEmail || !reservationDate || !reservationTime) {
          return NextResponse.json(
            { error: 'Missing required fields: organizationId, productId, clientEmail, reservationDate, reservationTime' },
            { status: 400 }
          )
        }

    // Validate organization exists
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

        // Validate product exists, belongs to organization, and supports reservations
        const { data: product, error: productError } = await supabase
          .from('products_list_tool')
          .select('id, name, price, supports_reservations')
          .eq('id', productId)
          .eq('organization_id', organizationId)
          .single()

        if (productError || !product) {
          return NextResponse.json(
            { error: 'Product not found or does not belong to this organization' },
            { status: 404 }
          )
        }

        // Check if product supports reservations
        if (!product.supports_reservations) {
          return NextResponse.json(
            { error: 'This product/service does not support reservations' },
            { status: 400 }
          )
        }

        // Create the reservation
        const { data: reservation, error: insertError} = await supabase
          .from('reservations_tool')
          .insert({
            organization_id: organizationId,
            product_id: productId,
            customer_id: customerId || null,
            client_name: clientName || null, // Optional: may not be provided during OTP login
            client_email: clientEmail,
            client_phone: clientPhone || null,
            reservation_date: reservationDate,
            reservation_time: reservationTime,
            notes: notes || null,
            status: 'pending'
          })
          .select()
          .single()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create reservation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reservation,
      product,
      message: 'Reservation created successfully!'
    })

  } catch (error) {
    console.error('Reservation creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update reservation status (public endpoint for cancellation)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { reservationId, status } = await request.json()

    if (!reservationId || !status) {
      return NextResponse.json(
        { error: 'Reservation ID and status are required' },
        { status: 400 }
      )
    }

    // Only allow cancellation from public endpoint
    if (status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Only cancellation is allowed from this endpoint' },
        { status: 403 }
      )
    }

    const { data: reservation, error } = await supabase
      .from('reservations_tool')
      .update({ status: 'cancelled' })
      .eq('id', reservationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating reservation:', error)
      return NextResponse.json(
        { error: 'Failed to cancel reservation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reservation,
      message: 'Reservation cancelled successfully'
    })

  } catch (error) {
    console.error('Reservation update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

