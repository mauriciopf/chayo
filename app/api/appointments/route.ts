import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

// POST - Create new appointment (public endpoint for clients)
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    
    const {
      organizationId,
      clientName,
      clientEmail,
      clientPhone,
      appointmentDate,
      appointmentTime,
      serviceType,
      notes
    } = await request.json()

    // Validate required fields
    if (!organizationId || !clientName || !clientEmail || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, clientName, clientEmail, appointmentDate, appointmentTime' },
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

    // Check if appointment slot is already taken
    const { data: existingAppointment, error: checkError } = await supabase
      .from('appointments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('appointment_date', appointmentDate)
      .eq('appointment_time', appointmentTime)
      .eq('status', 'pending')
      .single()

    if (!checkError && existingAppointment) {
      return NextResponse.json(
        { error: 'This time slot is already booked. Please choose a different time.' },
        { status: 409 }
      )
    }

    // Create the appointment
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        organization_id: organizationId,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone || null,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        service_type: serviceType || null,
        notes: notes || null,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      appointment,
      message: 'Appointment booked successfully!'
    })

  } catch (error) {
    console.error('Appointment booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}