import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/server'
import { twilioClient, TWILIO_CONFIG } from '@/lib/twilio/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = params.id
    const { phoneNumber, countryCode, greeting, isNewNumber = true } = await request.json()

    // Get user from auth
    // Authentication using server supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has access to organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('organization_id, role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Organization access denied' },
        { status: 403 }
      )
    }

    // Get organization and agent info
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get the agent for this organization
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, system_prompt')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'No agent found for this organization' },
        { status: 404 }
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
          friendlyName: `Chayo AI - ${organization.name}`,
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

      if (existingNumber) {
        console.log('Phone number already registered:', formattedPhone)
      } else {
        // Add phone number to messaging service
        await twilioClient.messaging.v1
          .services(messagingServiceSid)
          .phoneNumbers.create({
            phoneNumberSid: formattedPhone
          })
        console.log('Phone number registered:', formattedPhone)
      }

      // Create or update agent channel record
      const { data: existingChannel, error: channelCheckError } = await supabase
        .from('agent_channels')
        .select('*')
        .eq('agent_id', agent.id)
        .eq('channel_type', 'whatsapp')
        .single()

      const channelData = {
        agent_id: agent.id,
        channel_type: 'whatsapp',
        phone_number: formattedPhone,
        country_code: countryCode,
        business_name: organization.name,
        business_description: greeting || `WhatsApp support for ${organization.name}`,
        number_flow: isNewNumber ? 'new' : 'existing',
        twilio_messaging_service_sid: messagingServiceSid,
        webhook_url: TWILIO_CONFIG.webhookUrl,
        status: 'pending_verification',
        user_id: user.id,
        connected: false,
        credentials: {
          messaging_service_sid: messagingServiceSid,
          phone_number: formattedPhone
        }
      }

      let channel
      if (existingChannel && !channelCheckError) {
        // Update existing channel
        const { data: updatedChannel, error: updateError } = await supabase
          .from('agent_channels')
          .update(channelData)
          .eq('id', existingChannel.id)
          .select()
          .single()

        if (updateError) {
          throw new Error(`Failed to update channel: ${updateError.message}`)
        }
        channel = updatedChannel
      } else {
        // Create new channel
        const { data: newChannel, error: insertError } = await supabase
          .from('agent_channels')
          .insert(channelData)
          .select()
          .single()

        if (insertError) {
          throw new Error(`Failed to create channel: ${insertError.message}`)
        }
        channel = newChannel
      }

      return NextResponse.json({
        success: true,
        data: {
          channel,
          organizationId,
          organizationName: organization.name,
          agentId: agent.id,
          agentName: agent.name,
          phoneNumber: formattedPhone,
          messagingServiceSid,
          nextSteps: [
            'Complete WhatsApp Business verification in Twilio Console',
            'Set up webhook endpoints for message handling',
            'Test the integration with a trial message'
          ]
        }
      })

    } catch (twilioError: any) {
      console.error('Twilio setup error:', twilioError)
      return NextResponse.json(
        { 
          error: 'Failed to setup WhatsApp integration', 
          details: twilioError.message 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('WhatsApp setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 