/**
 * PayPal Payment Provider
 * Uses PayPal Orders API v2 to create checkout orders with approval URLs
 * API Docs: https://developer.paypal.com/docs/api/orders/v2/
 */

import { PaymentProvider, Organization, PaymentResult, calculatePaymentAmount, PaymentProviderError } from './types'

/**
 * Main PayPal payment creation function
 */
export async function createPayPalPayment(
  provider: PaymentProvider,
  amount: number,
  description: string,
  customerEmail: string,
  organization: Organization
): Promise<PaymentResult> {
  try {
    const baseUrl = provider.provider_settings?.base_url || 'https://api-m.sandbox.paypal.com'
    const paymentAmount = calculatePaymentAmount(provider, amount)
    const currency = provider.service_currency?.toUpperCase() || 'USD'
    const amountValue = (paymentAmount / 100).toFixed(2)

    // PayPal Orders API request body
    const orderData = {
      intent: 'CAPTURE', // or 'AUTHORIZE' if you want to authorize first, capture later
      purchase_units: [{
        reference_id: `${organization.id}-${Date.now()}`,
        description: description || `Payment for ${organization.name}`,
        amount: {
          currency_code: currency,
          value: amountValue,
          breakdown: {
            item_total: {
              currency_code: currency,
              value: amountValue
            }
          }
        },
        items: [{
          name: description || provider.service_name || 'Payment',
          description: `Payment for ${organization.name}`,
          quantity: '1',
          unit_amount: {
            currency_code: currency,
            value: amountValue
          }
        }]
      }],
      application_context: {
        brand_name: organization.name,
        landing_page: 'NO_PREFERENCE', // or 'LOGIN', 'BILLING'
        user_action: 'PAY_NOW', // Shows "Pay Now" button instead of "Continue"
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/es/payment-success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/es/payment-cancelled`
      }
    }

    // Create PayPal Order
    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.access_token}`,
        'PayPal-Request-Id': `order-${Date.now()}`
      },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new PaymentProviderError('paypal', errorText, `Failed to create PayPal order: ${errorText}`)
    }

    const order = await response.json()

    // Extract the approval URL (this is the payment link customers use)
    const approvalLink = order.links?.find((link: any) => link.rel === 'approve')

    if (!approvalLink) {
      throw new PaymentProviderError('paypal', order, 'No approval URL in PayPal order response')
    }

    const transactionData = {
      provider_transaction_id: order.id,
      payment_type: provider.payment_type,
      order_id: order.id,
      status: order.status // Usually "CREATED"
    }

    return { url: approvalLink.href, amount: paymentAmount, transactionData }
  } catch (error) {
    if (error instanceof PaymentProviderError) {
      throw error
    }
    throw new PaymentProviderError('paypal', error, error instanceof Error ? error.message : 'Unknown error')
  }
}
