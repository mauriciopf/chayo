import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('whatsapp_business_accounts')
      .select('id, waba_id, phone_number_id, is_active')
      .eq('organization_id', organizationId)
      .eq('is_active', true)  // Only get active accounts
      .maybeSingle()  // Changed from .single() to handle no results gracefully

    if (error || !data) {
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: true,  // If we have data, it's connected
      wabaId: data.waba_id,
      phoneNumberId: data.phone_number_id
    })

  } catch (error) {
    console.error('❌ Error checking WhatsApp status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


