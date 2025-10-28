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
  payment_type: 'dynamic' | 'manual_price_id' | 'custom_ui'
  service_currency?: string
  service_amount?: number
  service_name?: string
  price_id?: string
  default_price_id?: string
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
    payment_type: string
    [key: string]: any
  }
}

/**
 * Calculate payment amount based on provider configuration
 */
export function calculatePaymentAmount(
  provider: PaymentProvider,
  dynamicAmount?: number
): number {
  if (provider.payment_type === 'dynamic') {
    if (!dynamicAmount || dynamicAmount <= 0) {
      throw new Error('Amount is required for dynamic pricing')
    }
    return Math.round(dynamicAmount * 100) // Convert to cents
  } 
  
  if (provider.payment_type === 'manual_price_id' || provider.payment_type === 'custom_ui') {
    if (!provider.service_amount || provider.service_amount <= 0) {
      throw new Error('Service amount is required for fixed pricing')
    }
    return provider.service_amount
  }
  
  throw new Error(`Invalid payment type: ${provider.payment_type}`)
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

