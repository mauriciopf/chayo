/**
 * Payment Link Generation Service
 * 
 * CORRECTED IMPLEMENTATION based on official API documentation:
 * - Mercado Pago: https://www.mercadopago.com/developers/en/reference/preferences/_checkout_preferences/post
 * - Stripe: https://stripe.com/docs/api/payment_links/payment_links/create  
 * - PayPal: https://developer.paypal.com/docs/api/orders/v2/#orders_create
 * 
 * SOLID Principles:
 * - Single Responsibility: Each provider has its own handler class
 * - Open/Closed: Easy to add new providers without modifying existing code
 * - Liskov Substitution: All providers implement the same interface
 * - Interface Segregation: Clean PaymentProvider interface
 * - Dependency Inversion: Depends on abstractions, not concrete implementations
 */

// ============================================
// INTERFACES & TYPES
// ============================================

export interface PaymentLinkRequest {
  productId: string
  productName: string
  productDescription?: string
  price: number
  currency: string
  imageUrl?: string
  organizationId: string
}

export interface PaymentLinkResponse {
  paymentLinkUrl: string
  paymentLinkId: string
  provider: string
  metadata?: Record<string, any>
}

export interface PaymentProviderCredentials {
  id: string
  provider_type: 'mercadopago' | 'stripe' | 'paypal'
  access_token: string
  refresh_token?: string
  provider_account_id: string
  provider_settings?: Record<string, any>
  is_active: boolean
}

/**
 * Interface that all payment providers must implement
 */
export interface IPaymentLinkGenerator {
  createPaymentLink(
    request: PaymentLinkRequest,
    credentials: PaymentProviderCredentials
  ): Promise<PaymentLinkResponse>
}

// ============================================
// MERCADO PAGO IMPLEMENTATION
// ============================================

/**
 * Mercado Pago Payment Link Generator
 * API Docs: https://www.mercadopago.com/developers/en/reference/preferences/_checkout_preferences/post
 * 
 * Creates a preference which returns an init_point (payment link)
 */
export class MercadoPagoLinkGenerator implements IPaymentLinkGenerator {
  async createPaymentLink(
    request: PaymentLinkRequest,
    credentials: PaymentProviderCredentials
  ): Promise<PaymentLinkResponse> {
    // Validate currency for Mercado Pago
    const validCurrencies = ['ARS', 'BRL', 'CLP', 'MXN', 'COP', 'PEN', 'UYU', 'USD']
    const currency = request.currency.toUpperCase()
    
    if (!validCurrencies.includes(currency)) {
      throw new Error(`Currency ${currency} not supported by Mercado Pago. Supported: ${validCurrencies.join(', ')}`)
    }

    const preferenceData = {
      items: [
        {
          title: request.productName,
          description: request.productDescription || '',
          picture_url: request.imageUrl,
          category_id: 'services', // Optional: 'services' or 'products'
          quantity: 1,
          unit_price: request.price,
          currency_id: currency
        }
      ],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending`
      },
      auto_return: 'approved',
      external_reference: request.productId,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      metadata: {
        product_id: request.productId,
        organization_id: request.organizationId
      }
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.access_token}`
      },
      body: JSON.stringify(preferenceData)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(`Mercado Pago API Error: ${error.message || JSON.stringify(error)}`)
    }

    const data = await response.json()

    return {
      paymentLinkUrl: data.init_point, // This is the payment link
      paymentLinkId: data.id,
      provider: 'mercadopago',
      metadata: {
        sandbox_init_point: data.sandbox_init_point,
        date_created: data.date_created,
        expiration_date_from: data.expiration_date_from,
        expiration_date_to: data.expiration_date_to
      }
    }
  }
}

// ============================================
// STRIPE IMPLEMENTATION
// ============================================

/**
 * Stripe Payment Link Generator
 * API Docs: https://stripe.com/docs/api/payment_links/payment_links/create
 * 
 * Creates a Payment Link that can be shared with customers
 */
export class StripeLinkGenerator implements IPaymentLinkGenerator {
  async createPaymentLink(
    request: PaymentLinkRequest,
    credentials: PaymentProviderCredentials
  ): Promise<PaymentLinkResponse> {
    try {
      // Import Stripe SDK
      const Stripe = (await import('stripe')).default
      
      // Initialize Stripe with the access token (secret key from OAuth)
      const stripe = new Stripe(credentials.access_token, {
        apiVersion: '2024-10-28' // Latest stable version as of 2024
      })

      // Step 1: Create a price (inline product creation)
      const price = await stripe.prices.create({
        currency: request.currency.toLowerCase(),
        unit_amount: Math.round(request.price * 100), // Convert to cents/minor units
        product_data: {
          name: request.productName,
          description: request.productDescription,
          images: request.imageUrl ? [request.imageUrl] : undefined,
          metadata: {
            product_id: request.productId,
            organization_id: request.organizationId
          }
        }
      })

      // Step 2: Create the payment link
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price: price.id,
            quantity: 1
          }
        ],
        after_completion: {
          type: 'redirect',
          redirect: {
            url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?product_id=${request.productId}`
          }
        },
        metadata: {
          product_id: request.productId,
          organization_id: request.organizationId
        }
      })

      return {
        paymentLinkUrl: paymentLink.url,
        paymentLinkId: paymentLink.id,
        provider: 'stripe',
        metadata: {
          price_id: price.id,
          active: paymentLink.active,
          livemode: paymentLink.livemode
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Stripe API Error: ${error.message}`)
      }
      throw new Error('Stripe SDK not available. Please install: npm install stripe')
    }
  }
}

// ============================================
// PAYPAL IMPLEMENTATION
// ============================================

/**
 * PayPal Payment Link Generator
 * API Docs: https://developer.paypal.com/docs/api/orders/v2/#orders_create
 * 
 * Creates an Order and returns the approval URL (payment link)
 */
export class PayPalLinkGenerator implements IPaymentLinkGenerator {
  async createPaymentLink(
    request: PaymentLinkRequest,
    credentials: PaymentProviderCredentials
  ): Promise<PaymentLinkResponse> {
    const baseUrl = process.env.PAYPAL_MODE === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com'

    // PayPal Orders API v2 format
    // Note: items[] array is OPTIONAL. We use simple amount format for clarity.
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: request.productId,
          description: request.productDescription || request.productName,
          custom_id: request.organizationId,
          soft_descriptor: 'CHAYO', // Shows on customer's statement (max 22 chars)
          amount: {
            currency_code: request.currency.toUpperCase(),
            value: request.price.toFixed(2)
          }
        }
      ],
      application_context: {
        brand_name: 'Chayo',
        locale: 'es-XC', // Spanish for Latin America
        landing_page: 'NO_PREFERENCE', // or 'LOGIN', 'BILLING'
        shipping_preference: 'NO_SHIPPING', // Digital products don't need shipping
        user_action: 'PAY_NOW', // Shows "Pay Now" button instead of "Continue"
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?product_id=${request.productId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel?product_id=${request.productId}`
      }
    }

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.access_token}`
      },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(`PayPal API Error: ${error.message || JSON.stringify(error)}`)
    }

    const data = await response.json()
    
    // Find the approve link
    const approvalLink = data.links?.find((link: any) => link.rel === 'approve')

    if (!approvalLink) {
      throw new Error('PayPal approval link not found in API response')
    }

    return {
      paymentLinkUrl: approvalLink.href,
      paymentLinkId: data.id,
      provider: 'paypal',
      metadata: {
        status: data.status,
        create_time: data.create_time,
        links: data.links
      }
    }
  }
}

// ============================================
// FACTORY & SERVICE
// ============================================

/**
 * Factory for creating payment link generators
 * Follows Factory Pattern for provider instantiation
 */
export class PaymentLinkGeneratorFactory {
  private static generators: Map<string, IPaymentLinkGenerator> = new Map([
    ['mercadopago', new MercadoPagoLinkGenerator()],
    ['stripe', new StripeLinkGenerator()],
    ['paypal', new PayPalLinkGenerator()]
  ])

  static getGenerator(providerType: string): IPaymentLinkGenerator {
    const generator = this.generators.get(providerType.toLowerCase())
    
    if (!generator) {
      throw new Error(`Unsupported payment provider: ${providerType}`)
    }
    
    return generator
  }

  /**
   * Register a new payment provider generator
   * Allows extending the system without modifying existing code (Open/Closed Principle)
   */
  static registerGenerator(providerType: string, generator: IPaymentLinkGenerator): void {
    this.generators.set(providerType.toLowerCase(), generator)
  }
}

/**
 * Main Payment Link Service
 * Orchestrates payment link creation across providers
 */
export class PaymentLinkService {
  /**
   * Create a payment link using the appropriate provider
   */
  static async createPaymentLink(
    request: PaymentLinkRequest,
    credentials: PaymentProviderCredentials
  ): Promise<PaymentLinkResponse> {
    // Validate provider is active
    if (!credentials.is_active) {
      throw new Error(`Payment provider ${credentials.provider_type} is not active`)
    }

    // Validate required fields
    if (!request.productName || request.price <= 0) {
      throw new Error('Invalid payment link request: name and price are required')
    }

    // Get the appropriate generator
    const generator = PaymentLinkGeneratorFactory.getGenerator(credentials.provider_type)

    // Generate the payment link
    return await generator.createPaymentLink(request, credentials)
  }
}
