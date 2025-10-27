# Multi-Provider Payment Link System

## Overview
Chayo supports 3 payment providers for global and Latin American markets:
1. 🥇 **Mercado Pago** - Primary for Latin America (PIX, OXXO, PSE, cards)
2. 🥈 **Stripe** - Secondary for international/cards
3. 🥉 **PayPal** - Tertiary for PayPal users

Square has been removed in favor of Mercado Pago for better Latin America coverage.

## Architecture

### Unified Payment Link API
All three providers use a single endpoint: `/api/payments/create-link`

**Request:**
```json
{
  "organizationId": "uuid",
  "amount": 5000,  // In cents, for dynamic pricing only
  "description": "Product name",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://...",
  "amount": 5000,
  "currency": "usd",
  "provider": "mercadopago",
  "transaction": { ... }
}
```

## 1. Mercado Pago Integration

### OAuth Flow

```
1. User clicks "Conectar Mercado Pago" in PaymentProviderConfigModal
   ↓
2. POST /api/mercadopago/oauth
   - Generates OAuth authorization URL
   - Includes organizationId in state parameter
   ↓
3. User redirected to Mercado Pago authorization page
   - User authorizes the application
   ↓
4. Mercado Pago redirects to /api/mercadopago/callback?code=...&state=organizationId
   ↓
5. Exchange authorization code for access token
   ↓
6. Store credentials in payment_providers table
   ↓
7. Redirect back to dashboard with success message
```

### Payment Link Generation

**API Endpoint:** `POST https://api.mercadopago.com/checkout/preferences`

**Request Body:**
```json
{
  "items": [{
    "title": "Product Name",
    "quantity": 1,
    "unit_price": 100.00,
    "currency_id": "USD"
  }],
  "back_urls": {
    "success": "https://chayo.ai/payment-success",
    "failure": "https://chayo.ai/payment-cancelled",
    "pending": "https://chayo.ai/payment-pending"
  },
  "auto_return": "approved",
  "external_reference": "org_123_1635782400",
  "notification_url": "https://chayo.ai/api/webhooks/mercadopago",
  "payer": {
    "email": "customer@example.com"
  }
}
```

**Response:**
```json
{
  "id": "1234567890",
  "init_point": "https://www.mercadopago.com/checkout/v1/redirect?pref_id=xxxxx",
  "sandbox_init_point": "https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=xxxxx"
}
```

### Environment Variables

```bash
# Mercado Pago OAuth Configuration
MERCADOPAGO_CLIENT_ID=your_client_id_here
MERCADOPAGO_CLIENT_SECRET=your_client_secret_here
```

### Getting Credentials

1. **Create Mercado Pago Developer Account**
   - Go to: https://www.mercadopago.com/developers
   - Sign up or log in

2. **Create Application**
   - Navigate to "Your integrations" → "Create application"
   - Choose "Online payments"

3. **Get OAuth Credentials**
   - Copy `Client ID` and `Client Secret`
   - Add redirect URI: `https://your-domain.com/api/mercadopago/callback`

4. **Supported Payment Methods**
   - PIX (Brazil)
   - OXXO (Mexico)
   - PSE (Colombia)
   - All major credit/debit cards
   - Regional payment methods

## 2. Stripe Integration

### OAuth Flow

```
1. User clicks "Conectar Stripe" in PaymentProviderConfigModal
   ↓
2. POST /api/stripe/oauth
   - Generates Stripe Connect OAuth URL
   ↓
3. User redirected to Stripe authorization page
   ↓
4. Stripe redirects to /api/stripe/callback?code=...
   ↓
5. Exchange code for access token
   ↓
6. Store in payment_providers table
```

### Payment Link Generation

**Dynamic Pricing:** Creates Stripe Checkout Session
```
POST https://api.stripe.com/v1/checkout/sessions
```

**Fixed Pricing:** Creates Stripe Payment Link
```
POST https://api.stripe.com/v1/payment_links
```

### Environment Variables

```bash
STRIPE_CLIENT_ID=ca_xxx
STRIPE_CLIENT_SECRET=sk_xxx
```

## 3. PayPal Integration

### OAuth Flow

```
1. User clicks "Conectar PayPal" in PaymentProviderConfigModal
   ↓
2. POST /api/paypal/oauth
   - Generates PayPal OAuth URL with scopes:
     - https://uri.paypal.com/services/invoicing
     - https://uri.paypal.com/services/payments/payment/authcapture
     - openid, profile, email
   ↓
3. User redirected to PayPal authorization page
   ↓
4. PayPal redirects to /api/paypal/callback?code=...
   ↓
5. Exchange code for access token
   ↓
6. Store in payment_providers table
```

### Payment Link Generation

**Creates PayPal Invoice:**

**Step 1:** Create Invoice
```
POST https://api-m.paypal.com/v2/invoicing/invoices
```

**Step 2:** Send Invoice to generate payment link
```
POST https://api-m.paypal.com/v2/invoicing/invoices/{id}/send
```

### Environment Variables

```bash
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com  # Use production URL for live
```

## Database Schema

### Migration: `add_mercadopago_provider.sql`

Updates `payment_providers` table to support Mercado Pago:

```sql
-- Provider types now: 'mercadopago', 'stripe', 'paypal'
ALTER TABLE payment_providers 
ADD CONSTRAINT payment_providers_provider_type_check 
CHECK (provider_type IN ('stripe', 'paypal', 'mercadopago'));
```

### Payment Providers Table Structure

```sql
CREATE TABLE payment_providers (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    provider_type TEXT CHECK (provider_type IN ('stripe', 'paypal', 'mercadopago')),
    provider_account_id TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    provider_settings JSONB DEFAULT '{}',
    payment_type TEXT CHECK (payment_type IN ('dynamic', 'manual_price_id', 'custom_ui')),
    price_id TEXT,
    service_name TEXT,
    service_amount INTEGER,
    service_currency TEXT DEFAULT 'usd',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Complete User Flow

### For Business Owners

1. **Navigate to Dashboard → Payment Providers**
2. **Click "Configure Payment Providers"**
3. **Select a provider:**
   - Mercado Pago (recommended for Latin America)
   - Stripe (global)
   - PayPal (alternative)
4. **Authorize the connection** (redirected to provider OAuth page)
5. **Configure payment type:**
   - **Dynamic Pricing:** Customers enter amount
   - **Manual Price ID:** Use provider's product ID
   - **Quick Setup:** Chayo creates product automatically
6. **Add products** with payment links enabled
7. **Share payment links** with customers

### For Customers

1. **Click payment link** (shared via WhatsApp, email, etc.)
2. **Redirected to provider checkout:**
   - Mercado Pago: PIX, OXXO, cards
   - Stripe: Credit/debit cards
   - PayPal: PayPal balance, cards
3. **Complete payment**
4. **Redirected to success/failure page**

## Payment Type Options

### 1. Dynamic Pricing
- Customer enters custom amount
- Perfect for: consultations, tips, donations
- Implementation: Creates checkout session on-the-fly

### 2. Manual Price ID
- Use existing product from provider dashboard
- Perfect for: existing products, full provider control
- Implementation: Uses provider's product/price ID

### 3. Quick Setup (Custom UI)
- Chayo creates product in provider automatically
- Perfect for: simple services, quick onboarding
- Implementation: API creates product, stores IDs

## API Implementation

### Unified Create Link Route

```typescript
// apps/web/app/api/payments/create-link/route.ts

if (paymentProvider.provider_type === 'mercadopago') {
  const result = await createMercadoPagoPayment(...)
} else if (paymentProvider.provider_type === 'stripe') {
  const result = await createStripePayment(...)
} else if (paymentProvider.provider_type === 'paypal') {
  const result = await createPayPalPayment(...)
}
```

### Provider-Specific Functions

Each provider has its own helper function:
- `createMercadoPagoPayment()` - Creates Mercado Pago preference
- `createStripePayment()` - Creates Stripe checkout or payment link
- `createPayPalPayment()` - Creates PayPal invoice

## Testing

### Development Setup

1. **Mercado Pago:**
   - Use sandbox credentials from developer dashboard
   - Test with sandbox accounts

2. **Stripe:**
   - Use test mode API keys
   - Test with card: 4242 4242 4242 4242

3. **PayPal:**
   - Use sandbox API credentials
   - Test with PayPal sandbox accounts

### Production Deployment

1. **Update environment variables** with production credentials
2. **Configure webhook endpoints** for payment notifications
3. **Test OAuth flow** end-to-end
4. **Verify redirect URLs** are correctly configured

## Webhooks (TODO)

### Mercado Pago Webhooks
```
POST /api/webhooks/mercadopago
```

### Stripe Webhooks
```
POST /api/webhooks/stripe
```

### PayPal Webhooks
```
POST /api/webhooks/paypal
```

## Security Considerations

1. **Access tokens** stored encrypted in database
2. **OAuth state parameter** prevents CSRF attacks
3. **Webhook signatures** verify authenticity
4. **HTTPS only** for all API communications
5. **Token refresh** logic for expired tokens

## API Documentation References

### Mercado Pago
- **OAuth**: https://www.mercadopago.com/developers/en/docs/checkout-api/oauth
- **Preferences API**: https://www.mercadopago.com/developers/en/reference/preferences/_checkout_preferences/post
- **Webhooks**: https://www.mercadopago.com/developers/en/docs/checkout-api/webhooks

### Stripe
- **OAuth**: https://stripe.com/docs/connect/oauth-reference
- **Checkout Sessions**: https://stripe.com/docs/api/checkout/sessions
- **Payment Links**: https://stripe.com/docs/api/payment_links

### PayPal
- **OAuth**: https://developer.paypal.com/docs/api/overview/#authentication
- **Invoicing**: https://developer.paypal.com/docs/api/invoicing/v2
- **Webhooks**: https://developer.paypal.com/docs/api/webhooks/v1

## Migration Notes

### From Square to Mercado Pago

- Square has been removed from the codebase
- Existing Square providers marked as inactive
- UI updated to show Mercado Pago as #1 option
- All references to "Square" replaced with "Mercado Pago"

### Files Updated

1. `migrations/add_mercadopago_provider.sql` - Database schema
2. `apps/web/app/api/payments/create-link/route.ts` - Payment link API
3. `apps/web/components/payments/PaymentProviderConfigModal.tsx` - UI
4. `apps/web/components/payments/PaymentProviderSelector.tsx` - Selector
5. `apps/web/lib/features/tools/payments/components/PaymentToolConfig.tsx` - Config
6. `apps/web/lib/features/tools/shared/services/*.ts` - Constraints

## Status

✅ **Completed:**
- Mercado Pago OAuth integration
- Database migration for all 3 providers
- Unified payment link generation API
- All provider-specific payment link functions
- UI components updated
- Complete documentation

⏳ **Pending:**
- Webhook handlers for payment confirmations
- Token refresh logic for expired tokens
- Production credentials configuration
- End-to-end testing with real payments

## Support

For issues or questions:
- Mercado Pago: https://www.mercadopago.com/developers/en/support
- Stripe: https://support.stripe.com
- PayPal: https://developer.paypal.com/support


