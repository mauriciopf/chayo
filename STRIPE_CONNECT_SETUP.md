# Modern Stripe Connect Setup Guide

This guide covers the **modern Stripe Connect Onboarding flow** (recommended by Stripe as of 2024).

## What Changed

❌ **Old OAuth Flow**: Manual token exchange, complex setup  
✅ **New Connect Onboarding**: Stripe handles everything automatically

## Prerequisites

1. A Stripe account (https://stripe.com)
2. Supabase project with `stripe_settings` table
3. Environment variables configured

## Step 1: Environment Variables

Add these to your `.env.local`:

```bash
# Required Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For subscription plans (if using)
NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC=price_your_actual_basic_price_id
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_your_actual_pro_price_id
NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM=price_your_actual_premium_price_id
```

**Note**: No need for `STRIPE_CLIENT_ID` or `STRIPE_CLIENT_SECRET` with the new flow!

## Step 2: Database Migration

Run the Stripe payments migration:

```sql
-- Run this in your Supabase SQL Editor
-- File: supabase/migrations/20250130000007_add_stripe_payments.sql
```

This creates the `stripe_settings` table with the correct schema.

## Step 3: Webhook Setup

### Configure Webhook in Stripe Dashboard:

1. **Go to Stripe Dashboard** → **Developers** → **Webhooks**
2. **Click "Add endpoint"**
3. **Endpoint URL**: `https://chayo.ai/api/stripe/webhook`
   - For local development: `http://localhost:3000/api/stripe/webhook`
4. **Select these events**:

**For Platform Subscriptions:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

**For Connect Accounts (Payment Tool):**
   - `account.updated`
   - `capability.updated`

5. **Copy the Webhook Secret** (starts with `whsec_`)
6. **Add to your environment**: `STRIPE_WEBHOOK_SECRET=whsec_your_secret`

### Why You Need Webhooks:

✅ **Platform Subscriptions** - Update user plan when they subscribe to Chayo  
✅ **Connect Accounts** - Automatically activate payment tool when onboarding completes  
✅ **Real-time Updates** - Keep database in sync with Stripe changes  
✅ **Reliability** - Handle events even if user closes browser  

## Step 4: How It Works

### User Flow:
1. **User clicks "Connect Stripe"** in PaymentToolConfig
2. **System creates connected account** via Stripe API
3. **User redirects to Stripe onboarding** (handled by Stripe)
4. **User completes onboarding** on Stripe's secure forms
5. **System marks account active** when onboarding complete

### API Endpoints:
- `POST /api/stripe/oauth` - Creates account & onboarding link
- `GET /api/stripe/connect/success` - Handles successful completion
- `GET /api/stripe/connect/refresh` - Handles expired onboarding links

## Step 4: Testing

### Local Development:
1. Start your dev server: `npm run dev`
2. Go to dashboard and try connecting Stripe
3. Use Stripe test mode for development

### Stripe Test Data:
- Use any email address
- Use test business info
- Complete the onboarding flow

## Step 5: Production Deployment

1. **Update environment variables** to use live Stripe keys
2. **Set NEXT_PUBLIC_APP_URL** to your production domain
3. **Webhook endpoints** will use your production URLs automatically

## Benefits of New Approach

✅ **Simpler Setup** - No OAuth app configuration needed  
✅ **Better Security** - Stripe handles all sensitive operations  
✅ **Modern UX** - Stripe's optimized onboarding experience  
✅ **Less Maintenance** - No token refresh logic needed  
✅ **Future-proof** - Stripe's recommended approach  

## Troubleshooting

### Common Issues:

1. **Environment variables not loading**: Check `.env.local` file naming
2. **Onboarding link expired**: User will be redirected to refresh endpoint
3. **Account not activating**: Check Stripe dashboard for onboarding status
4. **Database errors**: Verify `stripe_settings` table exists

### Debug Steps:

1. Check browser console for errors
2. Check server logs for Stripe API errors
3. Verify database permissions
4. Test with Stripe's test mode first

## Migration from Old OAuth

If you were using the old OAuth flow:

1. **Old accounts will continue working** (backward compatible)
2. **New connections use onboarding** automatically
3. **Remove unused OAuth env vars**: `STRIPE_CLIENT_ID`, `STRIPE_CLIENT_SECRET`
4. **Old callback route** is kept for compatibility but deprecated

## Support

- Stripe Documentation: https://stripe.com/docs/connect/onboarding
- Connect Onboarding Guide: https://stripe.com/docs/connect/onboarding/quickstart