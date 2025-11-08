import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

/**
 * GET /api/organizations/[id]/whatsapp-contacts
 * 
 * Fetches WhatsApp contacts for an organization from the whatsapp_contacts table
 * 
 * Query params:
 * - search: Optional search term to filter contacts by name or phone
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params
    const searchParams = request.nextUrl.searchParams
    const searchTerm = searchParams.get('search')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    // Build query
    let query = supabase
      .from('whatsapp_contacts')
      .select('id, name, phone_number, created_at')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true })

    // Add search filter if provided
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`)
    }

    const { data: contacts, error } = await query

    if (error) {
      console.error('❌ Error fetching WhatsApp contacts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch contacts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contacts: contacts || []
    })

  } catch (error) {
    console.error('❌ Error in whatsapp-contacts route:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/organizations/[id]/whatsapp-contacts
 * 
 * Creates a new WhatsApp contact for an organization
 * 
 * Body:
 * - name: Contact name
 * - phone: Phone number in E.164 format (e.g. +52XXXXXXXXXX)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params
    const { name, phone } = await request.json()

    if (!organizationId || !name || !phone) {
      return NextResponse.json(
        { error: 'Organization ID, name, and phone are required' },
        { status: 400 }
      )
    }

    // Validate phone format (should start with +)
    if (!phone.startsWith('+')) {
      return NextResponse.json(
        { error: 'Phone number must be in E.164 format (e.g. +52XXXXXXXXXX)' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    // Check if contact already exists
    const { data: existingContact } = await supabase
      .from('whatsapp_contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('phone_number', phone)
      .maybeSingle()

    if (existingContact) {
      return NextResponse.json(
        { error: 'Contact with this phone number already exists' },
        { status: 409 }
      )
    }

    // Create new contact
    const { data: newContact, error } = await supabase
      .from('whatsapp_contacts')
      .insert({
        organization_id: organizationId,
        name,
        phone_number: phone
      })
      .select('id, name, phone_number, created_at')
      .single()

    if (error) {
      console.error('❌ Error creating WhatsApp contact:', error)
      return NextResponse.json(
        { error: 'Failed to create contact' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contact: newContact
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error in whatsapp-contacts POST route:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

