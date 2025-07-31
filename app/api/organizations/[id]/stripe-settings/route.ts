import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// GET - Fetch Stripe settings for organization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const organizationId = params.id
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch Stripe settings (without sensitive tokens)
    const { data, error } = await supabase
      .from('stripe_settings')
      .select(`
        id,
        organization_id,
        stripe_user_id,
        payment_type,
        price_id,
        service_name,
        service_amount,
        service_currency,
        service_type,
        recurring_interval,
        is_active
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single()

    return NextResponse.json({
      settings: data || null
    })

  } catch (error) {
    console.error('Stripe settings fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update payment settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const organizationId = params.id
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const {
      paymentType,
      priceId,
      serviceName,
      serviceAmount,
      serviceCurrency,
      serviceType,
      recurringInterval
    } = await request.json()

    // Validate payment type
    if (!['dynamic', 'manual_price_id', 'custom_ui'].includes(paymentType)) {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
    }

    // Check if Stripe is connected
    const { data: existingSettings, error: fetchError } = await supabase
      .from('stripe_settings')
      .select('id, stripe_user_id, access_token')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single()

    if (fetchError || !existingSettings?.stripe_user_id) {
      return NextResponse.json({ error: 'Stripe account not connected' }, { status: 400 })
    }

    // Prepare update data
    let updateData: any = {
      payment_type: paymentType,
      updated_at: new Date().toISOString()
    }

    // Handle custom_ui option - create product/price in Stripe
    if (paymentType === 'custom_ui') {
      if (!serviceName || !serviceAmount) {
        return NextResponse.json({ error: 'Service name and amount are required for custom UI option' }, { status: 400 })
      }

      try {
        // Create product and price in Stripe
        const stripeResult = await createStripeProduct(
          existingSettings.access_token,
          serviceName,
          serviceAmount,
          serviceCurrency || 'usd',
          serviceType || 'one_time',
          recurringInterval
        )

        updateData = {
          ...updateData,
          default_product_id: stripeResult.productId,
          default_price_id: stripeResult.priceId,
          service_name: serviceName,
          service_amount: serviceAmount,
          service_currency: serviceCurrency || 'usd',
          service_type: serviceType || 'one_time',
          recurring_interval: serviceType === 'recurring' ? recurringInterval : null
        }
      } catch (stripeError) {
        console.error('Stripe API error:', stripeError)
        return NextResponse.json({ error: 'Failed to create product in Stripe' }, { status: 500 })
      }
    } else if (paymentType === 'manual_price_id') {
      if (!priceId) {
        return NextResponse.json({ error: 'Price ID is required for manual price ID option' }, { status: 400 })
      }
      updateData.price_id = priceId
    }

    // Update settings in database
    const { error: updateError } = await supabase
      .from('stripe_settings')
      .update(updateData)
      .eq('organization_id', organizationId)

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json({ error: 'Failed to update payment settings' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment settings updated successfully'
    })

  } catch (error) {
    console.error('Update payment settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Disconnect Stripe
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const organizationId = params.id
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete Stripe settings
    const { error } = await supabase
      .from('stripe_settings')
      .delete()
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to disconnect Stripe' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Stripe disconnected successfully'
    })

  } catch (error) {
    console.error('Disconnect Stripe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to create product and price in Stripe
async function createStripeProduct(
  accessToken: string,
  name: string,
  amount: number,
  currency: string,
  type: string,
  interval?: string
): Promise<{ productId: string; priceId: string }> {
  
  // Create product
  const productResponse = await fetch('https://api.stripe.com/v1/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      name,
      description: `Service created through Chayo`
    })
  })

  if (!productResponse.ok) {
    throw new Error('Failed to create Stripe product')
  }

  const product = await productResponse.json()

  // Create price
  const priceParams: any = {
    product: product.id,
    unit_amount: amount.toString(),
    currency
  }

  if (type === 'recurring') {
    priceParams.recurring = JSON.stringify({
      interval: interval || 'month'
    })
  } else {
    priceParams.billing_scheme = 'per_unit'
  }

  const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(priceParams)
  })

  if (!priceResponse.ok) {
    throw new Error('Failed to create Stripe price')
  }

  const price = await priceResponse.json()

  return {
    productId: product.id,
    priceId: price.id
  }
}