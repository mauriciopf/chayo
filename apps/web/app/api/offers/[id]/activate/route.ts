import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/offers/[id]/activate - Activate offer for a user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { userId, organizationId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User authentication required' }, { status: 401 })
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Check if offer exists and is active
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*')
      .eq('id', params.id)
      .eq('organization_id', organizationId)
      .single()

    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    if (offer.status !== 'active') {
      return NextResponse.json({ error: 'Offer is not active' }, { status: 400 })
    }

    // Check if offer has expired
    if (new Date(offer.end_date) < new Date()) {
      return NextResponse.json({ error: 'Offer has expired' }, { status: 400 })
    }

    // Check if user has already activated this offer
    const { data: existingActivation } = await supabase
      .from('user_offer_activations')
      .select('*')
      .eq('user_id', userId)
      .eq('offer_id', params.id)
      .single()

    if (existingActivation) {
      return NextResponse.json({ 
        message: 'Offer already activated',
        activation: existingActivation
      })
    }

    // For simplicity, deactivate any other active offers for this user in this organization
    // (since we only support one active offer per user for now)
    await supabase
      .from('user_offer_activations')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('organization_id', organizationId)

    // Create new activation
    const { data: activation, error: activationError } = await supabase
      .from('user_offer_activations')
      .insert({
        user_id: userId,
        offer_id: params.id,
        organization_id: organizationId,
        is_active: true,
        activated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (activationError) {
      console.error('Error creating offer activation:', activationError)
      return NextResponse.json({ error: 'Failed to activate offer' }, { status: 500 })
    }

    // Get updated offer details with product information
    const { data: offerWithProducts } = await supabase
      .from('offers')
      .select(`
        *,
        product_offers!inner(
          products_list_tool(id, name, price, discounted_price)
        )
      `)
      .eq('id', params.id)
      .single()

    return NextResponse.json({
      message: 'Offer activated successfully',
      activation,
      offer: offerWithProducts
    })

  } catch (error) {
    console.error('Error in POST /api/offers/[id]/activate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/offers/[id]/activate - Deactivate offer for a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User authentication required' }, { status: 401 })
    }

    // Deactivate the offer for this user
    const { data: activation, error } = await supabase
      .from('user_offer_activations')
      .update({ 
        is_active: false,
        deactivated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('offer_id', params.id)
      .eq('is_active', true)
      .select()
      .single()

    if (error) {
      console.error('Error deactivating offer:', error)
      return NextResponse.json({ error: 'Failed to deactivate offer' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Offer deactivated successfully',
      activation
    })

  } catch (error) {
    console.error('Error in DELETE /api/offers/[id]/activate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
