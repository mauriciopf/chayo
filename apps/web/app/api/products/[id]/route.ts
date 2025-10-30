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

    // Get current state to detect changes
    const { data: current } = await supabase
      .from('products_list_tool')
      .select('price, payment_enabled, payment_link_url, payment_link_id, payment_provider_id, organization_id, discounted_price, has_active_offer')
      .eq('id', id)
      .single()

    if (!current) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Determine if we need to generate/regenerate/remove payment link
    const wasEnabled = current.payment_enabled
    const nowEnabled = paymentEnabled || false
    const priceChanged = current.price !== price
    const providerChanged = current.payment_provider_id !== paymentProviderId
    const paymentToggled = wasEnabled !== nowEnabled

    // Update product
    const updateData: any = {
      name,
      description,
      image_url: imageUrl,
      price,
      payment_enabled: nowEnabled,
      supports_reservations: supportsReservations
    }

    // Handle payment link based on payment_enabled state
    if (nowEnabled && paymentProviderId) {
      updateData.payment_provider_id = paymentProviderId
      // Keep existing link if not regenerating
      if (!priceChanged && !providerChanged && current.payment_link_url) {
        updateData.payment_link_url = current.payment_link_url
      }
    } else if (!nowEnabled) {
      // Payment disabled - clear link but allow provider change
      updateData.payment_link_url = null
      // If provider changed while disabled, save the new selection
      if (paymentProviderId && paymentProviderId !== current.payment_provider_id) {
        updateData.payment_provider_id = paymentProviderId
      }
      // Note: if paymentProviderId is undefined, we don't touch it (keeps current)
    } else if (nowEnabled && !paymentProviderId) {
      // Enabled but no provider selected - clear link
      updateData.payment_link_url = null
    }

    const { data: product, error } = await supabase
      .from('products_list_tool')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    // Generate/Regenerate payment link if:
    // 1. Payment is enabled
    // 2. Provider is configured
    // 3. Price exists and > 0
    // 4. AND (no link exists OR price changed OR provider changed OR just enabled)
    const needsRegeneration = 
      nowEnabled && 
      paymentProviderId && 
      price && 
      price > 0 && 
      (!current.payment_link_url || priceChanged || providerChanged || paymentToggled)

    if (needsRegeneration) {
      try {
        // Use discounted price if active offer exists, otherwise regular price
        const finalPrice = current.has_active_offer && current.discounted_price
          ? current.discounted_price
          : price

        console.log('🔗 Generating payment link:', {
          productId: id,
          finalPrice,
          paymentProviderId,
          organizationId: organizationId || current.organization_id
        })

        const linkRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/create-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: organizationId || current.organization_id,
            amount: finalPrice, // Send in dollars, will be converted to cents by calculatePaymentAmount
            description: name,
            paymentProviderId, // Pass the selected provider ID
            oldPaymentLinkId: current.payment_link_id // Pass old link ID for deactivation
          })
        })

        if (linkRes.ok) {
          const { paymentUrl, transaction } = await linkRes.json()
          console.log('✅ Payment link created:', paymentUrl)
          
          const { data: updated } = await supabase
            .from('products_list_tool')
            .update({ 
              payment_link_url: paymentUrl,
              payment_link_id: transaction?.payment_link_id || null // Store new payment_link_id
            })
            .eq('id', id)
            .select()
            .single()

          return NextResponse.json({ product: updated || product })
        } else {
          const errorText = await linkRes.text()
          console.error('❌ Failed to generate payment link:', errorText)
          
          // Parse error for better user feedback
          let errorMessage = 'Failed to generate payment link'
          try {
            const errorJson = JSON.parse(errorText)
            if (errorJson.error?.includes('business name')) {
              errorMessage = 'Stripe account setup incomplete: Please add a business name in your Stripe Dashboard under Settings > Business details'
            } else {
              errorMessage = errorJson.error || errorMessage
            }
          } catch (e) {
            // Use raw error text if not JSON
            if (errorText.includes('business name')) {
              errorMessage = 'Stripe account setup incomplete: Please add a business name in your Stripe Dashboard'
            }
          }
          
          // Return product with error message
          return NextResponse.json({ 
            product,
            warning: errorMessage 
          })
        }
      } catch (linkError) {
        console.error('❌ Exception generating payment link:', linkError)
        // Return product anyway, link can be generated later
        return NextResponse.json({ 
          product,
          warning: 'Failed to generate payment link. Please try again.' 
        })
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
