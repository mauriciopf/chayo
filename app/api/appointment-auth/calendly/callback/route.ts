import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const OAUTH_CONFIG = {
  clientId: process.env.CALENDLY_CLIENT_ID,
  clientSecret: process.env.CALENDLY_CLIENT_SECRET,
  tokenUrl: 'https://auth.calendly.com/oauth/token',
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/appointment-auth/calendly/callback`
}

export async function GET(request: NextRequest) {
  // Handle OAuth callback from Calendly
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=oauth_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=oauth_invalid`)
  }

  try {
    const supabase = getSupabaseServerClient()

    // Verify state parameter
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    const { organizationId, userId, provider } = stateData

    if (provider !== 'calendly') {
      throw new Error('Invalid provider in state')
    }

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
    const tokenResponse = await fetch(OAUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: OAUTH_CONFIG.clientId!,
        client_secret: OAUTH_CONFIG.clientSecret!,
        code,
        redirect_uri: OAUTH_CONFIG.redirectUri
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()

    // Get Calendly user info to extract booking URL
    let userInfo = null
    let bookingUrl = 'connected'

    const userResponse = await fetch('https://api.calendly.com/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })
    
    if (userResponse.ok) {
      userInfo = await userResponse.json()
      bookingUrl = userInfo.resource?.scheduling_url || 'connected'
    } else {
      console.error('Failed to fetch Calendly user info:', await userResponse.text())
      // Continue with basic connection even if user info fails
    }

    // Store the access token and provider info
    const { error: updateError } = await supabase
      .from('appointment_settings')
      .upsert({
        organization_id: organizationId,
        provider: 'calendly',
        provider_url: bookingUrl,
        settings: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : null,
          user_info: userInfo || {}
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id'
      })

    if (updateError) {
      console.error('Database error:', updateError)
      throw new Error('Failed to save provider settings')
    }

    // Redirect back to dashboard with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=calendly_connected`)

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=oauth_failed`)
  }
}