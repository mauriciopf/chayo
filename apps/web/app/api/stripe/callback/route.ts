import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

const STRIPE_CONFIG = {
  clientId: process.env.STRIPE_CLIENT_ID,
  clientSecret: process.env.STRIPE_SECRET_KEY,
  tokenUrl: 'https://connect.stripe.com/oauth/token',
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/callback`
}

export const dynamic = 'force-dynamic'

// GET - Handle Stripe OAuth callback
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth error
    if (error) {
      console.error('Stripe OAuth error:', error)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=stripe_oauth_denied`)
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('Stripe OAuth callback missing code or state')
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=stripe_oauth_invalid`)
    }

    // Parse state to get organization ID
    const stateParts = state.split('_')
    if (stateParts.length < 3) {
      console.error('Invalid Stripe OAuth state format')
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=stripe_oauth_invalid`)
    }

    const organizationId = stateParts[0]

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Stripe OAuth callback - user not authenticated')
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=access_denied`)
    }

    // Check if user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      console.error('Stripe OAuth callback - user access denied')
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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=stripe_token_failed`)
    }

    const tokenData = await tokenResponse.json()

    // Check if provider already exists (shouldn't happen, but just in case)
    const { data: existingProvider } = await supabase
      .from('payment_providers')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('provider_type', 'stripe')
      .single()

    if (existingProvider) {
      // Update existing provider
      const { error: updateError } = await supabase
        .from('payment_providers')
        .update({
          provider_account_id: tokenData.stripe_user_id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          scope: tokenData.scope,
          provider_settings: {
            livemode: tokenData.livemode || false,
            stripe_publishable_key: tokenData.stripe_publishable_key || null
          },
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProvider.id)

      if (updateError) {
        console.error('Database update error:', updateError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=stripe_save_failed`)
      }

      // Generate payment links for existing products (async, don't wait)
      generatePaymentLinksForExistingProducts(organizationId, existingProvider.id).catch(err => 
        console.error('Background task failed:', err)
      )
    } else {
      // Check if this is the first provider for this organization
      const { data: existingProviders } = await supabase
        .from('payment_providers')
        .select('id')
        .eq('organization_id', organizationId)

      const isFirstProvider = !existingProviders || existingProviders.length === 0

      // Create new provider
      const { data: insertedProvider, error: insertError } = await supabase
        .from('payment_providers')
        .insert({
          organization_id: organizationId,
          provider_type: 'stripe',
          provider_account_id: tokenData.stripe_user_id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          scope: tokenData.scope,
          provider_settings: {
            livemode: tokenData.livemode || false,
            stripe_publishable_key: tokenData.stripe_publishable_key || null
          },
          payment_type: 'manual_price_id',
          is_active: true,
          is_default: isFirstProvider // Make default if first provider
        })
        .select()
        .single()

      if (insertError || !insertedProvider) {
        console.error('Database insert error:', insertError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=stripe_save_failed`)
      }

      // Generate payment links for existing products (async, don't wait)
      generatePaymentLinksForExistingProducts(organizationId, insertedProvider.id).catch(err => 
        console.error('Background task failed:', err)
      )
    }

    // Redirect back to dashboard with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=stripe_connected`)

  } catch (error) {
    console.error('Stripe OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=stripe_oauth_failed`)
  }
}

// Helper function to generate payment links for existing products
async function generatePaymentLinksForExistingProducts(organizationId: string, providerId: string) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get all products for this organization that don't have payment links
    const { data: products, error: productsError } = await supabase
      .from('products_list_tool')
      .select('id, name, price, discounted_price, has_active_offer, organization_id')
      .eq('organization_id', organizationId)
      .is('payment_link_url', null)
      .not('price', 'is', null)
      .gt('price', 0)

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return
    }

    if (!products || products.length === 0) {
      console.log('No products to generate payment links for')
      return
    }

    console.log(`Generating payment links for ${products.length} products...`)

    // Limit to 50 products to avoid timeout (can be adjusted)
    const productsToProcess = products.slice(0, 50)
    
    if (products.length > 50) {
      console.log(`⚠️ Warning: ${products.length} products found, processing first 50. Run again for remaining.`)
    }

    // Generate payment links for each product
    for (const product of productsToProcess) {
      try {
        // Use discounted_price if active offer, otherwise use regular price
        const finalPrice = product.has_active_offer && product.discounted_price 
          ? product.discounted_price 
          : product.price

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/create-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: product.organization_id,
            amount: Math.round(finalPrice * 100),
            description: product.name
          })
        })

        if (response.ok) {
          const { paymentUrl } = await response.json()
          
          // Update product with payment link
          await supabase
            .from('products_list_tool')
            .update({
              payment_link_url: paymentUrl,
              payment_provider_id: providerId
            })
            .eq('id', product.id)

          console.log(`✅ Generated payment link for product: ${product.name}`)
        } else {
          const errorText = await response.text()
          console.error(`Failed to generate payment link for product ${product.name}:`, errorText)
        }
      } catch (productError) {
        console.error(`Error generating payment link for product ${product.id}:`, productError)
      }
    }

    console.log('Finished generating payment links for existing products')
  } catch (error) {
    console.error('Error in generatePaymentLinksForExistingProducts:', error)
  }
}
