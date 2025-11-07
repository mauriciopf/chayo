import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

/**
 * POST /api/whatsapp/disconnect
 * Disconnect (deactivate) the current WABA from an organization
 * This allows the user to connect a different WABA
 */
export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await request.json()

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    console.log('🔌 Disconnecting WABA for organization:', organizationId)

    const supabase = await getSupabaseServerClient()

    // Get current WABA configuration
    const { data: currentWaba } = await supabase
      .from('whatsapp_business_accounts')
      .select('waba_id, phone_number_id')
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (!currentWaba) {
      return NextResponse.json(
        { error: 'No WhatsApp Business Account connected' },
        { status: 404 }
      )
    }

    // Delete the WhatsApp configuration
    // User can reconnect the same or different WABA afterward
    const { error } = await supabase
      .from('whatsapp_business_accounts')
      .delete()
      .eq('organization_id', organizationId)

    if (error) {
      console.error('❌ Failed to disconnect WABA:', error)
      return NextResponse.json(
        { error: 'Failed to disconnect WhatsApp Business Account' },
        { status: 500 }
      )
    }

    console.log('✅ WABA disconnected successfully')

    return NextResponse.json({
      success: true,
      message: 'WhatsApp Business Account disconnected successfully',
      wabaId: currentWaba.waba_id
    })

  } catch (error) {
    console.error('❌ Error disconnecting WABA:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

