import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// GET - Handle Stripe Connect onboarding refresh (when link expires)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.redirect(new URL('/dashboard?error=missing_organization', request.url))
    }

    const supabase = await getSupabaseServerClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.redirect(new URL('/auth?error=unauthorized', request.url))
    }

    // Get the stripe settings for this organization
    const { data: stripeSettings, error: settingsError } = await supabase
      .from('stripe_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (settingsError || !stripeSettings) {
      return NextResponse.redirect(new URL('/dashboard?error=stripe_not_found', request.url))
    }

    // Generate a new onboarding link for the existing account
    const accountLink = await stripe.accountLinks.create({
      account: stripeSettings.stripe_user_id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/refresh?organization_id=${organizationId}`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/success?organization_id=${organizationId}`,
      type: 'account_onboarding',
    })

    // Redirect to the new onboarding link
    return NextResponse.redirect(accountLink.url)

  } catch (error) {
    console.error('Stripe Connect refresh handler error:', error)
    return NextResponse.redirect(new URL('/dashboard?error=stripe_refresh_error', request.url))
  }
}