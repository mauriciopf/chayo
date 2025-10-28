import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'
import { OfferImageService } from '@/lib/shared/services/offerImageService'

// GET /api/offers/[id] - Get specific offer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { id } = await params
    const { data: offer, error } = await supabase
      .from('offers')
      .select(`
        *,
        product_count:product_offers(count),
        assigned_products:product_offers(product_id)
      `)
      .eq('id', id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { id } = await params
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
      .eq('id', id)
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
      .eq('offer_id', id)

    // Then, create new associations
    const productOffers = selectedProducts.map((productId: string) => ({
      offer_id: id,
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
      await updateProductPricing(id)
    }

    // Regenerate AI banner with updated information
    try {
      await regenerateAIBanner(id, offer.name, offer.description, selectedProducts)
    } catch (error) {
      console.error('AI banner regeneration failed:', error)
      // Don't fail the offer update if banner generation fails
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { id } = await params
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
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating offer status:', error)
      return NextResponse.json({ error: 'Failed to update offer status' }, { status: 500 })
    }

    // Update product pricing based on new status
    if (status === 'active') {
      await updateProductPricing(id)
    } else {
      await removeProductPricing(id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { id } = await params
    
    // Get offer details to clean up banner image
    const { data: offer } = await supabase
      .from('offers')
      .select('ai_banner_url')
      .eq('id', id)
      .single()
    
    // Clean up banner image if it exists
    if (offer?.ai_banner_url) {
      const offerImageService = new OfferImageService(supabase)
      await offerImageService.cleanupOldOfferImage(offer.ai_banner_url)
      console.log('Cleaned up banner image for deleted offer:', id)
    }
    
    // First remove product pricing
    await removeProductPricing(id)

    // Delete product associations (cascade will handle this, but being explicit)
    await supabase
      .from('product_offers')
      .delete()
      .eq('offer_id', id)

    // Delete user activations
    await supabase
      .from('user_offer_activations')
      .delete()
      .eq('offer_id', id)

    // Delete the offer
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id)

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
    const supabase = await getSupabaseServerClient()
    
    // Get products affected by this offer BEFORE updating prices
    const { data: productOffers } = await supabase
      .from('product_offers')
      .select('product_id')
      .eq('offer_id', offerId)
    
    const productIds = productOffers?.map(po => po.product_id) || []
    
    // Call the database function to update product discounted prices
    const { error } = await supabase.rpc('update_product_discounted_prices', {
      offer_uuid: offerId
    })

    if (error) {
      console.error('Error updating product pricing:', error)
    }

    // Regenerate payment links for affected products
    if (productIds.length > 0) {
      const { regeneratePaymentLinksForProducts } = await import('@/lib/shared/services/PaymentLinkRegenerationService')
      await regeneratePaymentLinksForProducts(productIds)
    }
  } catch (error) {
    console.error('Error in updateProductPricing:', error)
  }
}

// Helper function to remove product pricing
async function removeProductPricing(offerId: string) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get products affected by this offer BEFORE removing prices
    const { data: productOffers } = await supabase
      .from('product_offers')
      .select('product_id')
      .eq('offer_id', offerId)
    
    const productIds = productOffers?.map(po => po.product_id) || []
    
    // Call the database function to remove product discounted prices
    const { error } = await supabase.rpc('remove_product_discounted_prices', {
      offer_uuid: offerId
    })

    if (error) {
      console.error('Error removing product pricing:', error)
    }

    // Regenerate payment links for affected products (back to regular price)
    if (productIds.length > 0) {
      const { regeneratePaymentLinksForProducts } = await import('@/lib/shared/services/PaymentLinkRegenerationService')
      await regeneratePaymentLinksForProducts(productIds)
    }
  } catch (error) {
    console.error('Error in removeProductPricing:', error)
  }
}

// Helper function to regenerate AI banner
async function regenerateAIBanner(offerId: string, offerName: string, offerDescription: string, productIds: string[]) {
  try {
    const supabase = await getSupabaseServerClient()
    
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
Make it visually appealing for e-commerce promotion. Include promotional elements like discount badges or sale indicators.
High quality, commercial-ready design.`

    // Generate image with OpenAI DALL-E
    const openai = new (await import('openai')).default({
      apiKey: process.env.OPENAI_API_KEY!
    })

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1792x1024", // High quality banner size
      quality: "hd",
      style: "vivid"
    })

    const imageUrl = imageResponse.data?.[0]?.url

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI')
    }

    // Update offer with banner URL and prompt
    const { error: updateError } = await supabase
      .from('offers')
      .update({
        ai_banner_url: imageUrl,
        ai_banner_prompt: prompt,
        banner_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId)

    if (updateError) {
      console.error('Error updating offer with banner:', updateError)
      throw updateError
    }

    console.log(`AI banner regenerated successfully for offer ${offerId}`)
    
  } catch (error) {
    console.error('Error in regenerateAIBanner:', error)
    throw error
  }
}
