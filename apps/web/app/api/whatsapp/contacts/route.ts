import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

/**
 * GET /api/whatsapp/contacts
 * Fetch customers who have messaged this business
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()
    
    // Fetch all contacts for this organization, ordered by most recent
    const { data: contacts, error } = await supabase
      .from('whatsapp_contacts')
      .select('id, phone_number, name, last_message_at')
      .eq('organization_id', organizationId)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching contacts:', error)
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
    console.error('❌ Error fetching contacts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

