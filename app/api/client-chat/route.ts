import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from "@/lib/shared/supabase/server"
import { ClientSystemPromptService } from '@/lib/features/chat/services/clientPrompt/ClientSystemPromptService'
import { embeddingService } from '@/lib/shared/services'
import { ToolIntentService } from '@/lib/features/tools/shared/services'

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
    // Call OpenAI using centralized service
    console.log('🚀 Calling OpenAI API...')
    let rawResponse: string
    try {
      const { openAIService } = await import('@/lib/shared/services/OpenAIService')
      rawResponse = await openAIService.callChatCompletion(openAIMessages, {
        model: 'gpt-4o-mini',
        maxTokens: 500,
        temperature: 0.7,
      }) || 'Lo siento, no pude generar una respuesta.'
    } catch (error) {
      console.error('❌ OpenAI API error:', error)
      return NextResponse.json({
        response: 'Lo siento, ocurrió un error. Por favor, intenta nuevamente.'
      })
    }

    // Parse intents from AI response using ToolIntentService
    const { content: assistantResponse, intents } = ToolIntentService.parseIntentsFromResponse(rawResponse)

    // Get enabled tools to validate intents
    const { data: enabledToolsData } = await supabase
      .from('agent_tools')
      .select('tool_type')
      .eq('organization_id', organizationId)
      .eq('enabled', true)

    const enabledTools = enabledToolsData?.map((tool: any) => tool.tool_type) || []
    const validatedIntents = ToolIntentService.validateIntents(intents, enabledTools)

    console.log('✅ Client chat response generated successfully:', {
      responseLength: assistantResponse.length,
      responsePreview: assistantResponse.substring(0, 100) + (assistantResponse.length > 100 ? '...' : ''),
      detectedIntents: intents,
      validatedIntents: validatedIntents
    })

    // Store the conversation exchange for future reference
    try {
      const { embeddingService } = await import('@/lib/shared/services/embeddingService')
      const conversationText = `User: ${message}\nAssistant: ${assistantResponse}`
      
      await embeddingService.processBusinessConversations(
        organizationId,
        [conversationText]
      )
      console.log('✅ Stored client conversation for embeddings')
    } catch (error) {
      console.warn('Failed to store conversation embeddings:', error)
    }

    // Record client insights for business intelligence
    try {
      const { simpleClientInsightsService } = await import('@/lib/features/insights/services/SimpleClientInsightsService')
      await simpleClientInsightsService.recordConversation(
        organizationId,
        message,
        'client'
      )
    } catch (error) {
      console.warn('Failed to record client insights:', error)
      // Don't fail the main flow if insights recording fails
    }

    return NextResponse.json({
      response: assistantResponse,
      intents: validatedIntents
    })

  } catch (error) {
    console.error('Client chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 