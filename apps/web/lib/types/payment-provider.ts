/**
 * Type definitions for payment providers
 */

export interface PaymentProvider {
  id: string
  organization_id: string
  provider_type: 'mercadopago' | 'stripe' | 'paypal'
  provider_account_id: string | null
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  scope: string | null
  provider_settings: Record<string, any>
  payment_type: 'dynamic' | 'manual_price_id' | 'custom_ui'
  price_id: string | null
  default_product_id: string | null
  default_price_id: string | null
  service_name: string | null
  service_amount: number | null
  service_currency: string
  service_type: 'one_time' | 'recurring'
  recurring_interval: string | null
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface PaymentTransaction {
  id: string
  organization_id: string
  payment_provider_id: string
  provider_type: 'mercadopago' | 'stripe' | 'paypal'
  amount: number | null
  currency: string
  description: string
  customer_name: string | null
  customer_email: string | null
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  provider_transaction_id: string | null
  payment_type: string | null
  preference_id: string | null
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
}

export interface PaymentLinkRequest {
  organizationId: string
  amount?: number
  customerEmail?: string
  customerName?: string
  description?: string
}

export interface PaymentLinkResponse {
  success: boolean
  paymentUrl: string
  amount: number | null
  currency: string
  provider: string
  transaction: PaymentTransaction
}

export interface PaymentCreationResult {
  url: string
  amount: number | null
  transactionData: {
    provider_transaction_id?: string
    payment_type: string
    checkout_session_id?: string
    payment_link_id?: string  // Stored in payment_transactions, not products
    invoice_number?: string
    preference_id?: string
  }
}

