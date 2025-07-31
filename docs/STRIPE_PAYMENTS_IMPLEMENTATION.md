# Stripe Payments Implementation Guide

This document explains the complete Stripe payments integration for Chayo's agent tools system.

## Overview

The payments tool allows businesses to collect payments from clients through the chat interface using Stripe. The system supports three different payment methods:

1. **Dynamic Pricing** - Clients can enter custom amounts
2. **Manual Price ID** - Business provides a Stripe Price ID from their dashboard
3. **Quick Setup** - Chayo creates the product/price in Stripe automatically

## Architecture

### Database Schema

#### `stripe_settings` Table
Stores Stripe OAuth tokens and payment configuration:
- `stripe_user_id` - Stripe account ID
- `access_token` - For Stripe API calls
- `payment_type` - One of: 'dynamic', 'manual_price_id', 'custom_ui'
- `price_id` - Stripe Price ID (for manual option)
- Service details for custom UI option

#### `payment_transactions` Table
Tracks all payment links and transactions:
- Links to `stripe_settings` and `organizations`
- Stores Stripe payment link/checkout session IDs
- Customer information and payment status

### API Routes

#### Stripe OAuth
- `POST /api/stripe/oauth` - Initialize OAuth flow
- `GET /api/stripe/callback` - Handle OAuth callback

#### Payment Management
- `GET /api/organizations/[id]/stripe-settings` - Fetch settings
- `PATCH /api/organizations/[id]/stripe-settings` - Update settings
- `DELETE /api/organizations/[id]/stripe-settings` - Disconnect Stripe

#### Payment Processing
- `POST /api/payments/create-link` - Generate payment links

## Payment Types

### 1. Dynamic Pricing
**Use Case:** Consultations, donations, variable services

**How it works:**
- Client clicks payment button
- Enters custom amount
- Stripe Checkout session created with custom line item
- Redirects to Stripe checkout

**Implementation:**
```typescript
// Creates Stripe Checkout session with custom amount
const checkoutSession = await createStripeCheckoutSession(
  accessToken,
  amount * 100, // Convert to cents
  currency,
  description
)
```

### 2. Manual Price ID
**Use Case:** Fixed services already created in Stripe

**Setup Process:**
1. Business logs into Stripe Dashboard
2. Creates Product with Price (e.g., "Service - $100")
3. Copies Price ID (e.g., `price_1ABCxyz...`)
4. Enters Price ID in Chayo configuration

**How it works:**
- Uses existing Stripe Price ID
- Creates Stripe Payment Link
- Direct redirect to payment

**Implementation:**
```typescript
// Creates payment link with existing price
const paymentLink = await createStripePaymentLink(
  accessToken,
  priceId
)
```

### 3. Quick Setup (Custom UI)
**Use Case:** Simple services, quick onboarding

**Setup Process:**
1. Business enters service name and price in Chayo
2. Chayo creates Product and Price in Stripe automatically
3. Stores Stripe IDs for future use

**How it works:**
- Creates Stripe Product via API
- Creates Stripe Price via API
- Uses created Price ID for payments

**Implementation:**
```typescript
// Auto-creates product and price in Stripe
const { productId, priceId } = await createStripeProduct(
  accessToken,
  serviceName,
  serviceAmount,
  currency,
  serviceType
)
```

## Environment Variables

### Required for OAuth
```env
# Stripe Connect OAuth
STRIPE_CLIENT_ID=ca_xxx
STRIPE_CLIENT_SECRET=sk_xxx

# App URL for OAuth redirects
NEXT_PUBLIC_APP_URL=https://chayo.ai
```

### OAuth App Configuration

#### Development
- **Redirect URI:** `http://localhost:3000/api/stripe/callback`
- **Webhooks:** Optional for development

#### Production
- **Redirect URI:** `https://chayo.ai/api/stripe/callback`
- **Webhooks:** Recommended for production

## User Experience Flow

### Business Setup

1. **Enable Payments Tool**
   - Go to Dashboard → Agent Tools
   - Enable "Collect a payment" tool

2. **Connect Stripe Account**
   - Click "Connect Stripe Account"
   - Authorize Chayo in Stripe
   - Automatically redirected back to dashboard

3. **Choose Payment Method**
   - Select from 3 options: Dynamic, Manual Price ID, or Quick Setup
   - Configure based on business needs

4. **Save Settings**
   - Configuration stored in database
   - Payment option becomes available in client chat

### Client Payment Flow

1. **See Payment Option in Chat**
   - Payment button appears based on business configuration
   - Message customized based on payment type

2. **Dynamic Pricing Flow**
   - Click payment button
   - Enter desired amount
   - Redirect to Stripe Checkout

3. **Fixed Price Flow**
   - Click payment button
   - Direct redirect to Stripe Payment Link

4. **Complete Payment**
   - Standard Stripe checkout experience
   - Return to success/cancel pages

## Integration with Agent Tools

### ActionableHintChips
The payments option is defined in the actionable hints:

```typescript
{
  id: 'collect_payment',
  label: '💳 Collect a payment or deposit',
  icon: '💳',
  description: 'Send a payment link or confirm payment details.',
  category: 'payments'
}
```

### ClientChatContainer
Payments are shown conditionally based on:
- Payments tool is enabled
- Stripe account is connected
- Payment type is configured

### ChatMessage Component
Includes `PaymentButton` component that handles:
- Dynamic amount input (for dynamic pricing)
- Payment link generation
- Loading states and error handling

## Security & Best Practices

### OAuth Security
- State parameter includes organization ID, user ID, and timestamp
- Tokens stored securely in database
- Access tokens refreshed when needed

### Payment Security
- All payments processed through Stripe
- No sensitive payment data stored in Chayo
- PCI compliance handled by Stripe

### Error Handling
- Graceful fallbacks for OAuth errors
- Clear error messages for users
- Logging for debugging

## Testing

### Development Testing
1. Use Stripe test mode
2. Create test Stripe Connect app
3. Use test payment methods
4. Verify webhook delivery (if implemented)

### Test Data
```typescript
// Test card numbers
const testCards = {
  success: '4242424242424242',
  declined: '4000000000000002',
  requiresAuth: '4000002500003155'
}
```

## Migration Guide

### Database Migration
Run the migration file:
```sql
-- supabase/migrations/20250130000007_add_stripe_payments.sql
```

This creates:
- `stripe_settings` table
- `payment_transactions` table
- Helper functions for payment management

### Environment Setup
1. Add Stripe OAuth credentials to environment variables
2. Configure Stripe Connect app with correct redirect URIs
3. Test OAuth flow in development

## Troubleshooting

### Common Issues

**OAuth "Invalid Client"**
- Check STRIPE_CLIENT_ID matches Stripe Connect app
- Verify redirect URI is exactly configured in Stripe

**"Access Token Invalid"**
- Token may have expired or been revoked
- User needs to reconnect Stripe account

**Payment Link Creation Fails**
- Check Stripe account is properly connected
- Verify price/product exists in Stripe
- Check API permissions

### Debug Information
Enable logging to see:
- OAuth flow details
- Stripe API responses
- Payment creation process

## Future Enhancements

### Potential Features
1. **Webhook Integration** - Real-time payment status updates
2. **Subscription Support** - Recurring payments
3. **Multi-currency** - Support for different currencies
4. **Payment Analytics** - Dashboard for payment insights
5. **Refund Management** - Handle refunds through Chayo

### Webhook Events to Consider
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `checkout.session.completed`
- `invoice.payment_succeeded` (for subscriptions)