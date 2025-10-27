# Mercado Pago Integration for Chayo

## Overview
Replaced Square with Mercado Pago as the primary payment provider for Latin America. Mercado Pago is now the #1 recommended provider, followed by Stripe and PayPal.

## Changes Made

### 1. **Removed Square Integration**
- ✅ Deleted `/api/square/oauth/route.ts`
- ✅ Deleted `/api/square/callback/route.ts`
- ✅ Updated payment provider validation to replace `square` with `mercadopago`
- ✅ Updated UI components to show Mercado Pago instead of Square

### 2. **Added Mercado Pago OAuth Flow**
- ✅ Created `/api/mercadopago/oauth/route.ts` - Initiates OAuth flow
- ✅ Created `/api/mercadopago/callback/route.ts` - Handles OAuth callback
- ✅ Stores access token, refresh token, and user ID in `payment_providers` table

### 3. **Updated UI Components**
- ✅ `PaymentProviderConfigModal.tsx` - Now shows Mercado Pago (💵) as first option
- ✅ Mercado Pago card displays: "El método de pago líder en América Latina"
- ✅ Uses blue gradient color scheme (from-blue-400 to-blue-600)

## Environment Variables Required

Add these to your `.env.local`:

```bash
# Mercado Pago OAuth Configuration
MERCADOPAGO_CLIENT_ID=your_client_id_here
MERCADOPAGO_CLIENT_SECRET=your_client_secret_here
```

## How to Get Mercado Pago Credentials

1. **Create Mercado Pago Developer Account**
   - Go to: https://www.mercadopago.com/developers
   - Sign up or log in with your Mercado Pago account

2. **Create Application**
   - Navigate to "Your integrations" → "Create application"
   - Choose "Online payments" as the solution
   - Fill in application details

3. **Get OAuth Credentials**
   - In your application dashboard, go to "Credentials"
   - Copy your `Client ID` and `Client Secret`
   - Add redirect URI: `https://your-domain.com/api/mercadopago/callback`

4. **Test with Sandbox**
   - Mercado Pago provides sandbox credentials for testing
   - Use test credentials during development
   - Switch to production credentials when deploying

## OAuth Flow

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

## Next Steps (TODO)

### ⏳ **Pending Implementation:**

1. **Mercado Pago Preferences API** (Payment Link Generation)
   - Create `/api/mercadopago/create-payment-link/route.ts`
   - Use Mercado Pago's Preferences API
   - Endpoint: `POST https://api.mercadopago.com/checkout/preferences`
   - Returns: `init_point` (shareable payment link)

2. **Database Migration**
   - Update `payment_providers` table enum to include `mercadopago`
   - Remove `square` from provider_type enum

3. **Payment Link Creation Service**
   - Implement dynamic payment link generation for products
   - Support Mercado Pago, Stripe, and PayPal

4. **Testing**
   - Test OAuth flow with Mercado Pago sandbox
   - Test payment link generation
   - Test product payment integration

## Provider Priority

1. 🥇 **Mercado Pago** - Primary for Latin America
2. 🥈 **Stripe** - Secondary for international/cards
3. 🥉 **PayPal** - Tertiary for PayPal users

## API Documentation References

- **Mercado Pago OAuth**: https://www.mercadopago.com/developers/en/docs/checkout-api/oauth
- **Preferences API**: https://www.mercadopago.com/developers/en/reference/preferences/_checkout_preferences/post
- **Access Token**: https://www.mercadopago.com/developers/en/docs/checkout-api/authentication

## Notes

- Mercado Pago supports: PIX (Brazil), OXXO (Mexico), PSE (Colombia), and all major cards
- OAuth tokens expire - implement token refresh logic in production
- Use sandbox for development, production credentials for live
- Mercado Pago has different URLs per country (use regional endpoints as needed)

