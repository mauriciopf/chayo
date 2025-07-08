# Stripe Subscription Setup Guide

This guide will walk you through setting up Stripe subscriptions for your Chayo AI Dashboard.

## Prerequisites

1. A Stripe account (https://stripe.com)
2. Supabase project with authentication enabled
3. Environment variables configured

## Step 1: Stripe Dashboard Setup

### 1.1 Create Products and Prices

In your Stripe Dashboard (https://dashboard.stripe.com):

1. Go to **Products** → **Add product**
2. Create three products:

**Basic Plan (Chayo Básico)**
- Name: Chayo Básico
- Price: $97/month (recurring)
- Copy the Price ID (starts with `price_`)

**Pro Plan (Chayo Pro)**
- Name: Chayo Pro
- Price: $197/month (recurring) 
- Copy the Price ID

**Premium Plan (Chayo Premium)**
- Name: Chayo Premium
- Price: $297/month (recurring)
- Copy the Price ID

### 1.2 Setup Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the Webhook Secret (starts with `whsec_`)

## Step 2: Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret

# Stripe Price IDs
NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC=price_your_actual_basic_price_id
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_your_actual_pro_price_id
NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM=price_your_actual_premium_price_id
```

## Step 3: Supabase Database Schema

Ensure your Supabase project has the correct tables. The webhook will update the `user_subscriptions` table.

Required table structure:
```sql
CREATE TABLE user_subscriptions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    plan_name TEXT NOT NULL,
    status TEXT NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Step 4: Testing

### 4.1 Test Stripe Integration

1. Use Stripe test cards: https://stripe.com/docs/testing
2. Test card: `4242 4242 4242 4242`
3. Use any future expiry date and any 3-digit CVC

### 4.2 Test Webhook

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Forward webhooks to local development:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. The CLI will show webhook events in real-time

## Step 5: Production Deployment

### 5.1 Update Environment Variables

1. In your production environment (Vercel, etc.), set all environment variables
2. Update webhook URL to your production domain
3. Switch to live Stripe keys (starts with `pk_live_` and `sk_live_`)

### 5.2 Security

- Never expose secret keys in client-side code
- Use HTTPS in production
- Verify webhook signatures for security

## Features Included

✅ **Subscription Plans**: Basic, Pro, Premium with different features
✅ **Stripe Checkout**: Secure payment processing
✅ **Customer Portal**: Users can manage billing and cancel subscriptions  
✅ **Webhook Integration**: Real-time subscription status updates
✅ **Plan Enforcement**: Features limited based on subscription tier
✅ **User Dashboard**: View current plan and billing information

## Troubleshooting

### Common Issues

1. **Environment variables not loading**: Check `.env.local` file naming
2. **Webhook not receiving events**: Verify webhook URL and selected events
3. **Payment not updating subscription**: Check webhook endpoint is accessible
4. **CORS errors**: Ensure proper headers in API routes

### Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: Available in dashboard
- Test your webhook: https://dashboard.stripe.com/test/webhooks

## Next Steps

After setup is complete:

1. Test the full subscription flow
2. Customize plan features in the dashboard
3. Add more payment methods if needed
4. Set up billing notifications
5. Consider adding usage-based billing for advanced features
