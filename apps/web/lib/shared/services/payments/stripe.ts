/**
 * Stripe Payment Provider
 * Uses Stripe Payment Links for permanent, reusable payment URLs
 * When price changes, old links are deactivated and new ones created
 */

import { PaymentProvider, Organization, PaymentResult, calculatePaymentAmount, PaymentProviderError } from './types'

/**
 * Deactivate an existing Stripe Payment Link
 * (Stripe doesn't support deletion, so we deactivate instead)
 */
async function deactivateStripePaymentLink(
  accessToken: string,
  paymentLinkId: string
) {
  try {
    const response = await fetch(`https://api.stripe.com/v1/payment_links/${paymentLinkId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        active: 'false'
      })
    })

    if (!response.ok) {
      console.error('Failed to deactivate Stripe payment link:', paymentLinkId)
      // Don't throw - continue with creating new link even if deactivation fails
    }
  } catch (error) {
    console.error('Error deactivating payment link:', error)
    // Don't throw - continue with creating new link
  }
}

/**
 * Create Stripe Payment Link
 * Creates: Product → Price → Payment Link (all reusable)
 * Docs: https://stripe.com/docs/api/payment_links
 */
async function createStripePaymentLink(
  accessToken: string,
  amount: number,
  currency: string,
  description: string,
  successUrl: string,
  cancelUrl: string
) {
  // Step 1: Create a Product (represents the item being sold)
  const productResponse = await fetch('https://api.stripe.com/v1/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      name: description,
      description: description
    })
  })

  if (!productResponse.ok) {
    const error = await productResponse.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new PaymentProviderError('stripe', error, `Failed to create Stripe product: ${error.error?.message || 'Unknown error'}`)
  }

  const product = await productResponse.json()

  // Step 2: Create a Price (the cost for this product)
  const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      product: product.id,
      unit_amount: amount.toString(),
      currency: currency.toLowerCase(),
      nickname: `${description} - ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
    })
  })

  if (!priceResponse.ok) {
    const error = await priceResponse.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new PaymentProviderError('stripe', error, `Failed to create Stripe price: ${error.error?.message || 'Unknown error'}`)
  }

  const price = await priceResponse.json()

  // Step 3: Create Payment Link (permanent, shareable URL)
  const paymentLinkParams = new URLSearchParams({
    'line_items[0][price]': price.id,
    'line_items[0][quantity]': '1'
  })

  // Add success redirect if provided
  if (successUrl) {
    paymentLinkParams.append('after_completion[type]', 'redirect')
    paymentLinkParams.append('after_completion[redirect][url]', successUrl)
  }

  const paymentLinkResponse = await fetch('https://api.stripe.com/v1/payment_links', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: paymentLinkParams
  })

  if (!paymentLinkResponse.ok) {
    const error = await paymentLinkResponse.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new PaymentProviderError('stripe', error, `Failed to create Stripe payment link: ${error.error?.message || 'Unknown error'}`)
  }

  const paymentLink = await paymentLinkResponse.json()

  return {
    url: paymentLink.url, // https://buy.stripe.com/...
    paymentLinkId: paymentLink.id,
    priceId: price.id,
    productId: product.id
  }
}

/**
 * Main Stripe payment creation function
 * Creates permanent Payment Links for product payments
 * 
 * If oldPaymentLinkId is provided, it will be deactivated before creating new link
 * This happens when price changes or offers are activated/deactivated
 */
export async function createStripePayment(
  provider: PaymentProvider,
  amount: number,
  description: string,
  customerEmail: string,
  organization: Organization,
  oldPaymentLinkId?: string
): Promise<PaymentResult> {
  try {
    const paymentAmount = calculatePaymentAmount(provider, amount)

    // If there's an old payment link, deactivate it first
    if (oldPaymentLinkId) {
      console.log(`Deactivating old Stripe payment link: ${oldPaymentLinkId}`)
      await deactivateStripePaymentLink(provider.access_token, oldPaymentLinkId)
    }

    // Create new permanent Stripe Payment Link
    const result = await createStripePaymentLink(
      provider.access_token,
      paymentAmount,
      provider.service_currency || 'usd',
      description || `Payment for ${organization.name}`,
      `${process.env.NEXT_PUBLIC_APP_URL}/es/payment-success`,
      `${process.env.NEXT_PUBLIC_APP_URL}/es/payment-cancelled`
    )

    return { 
      url: result.url, 
      amount: paymentAmount, 
      transactionData: {
        payment_link_id: result.paymentLinkId,
        price_id: result.priceId,
        product_id: result.productId
      }
    }
  } catch (error) {
    if (error instanceof PaymentProviderError) {
      throw error
    }
    throw new PaymentProviderError('stripe', error, error instanceof Error ? error.message : 'Unknown error')
  }
}
