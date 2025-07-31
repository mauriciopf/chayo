import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const STRIPE_CONFIG = {
  clientId: process.env.STRIPE_CLIENT_ID,
  clientSecret: process.env.STRIPE_CLIENT_SECRET,
  tokenUrl: 'https://connect.stripe.com/oauth/token',
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/callback`
}

export async function GET(request: NextRequest) {
  // Handle OAuth callback from Stripe
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    console.error('Stripe OAuth error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=stripe_oauth_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=stripe_oauth_invalid`)
  }

  try {
    const supabase = getSupabaseServerClient()

    // Verify state parameter
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    const { organizationId, userId } = stateData

    // Verify user still has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single()

    if (membershipError || !membership) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=access_denied`)
    }

    // Exchange code for access token
    const tokenResponse = await fetch(STRIPE_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_secret: STRIPE_CONFIG.clientSecret!,
        code,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Stripe token exchange failed:', errorText)
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()

    // Store the Stripe connection in database
    const { error: updateError } = await supabase
      .from('stripe_settings')
      .upsert({
        organization_id: organizationId,
        stripe_user_id: tokenData.stripe_user_id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        scope: tokenData.scope,
        payment_type: 'manual_price_id', // Default to manual price ID option
        is_active: true,
        settings: {
          livemode: tokenData.livemode || false,
          stripe_publishable_key: tokenData.stripe_publishable_key || null
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id'
      })

    if (updateError) {
      console.error('Database error:', updateError)
      throw new Error('Failed to save Stripe settings')
    }

    // Redirect back to dashboard with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=stripe_connected`)

  } catch (error) {
    console.error('Stripe OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=stripe_oauth_failed`)
  }
}