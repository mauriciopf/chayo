import { NextRequest, NextResponse } from 'next/server'
import { twilioClient, TWILIO_CONFIG } from '@/lib/twilio/client'
import { getSupabaseServerClient } from "@/lib/supabase/server"

interface WhatsAppSetupRequest {
  phoneNumber: string
  countryCode: string
  agentId: string
  businessName?: string
  businessDescription?: string
  numberFlow?: 'new' | 'existing'
  isNewNumber?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const { 
      phoneNumber, 
      countryCode, 
      agentId, 
      businessName, 
      businessDescription,
      numberFlow,
      isNewNumber 
    }: WhatsAppSetupRequest = await request.json()

    // Validate input
    if (!phoneNumber || !countryCode || !agentId) {
      return NextResponse.json(
        { error: 'Phone number, country code, and agent ID are required' },
        { status: 400 }
      )
    }

    // Format phone number for Twilio (E.164 format)
    const formattedPhone = `+${countryCode}${phoneNumber.replace(/[^\d]/g, '')}`

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    if (!phoneRegex.test(formattedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Get user from auth
    // Authentication using server supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or unauthorized' },
        { status: 403 }
      )
    }

    let messagingServiceSid = TWILIO_CONFIG.messagingServiceSid

    // Create messaging service if it doesn't exist
    if (!messagingServiceSid) {
      if (!twilioClient) {
        return NextResponse.json(
          { error: 'Twilio client not available' },
          { status: 500 }
        )
      }
      
      try {
        const messagingService = await twilioClient.messaging.v1.services.create({
          friendlyName: `Chayo AI - ${user.email}`,
          usecase: 'conversational',
          useInboundWebhookOnNumber: false,
          inboundRequestUrl: TWILIO_CONFIG.webhookUrl,
          inboundMethod: 'POST',
          fallbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/twilio/fallback`,
          fallbackMethod: 'POST',
          statusCallback: `${process.env.NEXT_PUBLIC_SITE_URL}/api/twilio/status`,
        })
        
        messagingServiceSid = messagingService.sid
        console.log('Created messaging service:', messagingServiceSid)
      } catch (twilioError: any) {
        console.error('Failed to create messaging service:', twilioError)
        return NextResponse.json(
          { error: 'Failed to create messaging service', details: twilioError.message },
          { status: 500 }
        )
      }
    }

    // Register phone number for WhatsApp Business
    try {
      if (!twilioClient) {
        return NextResponse.json(
          { error: 'Twilio client not available' },
          { status: 500 }
        )
      }
      
      // First, check if phone number is already registered
      const existingNumbers = await twilioClient.messaging.v1
        .services(messagingServiceSid)
        .phoneNumbers.list()

      const existingNumber = existingNumbers.find(num => num.phoneNumber === formattedPhone)

      let phoneNumberSid: string

      if (!existingNumber) {
        // Add phone number to messaging service
        const phoneNumberResource = await twilioClient.messaging.v1
          .services(messagingServiceSid)
          .phoneNumbers.create({
            phoneNumberSid: formattedPhone // This might need to be a Twilio phone number SID
          })
        
        phoneNumberSid = phoneNumberResource.sid
      } else {
        phoneNumberSid = existingNumber.sid
      }

      // Store WhatsApp channel configuration in database
      const channelData = {
        agent_id: agentId,
        channel_type: 'whatsapp',
        phone_number: formattedPhone,
        country_code: countryCode,
        business_name: businessName || null,
        business_description: businessDescription || null,
        twilio_messaging_service_sid: messagingServiceSid,
        twilio_phone_number_sid: phoneNumberSid,
        webhook_url: TWILIO_CONFIG.webhookUrl,
        status: isNewNumber ? 'trial' : 'pending_migration',
        connected: isNewNumber ? true : false,
        user_id: user.id,
        number_flow: numberFlow || 'existing',
        credentials: {
          twilioAccountSid: TWILIO_CONFIG.accountSid,
          messagingServiceSid,
          phoneNumberSid,
          webhookUrl: TWILIO_CONFIG.webhookUrl
        }
      }

      // Upsert channel configuration
      const { data: channel, error: channelError } = await supabase
        .from('agent_channels')
        .upsert(channelData, {
          onConflict: 'agent_id,channel_type'
        })
        .select()
        .single()

      if (channelError) {
        console.error('Database error:', channelError)
        return NextResponse.json(
          { error: 'Failed to save channel configuration' },
          { status: 500 }
        )
      }

      // Create trial record for new numbers (3-day trial)
      if (isNewNumber && numberFlow === 'new') {
        const trialEndDate = new Date()
        trialEndDate.setDate(trialEndDate.getDate() + 3)

        const { error: trialError } = await supabase
          .from('whatsapp_trials')
          .insert({
            user_id: user.id,
            agent_id: agentId,
            phone_number: formattedPhone,
            twilio_number_sid: phoneNumberSid,
            trial_end_date: trialEndDate.toISOString(),
            status: 'active'
          })

        if (trialError) {
          console.error('Failed to create trial record:', trialError)
          // Don't fail the entire request, just log the error
        } else {
          console.log('Created 3-day trial for WhatsApp number:', formattedPhone)
        }
      }

      return NextResponse.json({
        success: true,
        message: isNewNumber && numberFlow === 'new' 
          ? 'WhatsApp channel setup with 3-day trial initiated' 
          : 'WhatsApp channel setup initiated',
        data: {
          channelId: channel.id,
          phoneNumber: formattedPhone,
          status: isNewNumber ? 'trial' : 'pending_verification',
          messagingServiceSid,
          isTrial: isNewNumber && numberFlow === 'new',
          trialEndsAt: isNewNumber && numberFlow === 'new' 
            ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
          nextSteps: isNewNumber && numberFlow === 'new' 
            ? [
                'Your 3-day WhatsApp trial has started',
                'Test messaging functionality',
                'Upgrade to continue using after trial period'
              ]
            : [
                'Verify your WhatsApp Business account with Twilio',
                'Complete WhatsApp Business API setup',
                'Test message flow'
              ]
        }
      })

    } catch (twilioError: any) {
      console.error('Twilio API error:', twilioError)
      
      // Handle specific Twilio errors
      if (twilioError.code === 21608) {
        return NextResponse.json(
          { error: 'Phone number is not a valid Twilio phone number. Please use a Twilio-verified number.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to register phone number with Twilio', details: twilioError.message },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('WhatsApp setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
