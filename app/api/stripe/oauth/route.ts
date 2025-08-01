import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// POST - Initialize Stripe Connect Onboarding flow
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = await request.json()

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Check if user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if Stripe is already connected for this organization
    const { data: existingSettings } = await supabase
      .from('stripe_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    let accountId: string

    if (existingSettings?.stripe_user_id && !existingSettings.is_active) {
      // Use existing account if onboarding wasn't completed
      accountId = existingSettings.stripe_user_id
    } else if (!existingSettings) {
      // Create new connected account
      const account = await stripe.accounts.create({
        type: 'express',
        metadata: {
          organization_id: organizationId,
          user_id: user.id
        }
      })
      accountId = account.id

      // Save account to database
      await supabase
        .from('stripe_settings')
        .insert({
          organization_id: organizationId,
          stripe_user_id: accountId,
          is_active: false // Will be true after onboarding completion
        })
    } else {
      return NextResponse.json({ 
        error: 'Stripe already connected',
        message: 'This organization already has an active Stripe connection.' 
      }, { status: 400 })
    }

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/refresh?organization_id=${organizationId}`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/success?organization_id=${organizationId}`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      onboardingUrl: accountLink.url,
      accountId: accountId
    })

  } catch (error) {
    console.error('Stripe Connect initialization error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}