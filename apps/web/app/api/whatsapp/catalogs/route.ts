import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

const SYSTEM_USER_TOKEN = process.env.FACEBOOK_SYSTEM_USER_TOKEN

/**
 * GET /api/whatsapp/catalogs
 * List all catalogs for the business associated with WABA
 */
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

    // Get WABA details
    const { data: whatsappAccount, error: wabaError } = await supabase
      .from('whatsapp_business_accounts')
      .select('waba_id, catalog_id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle()

    if (wabaError || !whatsappAccount) {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 404 })
    }

    if (!SYSTEM_USER_TOKEN) {
      return NextResponse.json({ error: 'System user token not configured' }, { status: 500 })
    }

    // Get business ID from WABA
    const wabaResponse = await fetch(
      `https://graph.facebook.com/v23.0/${whatsappAccount.waba_id}?fields=owner_business_info`,
      {
        headers: {
          'Authorization': `Bearer ${SYSTEM_USER_TOKEN}`
        }
      }
    )

    if (!wabaResponse.ok) {
      const error = await wabaResponse.json()
      console.error('❌ Failed to get WABA info:', error)
      return NextResponse.json({ error: 'Failed to get business info' }, { status: 500 })
    }

    const wabaData = await wabaResponse.json()
    const businessId = wabaData.owner_business_info?.id

    if (!businessId) {
      return NextResponse.json({ error: 'No business ID found for WABA' }, { status: 404 })
    }

    // List all catalogs owned by this business
    const catalogsResponse = await fetch(
      `https://graph.facebook.com/v23.0/${businessId}/owned_product_catalogs`,
      {
        headers: {
          'Authorization': `Bearer ${SYSTEM_USER_TOKEN}`
        }
      }
    )

    if (!catalogsResponse.ok) {
      const error = await catalogsResponse.json()
      console.error('❌ Failed to list catalogs:', error)
      return NextResponse.json({ error: 'Failed to list catalogs' }, { status: 500 })
    }

    const catalogsData = await catalogsResponse.json()
    const catalogs = catalogsData.data || []

    console.log(`📊 Found ${catalogs.length} catalog(s) for business ${businessId}`)

    return NextResponse.json({
      success: true,
      catalogs: catalogs.map((cat: any) => ({
        id: cat.id,
        name: cat.name
      })),
      currentCatalogId: whatsappAccount.catalog_id
    })

  } catch (error) {
    console.error('❌ Error listing catalogs:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list catalogs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/whatsapp/catalogs
 * Create a new catalog for the business
 */
export async function POST(request: NextRequest) {
  try {
    const { organizationId, catalogName } = await request.json()

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    // Get WABA details
    const { data: whatsappAccount, error: wabaError } = await supabase
      .from('whatsapp_business_accounts')
      .select('waba_id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle()

    if (wabaError || !whatsappAccount) {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 404 })
    }

    if (!SYSTEM_USER_TOKEN) {
      return NextResponse.json({ error: 'System user token not configured' }, { status: 500 })
    }

    // Get business ID from WABA
    const wabaResponse = await fetch(
      `https://graph.facebook.com/v23.0/${whatsappAccount.waba_id}?fields=owner_business_info`,
      {
        headers: {
          'Authorization': `Bearer ${SYSTEM_USER_TOKEN}`
        }
      }
    )

    if (!wabaResponse.ok) {
      const error = await wabaResponse.json()
      console.error('❌ Failed to get WABA info:', error)
      return NextResponse.json({ error: 'Failed to get business info' }, { status: 500 })
    }

    const wabaData = await wabaResponse.json()
    const businessId = wabaData.owner_business_info?.id

    if (!businessId) {
      return NextResponse.json({ error: 'No business ID found for WABA' }, { status: 404 })
    }

    console.log(`📦 Creating catalog for business ${businessId}`)

    // Create catalog
    const catalogResponse = await fetch(
      `https://graph.facebook.com/v23.0/${businessId}/owned_product_catalogs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SYSTEM_USER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: catalogName || 'Chayo Products',
          vertical: 'commerce' // Required: catalog vertical type
        })
      }
    )

    if (!catalogResponse.ok) {
      const error = await catalogResponse.json()
      console.error('❌ Failed to create catalog:', error)
      return NextResponse.json(
        { 
          error: error.error?.message || 'Failed to create catalog',
          metaError: error
        },
        { status: catalogResponse.status }
      )
    }

    const catalogData = await catalogResponse.json()
    console.log('✅ Catalog created:', catalogData)

    // Update WABA with catalog_id
    await supabase
      .from('whatsapp_business_accounts')
      .update({ catalog_id: catalogData.id })
      .eq('organization_id', organizationId)

    return NextResponse.json({
      success: true,
      catalogId: catalogData.id,
      message: 'Catalog created and linked to WhatsApp Business Account'
    })

  } catch (error) {
    console.error('❌ Error creating catalog:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create catalog' },
      { status: 500 }
    )
  }
}

