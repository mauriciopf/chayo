import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/offers - Fetch all offers for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Fetch offers with product count
    const { data: offers, error } = await supabase
      .from('offers')
      .select(`
        *,
        product_count:product_offers(count),
        assigned_products:product_offers(product_id)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching offers:', error)
      return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
    }

    // Transform the data to include product count and assigned products array
    const transformedOffers = offers?.map(offer => ({
      ...offer,
      product_count: offer.product_count?.[0]?.count || 0,
      assigned_products: offer.assigned_products?.map((p: any) => p.product_id) || []
    })) || []

    return NextResponse.json({ offers: transformedOffers })
  } catch (error) {
    console.error('Error in GET /api/offers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/offers - Create a new offer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      name,
      description,
      offer_type,
      offer_value,
      start_date,
      end_date,
      selectedProducts
    } = body

    // Validation
    if (!organizationId || !name || !description || !offer_type || !offer_value || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!selectedProducts || selectedProducts.length === 0) {
      return NextResponse.json({ error: 'At least one product must be selected' }, { status: 400 })
    }

    if (offer_type === 'percentage' && (offer_value <= 0 || offer_value > 100)) {
      return NextResponse.json({ error: 'Percentage must be between 1 and 100' }, { status: 400 })
    }

    if (offer_type === 'fixed_amount' && offer_value <= 0) {
      return NextResponse.json({ error: 'Fixed amount must be greater than 0' }, { status: 400 })
    }

    // Start transaction
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .insert({
        organization_id: organizationId,
        name,
        description,
        offer_type,
        offer_value,
        start_date,
        end_date,
        status: 'inactive' // Start as inactive until user activates
      })
      .select()
      .single()

    if (offerError) {
      console.error('Error creating offer:', offerError)
      return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 })
    }

    // Create product-offer associations
    const productOffers = selectedProducts.map((productId: string) => ({
      offer_id: offer.id,
      product_id: productId
    }))

    const { error: productOffersError } = await supabase
      .from('product_offers')
      .insert(productOffers)

    if (productOffersError) {
      console.error('Error creating product offers:', productOffersError)
      // Cleanup: delete the offer if product associations failed
      await supabase.from('offers').delete().eq('id', offer.id)
      return NextResponse.json({ error: 'Failed to associate products with offer' }, { status: 500 })
    }

    // Generate AI banner in the background (don't wait for it)
    generateAIBanner(offer.id, offer.name, offer.description, selectedProducts)
      .catch(error => console.error('Background AI banner generation failed:', error))

    return NextResponse.json({ 
      offer: {
        ...offer,
        product_count: selectedProducts.length,
        assigned_products: selectedProducts
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/offers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Background function to generate AI banner
async function generateAIBanner(offerId: string, offerName: string, offerDescription: string, productIds: string[]) {
  try {
    // Fetch product details for AI prompt
    const { data: products } = await supabase
      .from('products_list_tool')
      .select('name, description')
      .in('id', productIds)

    const productNames = products?.map(p => p.name).join(', ') || 'products'
    
    // Create AI prompt
    const prompt = `Create a stunning promotional banner for "${offerName}". 
Description: ${offerDescription}
Products included: ${productNames}
Style: Modern, eye-catching, professional marketing banner with vibrant colors and clear text.
Include the offer name prominently and make it visually appealing for e-commerce.`

    // Call AI banner generation API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/offers/${offerId}/generate-banner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    })

    if (!response.ok) {
      throw new Error('AI banner generation failed')
    }

    console.log(`AI banner generated successfully for offer ${offerId}`)
  } catch (error) {
    console.error('Error generating AI banner:', error)
  }
}
