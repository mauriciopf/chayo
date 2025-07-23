import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ClientSystemPromptService } from '@/lib/services/clientSystemPromptService'
import { embeddingService } from '@/lib/services/embeddingService'

export async function POST(request: NextRequest) {
  try {
    const { message, organizationId, messages = [] } = await request.json()

    if (!message || !organizationId) {
      return NextResponse.json(
        { error: 'Message and organizationId are required' },
        { status: 400 }
      )
    }

    console.log('Client Chat API - Request:', { organizationId, message: message.substring(0, 50) + '...' })

    // Create server-side Supabase client
    const { supabase } = createClient(request)

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

    // Get client-facing system prompt (RAG-based)
    const systemPrompt = await ClientSystemPromptService.buildClientSystemPrompt(organizationId, message)
    // No ragMessages needed, all context is in the system prompt

    console.log('Client system prompt generated, length:', systemPrompt.length)

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
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: openAIMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', openAIResponse.status, await openAIResponse.text())
      return NextResponse.json({
        response: 'Lo siento, ocurrió un error. Por favor, intenta nuevamente.'
      })
    }

    const openAIData = await openAIResponse.json()
    const assistantResponse = openAIData.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.'

    console.log('Client chat response generated successfully')

    // Store the conversation in embeddings (optional for client chats)
    // We could add this later if needed for improving the service

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