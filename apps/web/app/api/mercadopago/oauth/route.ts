import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/mercadopago/oauth
 * Initiates Mercado Pago OAuth flow
 */
export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await req.json()

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const clientId = process.env.MERCADOPAGO_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/callback`

    if (!clientId) {
      console.error('MERCADOPAGO_CLIENT_ID not configured')
      return NextResponse.json({ error: 'Mercado Pago not configured' }, { status: 500 })
    }

    // Mercado Pago OAuth URL
    // Documentation: https://www.mercadopago.com/developers/en/docs/checkout-api/oauth
    const authUrl = new URL('https://auth.mercadopago.com/authorization')
    authUrl.searchParams.append('client_id', clientId)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('platform_id', 'mp')
    authUrl.searchParams.append('state', organizationId) // Store organizationId in state
    authUrl.searchParams.append('redirect_uri', redirectUri)

    return NextResponse.json({
      authUrl: authUrl.toString(),
      onboardingUrl: authUrl.toString()
    })

  } catch (error) {
    console.error('Mercado Pago OAuth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Mercado Pago OAuth' },
      { status: 500 }
    )
  }
}

