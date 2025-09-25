import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/offers/[id] - Get specific offer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: offer, error } = await supabase
      .from('offers')
      .select(`
        *,
        product_count:product_offers(count),
        assigned_products:product_offers(product_id)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching offer:', error)
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    // Transform the data
    const transformedOffer = {
      ...offer,
      product_count: offer.product_count?.[0]?.count || 0,
      assigned_products: offer.assigned_products?.map((p: any) => p.product_id) || []
    }

    return NextResponse.json({ offer: transformedOffer })
  } catch (error) {
    console.error('Error in GET /api/offers/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/offers/[id] - Update offer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      offer_type,
      offer_value,
      start_date,
      end_date,
      selectedProducts
    } = body

    // Validation
    if (!name || !description || !offer_type || !offer_value || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!selectedProducts || selectedProducts.length === 0) {
      return NextResponse.json({ error: 'At least one product must be selected' }, { status: 400 })
    }

    // Update offer
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .update({
        name,
        description,
        offer_type,
        offer_value,
        start_date,
        end_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (offerError) {
      console.error('Error updating offer:', offerError)
      return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 })
    }

    // Update product associations
    // First, delete existing associations
    await supabase
      .from('product_offers')
      .delete()
      .eq('offer_id', params.id)

    // Then, create new associations
    const productOffers = selectedProducts.map((productId: string) => ({
      offer_id: params.id,
      product_id: productId
    }))

    const { error: productOffersError } = await supabase
      .from('product_offers')
      .insert(productOffers)

    if (productOffersError) {
      console.error('Error updating product offers:', productOffersError)
      return NextResponse.json({ error: 'Failed to update product associations' }, { status: 500 })
    }

    // Update product pricing if offer is active
    if (offer.status === 'active') {
      await updateProductPricing(params.id)
    }

    return NextResponse.json({ 
      offer: {
        ...offer,
        product_count: selectedProducts.length,
        assigned_products: selectedProducts
      }
    })

  } catch (error) {
    console.error('Error in PUT /api/offers/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/offers/[id] - Update offer status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    if (!status || !['active', 'inactive', 'expired'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update offer status
    const { data: offer, error } = await supabase
      .from('offers')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating offer status:', error)
      return NextResponse.json({ error: 'Failed to update offer status' }, { status: 500 })
    }

    // Update product pricing based on new status
    if (status === 'active') {
      await updateProductPricing(params.id)
    } else {
      await removeProductPricing(params.id)
    }

    return NextResponse.json({ offer })
  } catch (error) {
    console.error('Error in PATCH /api/offers/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/offers/[id] - Delete offer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First remove product pricing
    await removeProductPricing(params.id)

    // Delete product associations (cascade will handle this, but being explicit)
    await supabase
      .from('product_offers')
      .delete()
      .eq('offer_id', params.id)

    // Delete user activations
    await supabase
      .from('user_offer_activations')
      .delete()
      .eq('offer_id', params.id)

    // Delete the offer
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting offer:', error)
      return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/offers/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to update product pricing
async function updateProductPricing(offerId: string) {
  try {
    // Call the database function to update product discounted prices
    const { error } = await supabase.rpc('update_product_discounted_prices', {
      offer_uuid: offerId
    })

    if (error) {
      console.error('Error updating product pricing:', error)
    }
  } catch (error) {
    console.error('Error in updateProductPricing:', error)
  }
}

// Helper function to remove product pricing
async function removeProductPricing(offerId: string) {
  try {
    // Call the database function to remove product discounted prices
    const { error } = await supabase.rpc('remove_product_discounted_prices', {
      offer_uuid: offerId
    })

    if (error) {
      console.error('Error removing product pricing:', error)
    }
  } catch (error) {
    console.error('Error in removeProductPricing:', error)
  }
}
