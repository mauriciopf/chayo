import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()
    let query = supabase
      .from('products_list_tool')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: products, error, count } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    return NextResponse.json({
      products,
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) }
    })
  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, name, description, imageUrl, price, paymentEnabled, paymentProviderId, supportsReservations } = body

    if (!organizationId || !name) {
      return NextResponse.json({ error: 'Organization ID and name are required' }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    // Create product with payment_enabled flag
    const { data: product, error } = await supabase
      .from('products_list_tool')
      .insert({
        organization_id: organizationId,
        name,
        description,
        image_url: imageUrl,
        price,
        payment_enabled: paymentEnabled || false,
        payment_provider_id: paymentEnabled && paymentProviderId ? paymentProviderId : null,
        supports_reservations: supportsReservations || false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    // Generate payment link if checkbox is checked AND provider is configured AND price exists
    if (paymentEnabled && paymentProviderId && price && price > 0) {
      try {
        // Check if product has active offer with discounted price
        const { data: productWithOffer } = await supabase
          .from('products_list_tool')
          .select('discounted_price, has_active_offer')
          .eq('id', product.id)
          .single()

        const finalPrice = productWithOffer?.has_active_offer && productWithOffer?.discounted_price
          ? productWithOffer.discounted_price
          : price

        const linkRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/create-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            amount: Math.round(finalPrice * 100),
            description: name,
            paymentProviderId // Pass the selected provider ID
          })
        })

        if (linkRes.ok) {
          const { paymentUrl } = await linkRes.json()
          const { data: updated } = await supabase
            .from('products_list_tool')
            .update({ payment_link_url: paymentUrl })
            .eq('id', product.id)
            .select()
            .single()
          
          return NextResponse.json({ product: updated || product })
        } else {
          const errorText = await linkRes.text()
          console.error('Failed to generate payment link:', errorText)
          // Return product anyway, link can be generated later
        }
      } catch (linkError) {
        console.error('Failed to generate payment link:', linkError)
        // Return product anyway, link can be generated later
      }
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Products POST API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
