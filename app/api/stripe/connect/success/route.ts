import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// GET - Handle successful Stripe Connect onboarding completion
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.redirect(new URL('/dashboard?error=missing_organization', request.url))
    }

    const supabase = getSupabaseServerClient()
    
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

    // Verify the account with Stripe
    const account = await stripe.accounts.retrieve(stripeSettings.stripe_user_id)
    
    // Check if onboarding is complete
    if (account.details_submitted && account.charges_enabled) {
      // Update the database to mark as active
      await supabase
        .from('stripe_settings')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)

      // Redirect to dashboard with success message
      return NextResponse.redirect(new URL('/dashboard?stripe=connected', request.url))
    } else {
      // Onboarding not complete, redirect back to dashboard with info
      return NextResponse.redirect(new URL('/dashboard?stripe=incomplete', request.url))
    }

  } catch (error) {
    console.error('Stripe Connect success handler error:', error)
    return NextResponse.redirect(new URL('/dashboard?error=stripe_error', request.url))
  }
}