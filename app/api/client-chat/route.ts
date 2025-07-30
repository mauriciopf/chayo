import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { ClientSystemPromptService } from '@/lib/services/clientPrompt/ClientSystemPromptService'
import { embeddingService } from '@/lib/services/embeddingService'
import { conversationStorageService } from '@/lib/services/conversationStorageService'

export async function POST(request: NextRequest) {
  try {
    const { message, organizationId, locale = 'en', messages = [] } = await request.json()

    if (!message || !organizationId) {
      return NextResponse.json(
        { error: 'Message and organizationId are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()
    
    // Verify organization exists
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      console.error('Organization not found:', orgError)
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get client-facing system prompt (RAG-based) with locale support
    const systemPrompt = await ClientSystemPromptService.buildClientSystemPrompt(organizationId, message, locale, supabase)
    // No ragMessages needed, all context is in the system prompt

    // Prepare messages for OpenAI
    const openAIMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role === 'ai' ? 'assistant' : msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not available')
      return NextResponse.json({
        response: 'Lo siento, el servicio de chat no está disponible en este momento. Por favor, intenta más tarde.'
      })
    }

    // Call OpenAI
    console.log('🚀 Calling OpenAI API...')
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openAIMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!openAIResponse.ok) {
      console.error('❌ OpenAI API error:', openAIResponse.status, await openAIResponse.text())
      return NextResponse.json({
        response: 'Lo siento, ocurrió un error. Por favor, intenta nuevamente.'
      })
    }

    const openAIData = await openAIResponse.json()
    const assistantResponse = openAIData.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.'

    console.log('✅ Client chat response generated successfully:', {
      responseLength: assistantResponse.length,
      responsePreview: assistantResponse.substring(0, 100) + (assistantResponse.length > 100 ? '...' : ''),
      openAIUsage: openAIData.usage
    })

    // Store the conversation exchange for future reference
    await conversationStorageService.storeConversationExchange(
      organizationId,
      message,
      assistantResponse,
      {
        channel: 'client_chat',
        organization_name: organization.name
      }
    )

    return NextResponse.json({
      response: assistantResponse
    })

  } catch (error) {
    console.error('Client chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 