import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

// POST - Create payment link
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
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

    // Get default payment provider for this organization
    const { data: paymentProvider, error: providerError } = await supabase
      .from('payment_providers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .eq('is_default', true)
      .single()

    if (providerError || !paymentProvider) {
      return NextResponse.json(
        { error: 'No payment provider configured for this organization' },
        { status: 400 }
      )
    }

    let paymentLinkUrl: string
    let paymentAmount: number | null = null
    let transactionData: any

    // Handle different payment providers and types
    if (paymentProvider.provider_type === 'stripe') {
      const result = await createStripePayment(paymentProvider, amount, description, customerEmail, organization)
      paymentLinkUrl = result.url
      paymentAmount = result.amount
      transactionData = result.transactionData
    } else if (paymentProvider.provider_type === 'paypal') {
      const result = await createPayPalPayment(paymentProvider, amount, description, customerEmail, organization)
      paymentLinkUrl = result.url
      paymentAmount = result.amount
      transactionData = result.transactionData
    } else if (paymentProvider.provider_type === 'square') {
      const result = await createSquarePayment(paymentProvider, amount, description, customerEmail, organization)
      paymentLinkUrl = result.url
      paymentAmount = result.amount
      transactionData = result.transactionData
    } else {
      return NextResponse.json(
        { error: `Unsupported payment provider: ${paymentProvider.provider_type}` },
        { status: 400 }
      )
    }

    // Store transaction in database
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        organization_id: organizationId,
        payment_provider_id: paymentProvider.id,
        provider_type: paymentProvider.provider_type,
        amount: paymentAmount,
        currency: paymentProvider.service_currency || 'usd',
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
      currency: paymentProvider.service_currency || 'usd',
      provider: paymentProvider.provider_type,
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

// Payment provider helper functions
async function createStripePayment(provider: any, amount: number, description: string, customerEmail: string, organization: any) {
  let paymentLinkUrl: string
  let paymentAmount: number | null = null
  let transactionData: any

  if (provider.payment_type === 'dynamic') {
    // Dynamic pricing - create Stripe Checkout session
    if (!amount || amount <= 0) {
      throw new Error('Amount is required for dynamic pricing')
    }

    paymentAmount = Math.round(amount * 100) // Convert to cents
    
    const checkoutSession = await createStripeCheckoutSession(
      provider.access_token,
      paymentAmount,
      provider.service_currency || 'usd',
      description || `Payment for ${organization.name}`,
      customerEmail,
      `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
      `${process.env.NEXT_PUBLIC_APP_URL}/payment-cancelled`
    )

    paymentLinkUrl = checkoutSession.url
    transactionData = {
      checkout_session_id: checkoutSession.id,
      payment_type: 'dynamic'
    }

  } else if (provider.payment_type === 'manual_price_id') {
    // Manual Price ID - create payment link
    if (!provider.price_id) {
      throw new Error('Price ID not configured')
    }

    const paymentLink = await createStripePaymentLink(
      provider.access_token,
      provider.price_id
    )

    paymentLinkUrl = paymentLink.url
    transactionData = {
      payment_link_id: paymentLink.id,
      payment_type: 'manual_price_id'
    }

  } else if (provider.payment_type === 'custom_ui') {
    // Custom UI - use default price created in Chayo
    if (!provider.default_price_id) {
      throw new Error('Default price not configured')
    }
    if (!provider.service_amount || provider.service_amount <= 0) {
      throw new Error('Service amount is required for custom UI pricing')
    }

    const paymentLink = await createStripePaymentLink(
      provider.access_token,
      provider.default_price_id
    )

    paymentLinkUrl = paymentLink.url
    paymentAmount = provider.service_amount
    transactionData = {
      payment_link_id: paymentLink.id,
      payment_type: 'custom_ui'
    }
  } else {
    throw new Error('Invalid payment type configuration')
  }

  return { url: paymentLinkUrl, amount: paymentAmount, transactionData }
}

async function createPayPalPayment(provider: any, amount: number, description: string, customerEmail: string, organization: any) {
  const baseUrl = provider.provider_settings?.base_url || 'https://api-m.sandbox.paypal.com'
  
  let paymentAmount: number
  let invoiceData: any

  if (provider.payment_type === 'dynamic') {
    // Dynamic pricing
    if (!amount || amount <= 0) {
      throw new Error('Amount is required for dynamic pricing')
    }
    paymentAmount = Math.round(amount * 100) // Convert to cents
    
  } else if (provider.payment_type === 'manual_price_id' || provider.payment_type === 'custom_ui') {
    // Fixed pricing
    if (!provider.service_amount || provider.service_amount <= 0) {
      throw new Error('Service amount is required for fixed pricing')
    }
    paymentAmount = provider.service_amount
    
  } else {
    throw new Error('Invalid payment type configuration')
  }

  // Create PayPal invoice data (now that paymentAmount is guaranteed to be set)
  invoiceData = {
    detail: {
      invoice_number: `INV-${Date.now()}`,
      reference: `Payment for ${organization.name}`,
      invoice_date: new Date().toISOString().split('T')[0],
      currency_code: provider.service_currency?.toUpperCase() || 'USD',
      note: description || provider.service_name || `Payment for ${organization.name}`
    },
    invoicer: {
      name: { given_name: organization.name },
      email_address: customerEmail || 'noreply@example.com'
    },
    primary_recipients: [{
      billing_info: {
        name: { given_name: 'Customer' },
        email_address: customerEmail || 'customer@example.com'
      }
    }],
    items: [{
      name: provider.service_name || description || 'Service Payment',
      quantity: '1',
      unit_amount: {
        currency_code: provider.service_currency?.toUpperCase() || 'USD',
        value: (paymentAmount / 100).toFixed(2)
      }
    }]
  }

  // Create PayPal invoice
  const createResponse = await fetch(`${baseUrl}/v2/invoicing/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.access_token}`,
      'PayPal-Request-Id': `invoice-${Date.now()}`
    },
    body: JSON.stringify(invoiceData)
  })

  if (!createResponse.ok) {
    const errorText = await createResponse.text()
    console.error('PayPal invoice creation failed:', errorText)
    throw new Error('Failed to create PayPal invoice')
  }

  const invoice = await createResponse.json()

  // Send the invoice to generate payment link
  const sendResponse = await fetch(`${baseUrl}/v2/invoicing/invoices/${invoice.id}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.access_token}`
    },
    body: JSON.stringify({
      send_to_recipient: true,
      send_to_invoicer: false
    })
  })

  if (!sendResponse.ok) {
    const errorText = await sendResponse.text()
    console.error('PayPal invoice send failed:', errorText)
    throw new Error('Failed to send PayPal invoice')
  }

  // The invoice href contains the payment link
  const paymentLinkUrl = invoice.href || `${baseUrl.replace('api-m', 'www')}/invoice/p/#${invoice.id}`

  const transactionData = {
    provider_transaction_id: invoice.id,
    payment_type: provider.payment_type,
    invoice_number: invoiceData.detail.invoice_number
  }

  return { url: paymentLinkUrl, amount: paymentAmount, transactionData }
}

async function createSquarePayment(provider: any, amount: number, description: string, customerEmail: string, organization: any) {
  const environment = provider.provider_settings?.environment || 'sandbox'
  const baseUrl = environment === 'production' 
    ? 'https://connect.squareup.com' 
    : 'https://connect.squareupsandbox.com'
  
  let paymentAmount: number | null = null
  let checkoutData: any

  if (provider.payment_type === 'dynamic') {
    // Dynamic pricing
    if (!amount || amount <= 0) {
      throw new Error('Amount is required for dynamic pricing')
    }
    paymentAmount = Math.round(amount * 100) // Convert to cents
    
    checkoutData = {
      idempotency_key: `checkout-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      checkout_options: {
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
        ask_for_shipping_address: false,
        accepted_payment_methods: {
          apple_pay: false,
          google_pay: false
        }
      },
      order: {
        location_id: provider.provider_settings?.merchant_info?.main_location_id,
        line_items: [{
          name: description || 'Service Payment',
          quantity: '1',
          item_type: 'ITEM',
          base_price_money: {
            amount: paymentAmount,
            currency: provider.service_currency?.toUpperCase() || 'USD'
          }
        }]
      }
    }
  } else if (provider.payment_type === 'manual_price_id' || provider.payment_type === 'custom_ui') {
    // Fixed pricing
    if (!provider.service_amount || provider.service_amount <= 0) {
      throw new Error('Service amount is required for fixed pricing')
    }
    paymentAmount = provider.service_amount
    
    checkoutData = {
      idempotency_key: `checkout-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      checkout_options: {
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
        ask_for_shipping_address: false,
        accepted_payment_methods: {
          apple_pay: false,
          google_pay: false
        }
      },
      order: {
        location_id: provider.provider_settings?.merchant_info?.main_location_id,
        line_items: [{
          name: provider.service_name || description || 'Service Payment',
          quantity: '1',
          item_type: 'ITEM',
          base_price_money: {
            amount: paymentAmount,
            currency: provider.service_currency?.toUpperCase() || 'USD'
          }
        }]
      }
    }
  } else {
    throw new Error('Invalid payment type configuration')
  }

  // Create Square payment link
  const response = await fetch(`${baseUrl}/v2/online-checkout/payment-links`, {
    method: 'POST',
    headers: {
      'Square-Version': '2024-12-18',
      'Authorization': `Bearer ${provider.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(checkoutData)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Square payment link creation failed:', errorText)
    throw new Error('Failed to create Square payment link')
  }

  const paymentLinkResponse = await response.json()
  const paymentLink = paymentLinkResponse.payment_link

  const transactionData = {
    provider_transaction_id: paymentLink.id,
    payment_type: provider.payment_type,
    checkout_page_url: paymentLink.checkout_page_url
  }

  return { url: paymentLink.url, amount: paymentAmount, transactionData }
}