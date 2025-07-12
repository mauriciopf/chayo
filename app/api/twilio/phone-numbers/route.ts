import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { twilioClient, TWILIO_CONFIG } from '@/lib/twilio/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const countryCode = searchParams.get('countryCode') || 'US'
    
    // Get user from auth
    const { supabase } = createClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!twilioClient) {
      return NextResponse.json(
        { error: 'Twilio client not available' },
        { status: 500 }
      )
    }

    try {
      // Search for available phone numbers with WhatsApp capability
      const availableNumbers = await twilioClient.availablePhoneNumbers(countryCode)
        .local
        .list({
          limit: 10,
          smsEnabled: true,
          voiceEnabled: true
        })

      // Format the numbers for display
      const formattedNumbers = availableNumbers.map(number => ({
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        locality: number.locality,
        region: number.region,
        isoCountry: number.isoCountry,
        capabilities: number.capabilities,
        monthlyPrice: '$1.00' // Typical Twilio pricing, should be fetched from pricing API
      }))

      return NextResponse.json({
        success: true,
        availableNumbers: formattedNumbers,
        count: formattedNumbers.length
      })

    } catch (twilioError: any) {
      console.error('Twilio error fetching numbers:', twilioError)
      return NextResponse.json(
        { 
          error: 'Failed to fetch available numbers',
          details: twilioError.message
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Available numbers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Get user from auth
    const { supabase } = createClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!twilioClient) {
      return NextResponse.json(
        { error: 'Twilio client not available' },
        { status: 500 }
      )
    }

    try {
      // Purchase the phone number
      const purchasedNumber = await twilioClient.incomingPhoneNumbers.create({
        phoneNumber: phoneNumber,
        smsUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/twilio/webhook`,
        smsMethod: 'POST',
        voiceUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/twilio/webhook`,
        voiceMethod: 'POST',
        statusCallback: `${process.env.NEXT_PUBLIC_SITE_URL}/api/twilio/status`,
        statusCallbackMethod: 'POST'
      })

      return NextResponse.json({
        success: true,
        phoneNumber: purchasedNumber.phoneNumber,
        sid: purchasedNumber.sid,
        friendlyName: purchasedNumber.friendlyName,
        message: 'Phone number purchased successfully'
      })

    } catch (twilioError: any) {
      console.error('Twilio error purchasing number:', twilioError)
      return NextResponse.json(
        { 
          error: 'Failed to purchase phone number',
          details: twilioError.message
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Purchase number error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
