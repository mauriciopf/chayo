/**
 * Payment Provider Types
 * Shared types for all payment providers
 */

export interface PaymentProvider {
  id: string
  organization_id: string
  provider_type: 'stripe' | 'paypal' | 'mercadopago'
  provider_account_id: string
  access_token: string
  refresh_token?: string
  service_currency?: string
  provider_settings?: Record<string, any>
  is_active: boolean
  is_default: boolean
}

export interface Organization {
  id: string
  name: string
  slug: string
}

export interface PaymentResult {
  url: string
  amount: number
  transactionData: {
    [key: string]: any
  }
}

/**
 * Calculate payment amount for product payments
 * Amount is always provided from the product price
 */
export function calculatePaymentAmount(
  provider: PaymentProvider,
  amount: number
): number {
  if (!amount || amount <= 0) {
    throw new Error('Valid amount is required for payment link creation')
  }
  
  return Math.round(amount * 100) // Convert to cents
}

/**
 * Enhanced error with provider context
 */
export class PaymentProviderError extends Error {
  constructor(
    public provider: string,
    public originalError: any,
    message?: string
  ) {
    super(message || `Payment provider error: ${provider}`)
    this.name = 'PaymentProviderError'
  }
}

