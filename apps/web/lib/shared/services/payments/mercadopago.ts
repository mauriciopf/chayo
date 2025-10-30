/**
 * Mercado Pago Payment Provider
 * Handles Mercado Pago Preference (payment link) creation
 */

import { PaymentProvider, Organization, PaymentResult, calculatePaymentAmount, PaymentProviderError } from './types'

/**
 * Main Mercado Pago payment creation function
 * 
 * Note: Mercado Pago Preferences are temporary (not reusable like Stripe Payment Links)
 * Each preference generates a unique init_point URL that expires after use
 */
export async function createMercadoPagoPayment(
  provider: PaymentProvider,
  amount: number,
  description: string,
  customerEmail: string,
  organization: Organization,
  oldPaymentLinkId?: string // Not applicable for Mercado Pago - preferences are recreated each time
): Promise<PaymentResult> {
  try {
    const baseUrl = provider.provider_settings?.base_url || 'https://api.mercadopago.com'
    const paymentAmount = calculatePaymentAmount(provider, amount)

    // Mercado Pago uses decimal amounts (not cents) in their API
    const amountInDecimal = paymentAmount / 100

    // Create Mercado Pago Preference (payment link)
    const preferenceData = {
      items: [{
        title: description || `Payment for ${organization.name}`,
        quantity: 1,
        unit_price: amountInDecimal,
        currency_id: provider.service_currency?.toUpperCase() || 'USD'
      }],
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_APP_URL}/es/payment-success`,
      failure: `${process.env.NEXT_PUBLIC_APP_URL}/es/payment-cancelled`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/es/payment-pending`
    },
      auto_return: 'approved',
      external_reference: `${organization.id}_${Date.now()}`,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      ...(customerEmail && { payer: { email: customerEmail } })
    }

    // Create Mercado Pago preference
    const response = await fetch(`${baseUrl}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.access_token}`
      },
      body: JSON.stringify(preferenceData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new PaymentProviderError('mercadopago', errorText, `Failed to create Mercado Pago payment link: ${errorText}`)
    }

    const preference = await response.json()

    // Mercado Pago returns init_point which is the payment link
    if (!preference.init_point) {
      throw new PaymentProviderError('mercadopago', preference, 'Mercado Pago did not return a valid payment link')
    }

    const paymentLinkUrl = preference.init_point

    const transactionData = {
      payment_link_id: preference.id, // Mercado Pago Preference ID (used for tracking, not deactivation)
      preference_id: preference.id
    }

    return { url: paymentLinkUrl, amount: paymentAmount, transactionData }
  } catch (error) {
    if (error instanceof PaymentProviderError) {
      throw error
    }
    throw new PaymentProviderError('mercadopago', error, error instanceof Error ? error.message : 'Unknown error')
  }
}
