import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'
import { PaymentLinkService } from '@/lib/services/PaymentLinkService'

/**
 * POST /api/products/[productId]/generate-payment-link
 * 
 * Automatically generates a payment link for a product based on its configured provider.
 * This endpoint is called when:
 * 1. A product is created/updated with payment_enabled = true
 * 2. A payment provider is connected/changed for a product
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const supabase = await getSupabaseServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products_list_tool')
      .select('*, organization_id')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', product.organization_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if payment is enabled
    if (!product.payment_enabled || !product.payment_provider_id) {
      return NextResponse.json({
        error: 'Payment not enabled for this product or no provider configured'
      }, { status: 400 })
    }

    // Get payment provider details
    const { data: provider, error: providerError } = await supabase
      .from('payment_providers')
      .select('*')
      .eq('id', product.payment_provider_id)
      .eq('is_active', true)
      .single()

    if (providerError || !provider) {
      return NextResponse.json({
        error: 'Payment provider not found or inactive'
      }, { status: 400 })
    }

    // Validate product has required fields
    if (!product.name || !product.price) {
      return NextResponse.json({
        error: 'Product must have name and price to generate payment link'
      }, { status: 400 })
    }

    // Generate payment link using the unified service
    const paymentLinkResponse = await PaymentLinkService.createPaymentLink(
      {
        productId: product.id,
        productName: product.name,
        productDescription: product.description || undefined,
        price: parseFloat(product.price),
        currency: 'USD', // TODO: Make this configurable per organization
        imageUrl: product.image_url || undefined,
        organizationId: product.organization_id
      },
      provider
    )

    // Update product with payment link
    const { error: updateError } = await supabase
      .from('products_list_tool')
      .update({
        payment_link_url: paymentLinkResponse.paymentLinkUrl,
        payment_link_id: paymentLinkResponse.paymentLinkId,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)

    if (updateError) {
      console.error('Error updating product with payment link:', updateError)
      return NextResponse.json({
        error: 'Failed to save payment link'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      paymentLink: paymentLinkResponse.paymentLinkUrl,
      provider: provider.provider_type,
      message: `Payment link generated successfully via ${provider.provider_type}`
    })

  } catch (error) {
    console.error('Error generating payment link:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to generate payment link'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/products/[productId]/generate-payment-link
 * 
 * Removes the payment link from a product
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const supabase = await getSupabaseServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update product to remove payment link
    const { error: updateError } = await supabase
      .from('products_list_tool')
      .update({
        payment_link_url: null,
        payment_link_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)

    if (updateError) {
      return NextResponse.json({
        error: 'Failed to remove payment link'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment link removed successfully'
    })

  } catch (error) {
    console.error('Error removing payment link:', error)
    return NextResponse.json({
      error: 'Failed to remove payment link'
    }, { status: 500 })
  }
}

