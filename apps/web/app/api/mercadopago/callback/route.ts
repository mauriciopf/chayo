import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

/**
 * GET /api/mercadopago/callback
 * Handles Mercado Pago OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // organizationId
    const error = searchParams.get('error')

    if (error) {
      console.error('Mercado Pago OAuth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment_error=mercadopago_${error}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment_error=missing_parameters`
      )
    }

    const organizationId = state

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: process.env.MERCADOPAGO_CLIENT_ID!,
        client_secret: process.env.MERCADOPAGO_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/callback`
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Mercado Pago token exchange error:', errorData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment_error=token_exchange_failed`
      )
    }

    const tokenData = await tokenResponse.json()
    const {
      access_token,
      refresh_token,
      expires_in,
      user_id, // Mercado Pago user ID
      public_key
    } = tokenData

    // Get Supabase client
    const supabase = await getSupabaseServerClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment_error=unauthorized`
      )
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment_error=access_denied`
      )
    }

    // Check if Mercado Pago provider already exists for this organization
    const { data: existingProvider } = await supabase
      .from('payment_providers')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('provider_type', 'mercadopago')
      .single()

    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    if (existingProvider) {
      // Update existing provider
      const { error: updateError } = await supabase
        .from('payment_providers')
        .update({
          access_token,
          refresh_token,
          token_expires_at: tokenExpiresAt,
          provider_account_id: user_id.toString(),
          provider_settings: { public_key },
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProvider.id)

      if (updateError) {
        console.error('Error updating Mercado Pago provider:', updateError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment_error=update_failed`
        )
      }
    } else {
      // Create new provider
      const { error: insertError } = await supabase
        .from('payment_providers')
        .insert({
          organization_id: organizationId,
          provider_type: 'mercadopago',
          provider_account_id: user_id.toString(),
          access_token,
          refresh_token,
          token_expires_at: tokenExpiresAt,
          provider_settings: { public_key },
          is_active: true,
          is_default: false
        })

      if (insertError) {
        console.error('Error creating Mercado Pago provider:', insertError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment_error=creation_failed`
        )
      }
    }

    // Redirect back to dashboard with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment_success=mercadopago`
    )

  } catch (error) {
    console.error('Mercado Pago callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment_error=unknown`
    )
  }
}

