import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

/**
 * GET /api/whatsapp/phone-numbers
 * Fetch phone numbers associated with the organization's WABA
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

    // Get WhatsApp connection for this organization
    const supabase = await getSupabaseServerClient()
    const { data: whatsappAccount, error: fetchError } = await supabase
      .from('whatsapp_business_accounts')
      .select('waba_id, access_token')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle()

    if (fetchError || !whatsappAccount) {
      return NextResponse.json(
        { error: 'WhatsApp not connected for this organization' },
        { status: 404 }
      )
    }

    const { waba_id, access_token } = whatsappAccount

    // Fetch phone numbers from WhatsApp API
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${waba_id}/phone_numbers`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    const phoneNumbers = data.data || []

    return NextResponse.json({
      success: true,
      phoneNumbers: phoneNumbers.map((phone: any) => ({
        id: phone.id,
        display_phone_number: phone.display_phone_number,
        verified_name: phone.verified_name,
        quality_rating: phone.quality_rating
      }))
    })
  } catch (error) {
    console.error('❌ Error fetching phone numbers:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch phone numbers' },
      { status: 500 }
    )
  }
}

