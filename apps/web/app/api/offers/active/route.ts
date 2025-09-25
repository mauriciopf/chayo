import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/offers/active - Get active offers for an organization (mobile)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const userId = searchParams.get('userId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Get active offers for the organization
    const { data: offers, error: offersError } = await supabase
      .from('offers')
      .select(`
        *,
        product_offers!inner(
          products_list_tool(id, name, description, price, discounted_price, image_url)
        )
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString()) // Not expired
      .order('created_at', { ascending: false })

    if (offersError) {
      console.error('Error fetching active offers:', offersError)
      return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
    }

    // If user is provided, check which offers they have activated
    let userActivations = []
    if (userId) {
      const { data: activations } = await supabase
        .from('user_offer_activations')
        .select('offer_id, activated_at')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      userActivations = activations || []
    }

    // Transform offers data
    const transformedOffers = offers?.map(offer => {
      const products = offer.product_offers?.map((po: any) => po.products_list_tool) || []
      const isActivatedByUser = userActivations.some((activation: any) => activation.offer_id === offer.id)
      
      return {
        ...offer,
        products,
        product_count: products.length,
        is_activated_by_user: isActivatedByUser,
        activated_at: userActivations.find((activation: any) => activation.offer_id === offer.id)?.activated_at || null
      }
    }) || []

    return NextResponse.json({ 
      offers: transformedOffers,
      total: transformedOffers.length
    })

  } catch (error) {
    console.error('Error in GET /api/offers/active:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
