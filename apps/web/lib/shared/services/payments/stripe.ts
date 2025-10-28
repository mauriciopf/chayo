/**
 * Stripe Payment Provider
 * Handles Stripe Checkout Session and Payment Link creation
 */

import { PaymentProvider, Organization, PaymentResult, calculatePaymentAmount, PaymentProviderError } from './types'

/**
 * Create Stripe Checkout Session (for dynamic pricing)
 */
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
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new PaymentProviderError('stripe', error, `Failed to create Stripe checkout session: ${error.error?.message || 'Unknown error'}`)
  }

  return await response.json()
}

/**
 * Create Stripe Payment Link (for fixed prices)
 */
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
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new PaymentProviderError('stripe', error, `Failed to create Stripe payment link: ${error.error?.message || 'Unknown error'}`)
  }

  return await response.json()
}

/**
 * Main Stripe payment creation function
 */
export async function createStripePayment(
  provider: PaymentProvider,
  amount: number,
  description: string,
  customerEmail: string,
  organization: Organization
): Promise<PaymentResult> {
  try {
    const paymentAmount = calculatePaymentAmount(provider, amount)

    let paymentLinkUrl: string
    let transactionData: any

    if (provider.payment_type === 'dynamic') {
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
      if (!provider.default_price_id) {
        throw new Error('Default price not configured')
      }

      const paymentLink = await createStripePaymentLink(
        provider.access_token,
        provider.default_price_id
      )

      paymentLinkUrl = paymentLink.url
      transactionData = {
        payment_link_id: paymentLink.id,
        payment_type: 'custom_ui'
      }
    } else {
      throw new Error(`Invalid payment type configuration: ${provider.payment_type}`)
    }

    return { url: paymentLinkUrl, amount: paymentAmount, transactionData }
  } catch (error) {
    if (error instanceof PaymentProviderError) {
      throw error
    }
    throw new PaymentProviderError('stripe', error, error instanceof Error ? error.message : 'Unknown error')
  }
}
