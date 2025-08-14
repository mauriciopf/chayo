# Vercel Environment Variables

Add these environment variables in your Vercel project settings:

## Required for Basic Functionality:
```
NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_URL=https://nkmduznghoxkuxniqgfx.supabase.co
NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rbWR1em5naG94a3V4bmlxZ2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NTMzNzAsImV4cCI6MjA2NzUyOTM3MH0.VfocmQ7U6wc4jiTL_30dm9m_ibe0QZYeRH4NRrTdPuU
```

## For Stripe Integration (Update with your real keys):
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC=price_your_basic_plan_id
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_your_pro_plan_id
NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM=price_your_premium_plan_id
```

## For Website Scraping (Required):
```
BROWSERLESS_TOKEN=your_browserless_io_token
BROWSERLESS_URL=https://chrome.browserless.io
```

## Optional:
```
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## Steps to Deploy:
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository: mauriciopf/chayo
4. Add the environment variables above
5. Deploy!

This will bypass your local firewall issues since Vercel builds directly from GitHub.
