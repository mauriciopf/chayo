import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'
import { isValidEmail, isValidDescription, sanitizeInput } from '@/lib/utils/payment-validation'
import { createStripePayment, createPayPalPayment, createMercadoPagoPayment } from '@/lib/shared/services/payments'

// POST - Create payment link
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    const {
      organizationId,
      amount, // For dynamic pricing only
      customerEmail,
      customerName,
      description,
      paymentProviderId, // Optional: specific provider to use (otherwise uses default)
      oldPaymentLinkId // Optional: old payment link ID to deactivate before creating new one
    } = await request.json()

    // Validate required fields
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (customerEmail && !isValidEmail(customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate description length
    if (description && !isValidDescription(description, 500)) {
      return NextResponse.json(
        { error: 'Description is too long (max 500 characters)' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedDescription = description ? sanitizeInput(description) : ''
    const sanitizedCustomerName = customerName ? sanitizeInput(customerName) : ''

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

    // Get payment provider - use specific one if provided, otherwise use default
    let paymentProvider
    let providerError
    
    if (paymentProviderId) {
      // Use the specific provider requested
      const result = await supabase
        .from('payment_providers')
        .select('*')
        .eq('id', paymentProviderId)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single()
      
      paymentProvider = result.data
      providerError = result.error
    } else {
      // Fall back to default provider
      const result = await supabase
        .from('payment_providers')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .eq('is_default', true)
        .single()
      
      paymentProvider = result.data
      providerError = result.error
    }

    if (providerError || !paymentProvider) {
      return NextResponse.json(
        { error: paymentProviderId 
          ? 'Selected payment provider not found or inactive' 
          : 'No default payment provider configured for this organization' 
        },
        { status: 400 }
      )
    }

    let paymentLinkUrl: string
    let paymentAmount: number | null = null
    let transactionData: any

    // Handle different payment providers
    if (paymentProvider.provider_type === 'stripe') {
      const result = await createStripePayment(paymentProvider, amount, sanitizedDescription, customerEmail, organization, oldPaymentLinkId)
      paymentLinkUrl = result.url
      paymentAmount = result.amount
      transactionData = result.transactionData
    } else if (paymentProvider.provider_type === 'paypal') {
      const result = await createPayPalPayment(paymentProvider, amount, sanitizedDescription, customerEmail, organization, oldPaymentLinkId)
      paymentLinkUrl = result.url
      paymentAmount = result.amount
      transactionData = result.transactionData
    } else if (paymentProvider.provider_type === 'mercadopago') {
      const result = await createMercadoPagoPayment(paymentProvider, amount, sanitizedDescription, customerEmail, organization, oldPaymentLinkId)
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
        description: sanitizedDescription || `Payment for ${organization.name}`,
        customer_name: sanitizedCustomerName || null,
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
