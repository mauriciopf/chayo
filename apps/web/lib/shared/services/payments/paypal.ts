/**
 * PayPal Payment Provider
 * Handles PayPal Invoice creation for payment links
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

    // Create PayPal invoice data
    const invoiceData = {
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
      throw new PaymentProviderError('paypal', errorText, `Failed to create PayPal invoice: ${errorText}`)
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
      throw new PaymentProviderError('paypal', errorText, `Failed to send PayPal invoice: ${errorText}`)
    }

    // The invoice href contains the payment link
    const paymentLinkUrl = invoice.href || `${baseUrl.replace('api-m', 'www')}/invoice/p/#${invoice.id}`

    const transactionData = {
      provider_transaction_id: invoice.id,
      payment_type: provider.payment_type,
      invoice_number: invoiceData.detail.invoice_number
    }

    return { url: paymentLinkUrl, amount: paymentAmount, transactionData }
  } catch (error) {
    if (error instanceof PaymentProviderError) {
      throw error
    }
    throw new PaymentProviderError('paypal', error, error instanceof Error ? error.message : 'Unknown error')
  }
}
