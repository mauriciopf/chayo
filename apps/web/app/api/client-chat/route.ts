import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from "@/lib/shared/supabase/server"
import { ClientSystemPromptService } from '@/lib/features/chat/services/clientPrompt/ClientSystemPromptService'
import { ToolIntentService } from '@/lib/features/tools/shared/services/toolIntentService'
import { OpenAIService } from '@/lib/shared/services/OpenAIService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, organizationId, messages = [] } = body
    
    // Force Spanish locale for all client conversations
    let locale = 'es'
    if (body.locale && body.locale !== 'es') {
      console.warn(`🌍 Unsupported locale "${body.locale}" provided, falling back to Spanish`)
    }

    if (!message || !organizationId) {
      return NextResponse.json(
        { error: 'Se requiere mensaje e ID de organización' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient();
    
    // Verify organization exists
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      console.error('Organization not found:', orgError)
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      )
    }

    // Get enabled tools for function calling
    const enabledTools = await ToolIntentService.getEnabledTools(organizationId, supabase)
    console.log(`🔧 Enabled tools: ${enabledTools.join(', ')}`)

    // Get client-facing system prompt (RAG-based) with locale support
    console.log(`🌍 Building system prompt with locale: ${locale}`)
    const systemPrompt = await ClientSystemPromptService.buildClientSystemPrompt(organizationId, message, locale, supabase)

    // Prepare messages for OpenAI
    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: (msg.role === 'ai' ? 'assistant' : msg.role) as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ]

    let assistantResponse: string
    const functionCalls: any[] = []

    // Check if we have enabled tools for function calling
    if (enabledTools.length > 0) {
      console.log('🚀 Processing message with function calling...')
      
      // Get function definitions
      const functions = ToolIntentService.getFunctionDefinitions(enabledTools)
      
      // Convert to tool format
      const tools = functions.map(func => ({
        type: 'function' as const,
        function: func
      }))

      // Call OpenAI with tools
      const openAIService = OpenAIService.getInstance()
      const response = await openAIService.callResponsesWithTools(chatMessages, tools, {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1000
      })

      // Process function calls if any
      if (response.tool_calls && response.tool_calls.length > 0) {
        console.log(`🔧 AI called ${response.tool_calls.length} functions`)
        
        // Execute each function call
        for (const toolCall of response.tool_calls) {
          const result = await ToolIntentService.handleFunctionCall(
            toolCall.name,
            toolCall.arguments,
            organizationId,
            supabase
          )
          
          functionCalls.push({
            name: toolCall.name,
            arguments: toolCall.arguments,
            success: result.success
          })
        }

        // Add function results to conversation and get final response
        const followUpMessages = [
          ...chatMessages,
          { 
            role: 'assistant' as const, 
            content: response.content || 'Déjame verificar esa información...' 
          },
          ...response.tool_calls.map((tc: any) => {
            const funcResult = functionCalls.find(fc => fc.name === tc.name)
            return {
              role: 'function' as const,
              name: tc.name,
              content: JSON.stringify(funcResult)
            }
          })
        ]

        const finalResponse = await openAIService.callCompletion(followUpMessages, {
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 1000
        })

        assistantResponse = finalResponse
      } else {
        // No function calls, use the response as-is
        assistantResponse = response.content
      }
    } else {
      // No tools enabled, use regular completion
      console.log('💬 Processing message without function calling')
      const openAIService = OpenAIService.getInstance()
      assistantResponse = await openAIService.callCompletion(chatMessages, {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1000
      })
    }

    console.log('✅ Client chat response generated successfully:', {
      responseLength: assistantResponse.length,
      responsePreview: assistantResponse.substring(0, 100) + (assistantResponse.length > 100 ? '...' : ''),
      functionCallsExecuted: functionCalls.length,
      functionsUsed: functionCalls.map(fc => fc.name)
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
      functionCalls: functionCalls.map(fc => ({
        name: fc.name,
        arguments: fc.arguments,
        success: fc.success
      }))
    })

  } catch (error) {
    console.error('Client chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
