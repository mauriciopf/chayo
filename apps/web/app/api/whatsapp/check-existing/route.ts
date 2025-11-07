import { NextRequest, NextResponse } from 'next/server'

interface Business {
  id: string
  name: string
}

interface WABA {
  id: string
  name?: string
  business_id: string
  business_name?: string
}

/**
 * POST /api/whatsapp/check-existing
 * Check if user already has WhatsApp Business Accounts in any of their businesses
 * 
 * This is a "preflight" check before opening Embedded Signup to avoid the
 * "Business already linked to Embedded Signup" disabled option screen
 */
export async function POST(request: NextRequest) {
  try {
    const { userAccessToken } = await request.json()

    if (!userAccessToken) {
      return NextResponse.json(
        { error: 'User access token is required' },
        { status: 400 }
      )
    }

    // Step 1: Get all businesses the user can manage
    const businessesResponse = await fetch(
      `https://graph.facebook.com/v23.0/me/businesses?access_token=${userAccessToken}`
    )

    if (!businessesResponse.ok) {
      const error = await businessesResponse.json()
      console.error('❌ Failed to fetch businesses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user businesses', details: error },
        { status: businessesResponse.status }
      )
    }

    const businessesData = await businessesResponse.json()
    const businesses: Business[] = businessesData.data || []

    console.log(`📊 Found ${businesses.length} businesses for user`)

    // Step 2: Check each business for existing WABAs
    const existingWABAs: WABA[] = []

    for (const business of businesses) {
      try {
        const wabaResponse = await fetch(
          `https://graph.facebook.com/v23.0/${business.id}/owned_whatsapp_business_accounts?access_token=${userAccessToken}`
        )

        if (wabaResponse.ok) {
          const wabaData = await wabaResponse.json()
          const wabas = wabaData.data || []

          if (wabas.length > 0) {
            console.log(`✅ Business "${business.name}" has ${wabas.length} WABA(s)`)
            
            // Add business context to each WABA
            existingWABAs.push(...wabas.map((waba: any) => ({
              id: waba.id,
              name: waba.name,
              business_id: business.id,
              business_name: business.name
            })))
          }
        }
      } catch (error) {
        console.error(`⚠️ Error checking WABAs for business ${business.id}:`, error)
        // Continue checking other businesses even if one fails
      }
    }

    // Step 3: Return results
    if (existingWABAs.length > 0) {
      console.log(`✅ Found ${existingWABAs.length} existing WABA(s)`)
      return NextResponse.json({
        hasExistingWABA: true,
        wabas: existingWABAs,
        businesses: businesses
      })
    } else {
      console.log('📭 No existing WABAs found - user can proceed with Embedded Signup')
      return NextResponse.json({
        hasExistingWABA: false,
        wabas: [],
        businesses: businesses
      })
    }
  } catch (error) {
    console.error('❌ Error checking existing WABAs:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check existing WABAs' },
      { status: 500 }
    )
  }
}

