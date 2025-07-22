import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ClientSystemPromptService } from '@/lib/services/clientSystemPromptService'
import { embeddingService } from '@/lib/services/embeddingService'

export async function POST(request: NextRequest) {
  try {
    const { message, agentId, messages = [] } = await request.json()

    if (!message || !agentId) {
      return NextResponse.json(
        { error: 'Message and agentId are required' },
        { status: 400 }
      )
    }

    console.log('Client Chat API - Request:', { agentId, message: message.substring(0, 50) + '...' })

    // Create server-side Supabase client
    const { supabase } = createClient(request)

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      console.error('Agent not found:', agentError)
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Get client-facing system prompt
    const clientSystemPromptService = new ClientSystemPromptService(supabase)
    const systemPrompt = await clientSystemPromptService.generateClientSystemPrompt(agentId)

    // --- RAG: Retrieve relevant business embeddings ---
    let ragMessages: Array<{role: string, content: string}> = []
    try {
      // Use the embeddingService to search for relevant conversation embeddings
      if (embeddingService && agent.organization_id) {
        const relevantEmbeddings = await embeddingService.searchSimilarConversations(
          agent.id,
          message,
          0.7, // similarity threshold
          5    // fetch more to allow deduplication
        )
        // Deduplicate by normalized segment text
        const seen = new Set<string>()
        const uniqueEmbeddings = []
        for (const emb of relevantEmbeddings) {
          const norm = emb.conversation_segment.trim().toLowerCase()
          if (!seen.has(norm)) {
            seen.add(norm)
            uniqueEmbeddings.push(emb)
          }
          if (uniqueEmbeddings.length >= 3) break // Only keep top 3 unique
        }
        if (uniqueEmbeddings.length > 0) {
          ragMessages = uniqueEmbeddings.map((emb: any) => ({
            role: 'system',
            content: `Relevant business info: ${emb.conversation_segment}`
          }))
        }
      }
    } catch (err) {
      console.warn('RAG/embedding retrieval failed:', err)
    }
    // --- END RAG ---

    console.log('Client system prompt generated, length:', systemPrompt.length)

    // Prepare messages for OpenAI
    const openAIMessages = [
      { role: 'system', content: systemPrompt },
      ...ragMessages,
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