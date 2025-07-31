import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// POST - Create payment link
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    
    const {
      organizationId,
      amount, // For dynamic pricing only
      customerEmail,
      customerName,
      description
    } = await request.json()

    // Validate required fields
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Get organization and verify it exists
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get Stripe settings for this organization
    const { data: stripeSettings, error: stripeError } = await supabase
      .from('stripe_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single()

    if (stripeError || !stripeSettings) {
      return NextResponse.json(
        { error: 'Stripe not configured for this organization' },
        { status: 400 }
      )
    }

    let paymentLinkUrl: string
    let paymentAmount: number | null = null
    let transactionData: any

    // Handle different payment types
    if (stripeSettings.payment_type === 'dynamic') {
      // Dynamic pricing - create Stripe Checkout session
      if (!amount || amount <= 0) {
        return NextResponse.json(
          { error: 'Amount is required for dynamic pricing' },
          { status: 400 }
        )
      }

      paymentAmount = Math.round(amount * 100) // Convert to cents
      
      const checkoutSession = await createStripeCheckoutSession(
        stripeSettings.access_token,
        paymentAmount,
        stripeSettings.service_currency || 'usd',
        description || `Payment for ${organization.name}`,
        customerEmail,
        `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
        `${process.env.NEXT_PUBLIC_APP_URL}/payment-cancelled`
      )

      paymentLinkUrl = checkoutSession.url
      transactionData = {
        stripe_checkout_session_id: checkoutSession.id,
        payment_type: 'dynamic'
      }

    } else if (stripeSettings.payment_type === 'manual_price_id') {
      // Manual Price ID - create payment link
      if (!stripeSettings.price_id) {
        return NextResponse.json(
          { error: 'Price ID not configured' },
          { status: 400 }
        )
      }

      const paymentLink = await createStripePaymentLink(
        stripeSettings.access_token,
        stripeSettings.price_id
      )

      paymentLinkUrl = paymentLink.url
      transactionData = {
        stripe_payment_link_id: paymentLink.id,
        payment_type: 'manual_price_id'
      }

    } else if (stripeSettings.payment_type === 'custom_ui') {
      // Custom UI - use default price created in Chayo
      if (!stripeSettings.default_price_id) {
        return NextResponse.json(
          { error: 'Default price not configured' },
          { status: 400 }
        )
      }

      const paymentLink = await createStripePaymentLink(
        stripeSettings.access_token,
        stripeSettings.default_price_id
      )

      paymentLinkUrl = paymentLink.url
      paymentAmount = stripeSettings.service_amount
      transactionData = {
        stripe_payment_link_id: paymentLink.id,
        payment_type: 'custom_ui'
      }

    } else {
      return NextResponse.json(
        { error: 'Invalid payment type configuration' },
        { status: 400 }
      )
    }

    // Store transaction in database
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        organization_id: organizationId,
        stripe_settings_id: stripeSettings.id,
        amount: paymentAmount,
        currency: stripeSettings.service_currency || 'usd',
        description: description || `Payment for ${organization.name}`,
        customer_name: customerName || null,
        customer_email: customerEmail || null,
        status: 'pending',
        ...transactionData
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Database error:', transactionError)
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentUrl: paymentLinkUrl,
      amount: paymentAmount,
      currency: stripeSettings.service_currency || 'usd',
      transaction: transaction
    })

  } catch (error) {
    console.error('Payment link creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to create Stripe Checkout session (for dynamic pricing)
async function createStripeCheckoutSession(
  accessToken: string,
  amount: number,
  currency: string,
  description: string,
  customerEmail?: string,
  successUrl?: string,
  cancelUrl?: string
) {
  const params: any = {
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency,
        product_data: {
          name: description
        },
        unit_amount: amount
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
    cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment-cancelled`
  }

  if (customerEmail) {
    params.customer_email = customerEmail
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(params)
  })

  if (!response.ok) {
    throw new Error('Failed to create Stripe checkout session')
  }

  return await response.json()
}

// Helper function to create Stripe Payment Link (for fixed prices)
async function createStripePaymentLink(
  accessToken: string,
  priceId: string
) {
  const response = await fetch('https://api.stripe.com/v1/payment_links', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1'
    })
  })

  if (!response.ok) {
    throw new Error('Failed to create Stripe payment link')
  }

  return await response.json()
}