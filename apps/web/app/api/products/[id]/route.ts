import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, imageUrl, price, paymentEnabled, paymentProviderId, supportsReservations, organizationId } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    // Get current state
    const { data: current } = await supabase
      .from('products_list_tool')
      .select('price, payment_link_url, payment_provider_id, organization_id')
      .eq('id', id)
      .single()

    const priceChanged = current && current.price !== price
    const providerChanged = current && current.payment_provider_id !== paymentProviderId
    const needsRegeneration = paymentEnabled && paymentProviderId && price && (priceChanged || providerChanged || !current?.payment_link_url)

    // Update product
    const { data: product, error } = await supabase
      .from('products_list_tool')
      .update({
        name,
        description,
        image_url: imageUrl,
        price,
        payment_provider_id: paymentEnabled ? paymentProviderId : null,
        payment_link_url: paymentEnabled ? current?.payment_link_url : null,
        supports_reservations: supportsReservations
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    // Regenerate payment link if needed
    if (needsRegeneration) {
      try {
        const linkRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/create-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: organizationId || current?.organization_id,
            amount: Math.round(price * 100),
            description: name
          })
        })

        if (linkRes.ok) {
          const { paymentUrl } = await linkRes.json()
          const { data: updated } = await supabase
            .from('products_list_tool')
            .update({ payment_link_url: paymentUrl })
            .eq('id', id)
            .select()
            .single()

          return NextResponse.json({ product: updated || product })
        }
      } catch (linkError) {
        console.error('Failed to regenerate payment link:', linkError)
      }
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Products PUT API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase
      .from('products_list_tool')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Products DELETE API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
