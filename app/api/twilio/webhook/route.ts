import { NextRequest, NextResponse } from 'next/server'
import { twilioClient } from '@/lib/twilio/client'
import { createClient } from '@/lib/supabase/server'
import { conversationStorageService } from '@/lib/services/conversationStorageService'

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming webhook data from Twilio
    const formData = await request.formData()
    
    const messageBody = formData.get('Body') as string
    const fromNumber = formData.get('From') as string
    const toNumber = formData.get('To') as string
    const messageSid = formData.get('MessageSid') as string
    const accountSid = formData.get('AccountSid') as string
    const messagingServiceSid = formData.get('MessagingServiceSid') as string

    console.log('Incoming WhatsApp message:', {
      from: fromNumber,
      to: toNumber,
      body: messageBody,
      messageSid,
      messagingServiceSid
    })

    // Validate required fields
    if (!messageBody || !fromNumber || !toNumber) {
      console.error('Missing required webhook data')
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    }

    // Get Supabase client
    const { supabase } = createClient(request)

    // Find the agent channel configuration for this number
    const { data: channel, error: channelError } = await supabase
      .from('agent_channels')
      .select(`
        *,
        agents (
          id,
          name,
          greeting,
          tone,
          goals,
          system_prompt,
          user_id,
          organization_id
        )
      `)
      .eq('channel_type', 'whatsapp')
      .eq('phone_number', toNumber)
      .eq('connected', true)
      .single()

    if (channelError || !channel) {
      console.error('No active WhatsApp channel found for number:', toNumber)
      return NextResponse.json({ error: 'No active channel found' }, { status: 404 })
    }

    // Store the incoming message
    const { data: savedMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        agent_id: channel.agent_id,
        channel_id: channel.id,
        channel_type: 'whatsapp',
        direction: 'inbound',
        content: messageBody,
        from_number: fromNumber,
        to_number: toNumber,
        twilio_message_sid: messageSid,
        metadata: {
          accountSid,
          messagingServiceSid,
          twilioData: Object.fromEntries(formData.entries())
        }
      })
      .select()
      .single()

    if (messageError) {
      console.error('Failed to save message:', messageError)
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    // Store the incoming message in conversation embeddings
    await conversationStorageService.storeSingleMessage(
      channel.agents.organization_id,
      messageBody,
      'user',
      {
        channel: 'whatsapp',
        from_number: fromNumber,
        to_number: toNumber,
        message_sid: messageSid
      }
    )

    // TODO: Generate AI response using the agent's configuration
    // For now, send a simple acknowledgment
    const aiResponse = await generateAIResponse(messageBody, channel.agents)

    // Send response back via Twilio
    try {
      if (!twilioClient) {
        throw new Error('Twilio client not available')
      }
      
      const twilioResponse = await twilioClient.messages.create({
        body: aiResponse,
        from: toNumber, // This should be the WhatsApp Business number
        to: fromNumber,
        messagingServiceSid: messagingServiceSid || channel.twilio_messaging_service_sid
      })

      // Store the outbound message
      await supabase
        .from('messages')
        .insert({
          agent_id: channel.agent_id,
          channel_id: channel.id,
          channel_type: 'whatsapp',
          direction: 'outbound',
          content: aiResponse,
          from_number: toNumber,
          to_number: fromNumber,
          twilio_message_sid: twilioResponse.sid,
          parent_message_id: savedMessage.id,
          metadata: {
            twilioStatus: twilioResponse.status,
            twilioPrice: twilioResponse.price,
            twilioDirection: twilioResponse.direction
          }
        })

      // Store the AI response in conversation embeddings
      await conversationStorageService.storeSingleMessage(
        channel.agents.organization_id,
        aiResponse,
        'assistant',
        {
          channel: 'whatsapp',
          from_number: toNumber,
          to_number: fromNumber,
          message_sid: twilioResponse.sid,
          parent_message_id: savedMessage.id
        }
      )

      console.log('AI response sent:', twilioResponse.sid)
      
    } catch (twilioError: any) {
      console.error('Failed to send Twilio response:', twilioError)
      // Don't return error to Twilio, just log it
    }

    // Return TwiML response to acknowledge webhook
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`

    return new NextResponse(twimlResponse, {
      headers: {
        'Content-Type': 'text/xml'
      }
    })

  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Simple AI response generator (placeholder)
async function generateAIResponse(message: string, agent: any): Promise<string> {
  // TODO: Integrate with OpenAI or your preferred AI service
  // Use the agent's system_prompt, tone, and goals to generate contextual responses
  
  const responses = [
    `¡Hola! Gracias por contactar con ${agent.name}. He recibido tu mensaje: "${message}". ¿En qué puedo ayudarte hoy?`,
    `Hola, soy ${agent.name}, tu asistente de IA. He leído tu mensaje y estoy aquí para ayudarte. ¿Qué necesitas?`,
    `¡Saludos! ${agent.name} aquí. He visto tu mensaje sobre "${message}". ¿Cómo puedo asistirte?`
  ]
  
  // Return a random response for now
  return responses[Math.floor(Math.random() * responses.length)]
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'WhatsApp webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}
