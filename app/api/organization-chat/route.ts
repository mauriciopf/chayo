import { NextRequest, NextResponse } from 'next/server'
import { OrganizationChatService } from '@/lib/features/chat/services/organizationChatService'
import { validationService, errorHandlingService } from '@/lib/shared/services'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'
import { cookies } from 'next/headers'

// Using Node.js runtime to support fs for reading businessSystemPrompt.yaml

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 [API] Organization Chat - Request started')
    
    // Create server-side Supabase client
    const supabase = getSupabaseServerClient();
    console.log('✅ [API] Supabase client created')
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('❌ [API] Authentication error:', authError.message)
      throw new Error(`Authentication error: ${authError.message}`)
    }
    
    if (!user) {
      console.log('❌ [API] No user found - authentication required')
      throw new Error('Authentication required')
    }
    
    console.log('✅ [API] User authenticated:', user.id)
    
    // Create services with server-side client
    const chatService = new OrganizationChatService(supabase)
    console.log('✅ [API] OrganizationChatService created')
    
    // Parse and validate request
    const body = await req.json()
    console.log('📥 [API] Request body parsed:', {
      messagesCount: body.messages?.length || 0,
      locale: body.locale,
      hasMessages: !!body.messages
    })
    
    const validatedRequest = validationService.validateChatRequest(body)
    console.log('✅ [API] Request validated:', {
      messagesCount: validatedRequest.messages.length,
      locale: validatedRequest.locale
    })
    
    // Skip validation for initial messages (empty messages array)
    if (validatedRequest.messages.length > 0) {
      console.log('🔍 [API] Validating user messages and lengths')
      validationService.validateUserMessages(validatedRequest.messages)
      validationService.validateMessageLengths(validatedRequest.messages)
      console.log('✅ [API] Message validation completed')
    } else {
      console.log('⏭️ [API] Skipping validation - empty messages array (initial request)')
    }
    
    // Sanitize messages and process chat
    const sanitizedMessages = validationService.sanitizeMessages(validatedRequest.messages)
    console.log('✅ [API] Messages sanitized:', {
      originalCount: validatedRequest.messages.length,
      sanitizedCount: sanitizedMessages.length
    })
    
    // If client requests SSE, stream progress events
    const wantsSSE = req.headers.get('accept')?.includes('text/event-stream')
    console.log('🔄 [API] SSE requested:', wantsSSE)
    
    if (wantsSSE) {
      console.log('📡 [API] Setting up SSE stream')
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start: async (controller) => {
          const emit = (event: string, data?: any) => {
            const payload = `event: ${event}\n` + (data ? `data: ${JSON.stringify(data)}\n` : '') + '\n'
            controller.enqueue(encoder.encode(payload))
          }
          try {
            console.log('🎯 [API-SSE] Calling chatService.processChat')
            const response = await chatService.processChat(
              sanitizedMessages,
              validatedRequest.locale,
              emit
            )
            console.log('✅ [API-SSE] processChat completed:', {
              hasAiMessage: !!response.aiMessage,
              hasMultipleChoices: !!response.multipleChoices,
              allowMultiple: response.allowMultiple
            })
            emit('result', {
              aiMessage: response.aiMessage,
              multipleChoices: response.multipleChoices,
              allowMultiple: response.allowMultiple,
              agentChatLink: null
            })
            controller.close()
          } catch (e:any) {
            emit('error', { message: e?.message || 'Unknown error' })
            controller.close()
          }
        }
      })
      return new Response(stream as any, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no'
        }
      })
    }

    // Process chat using the service's encapsulated logic (non-streaming)
    console.log('🎯 [API] Calling chatService.processChat (non-streaming)')
    const response = await chatService.processChat(
      sanitizedMessages,
      validatedRequest.locale
    )
    console.log('✅ [API] processChat completed:', {
      hasAiMessage: !!response.aiMessage,
      hasMultipleChoices: !!response.multipleChoices,
      allowMultiple: response.allowMultiple,
      organizationId: response.organization?.id
    })
    
    // Store conversation for RAG after successful response
    console.log('💾 [API] Attempting to store conversation')
    try {
      await chatService.storeConversation(
        sanitizedMessages,
        response.aiMessage,
        {
          user,
          organization: response.organization,
          locale: validatedRequest.locale || 'en'
        }
      )
      console.log('✅ [API] Conversation stored successfully')
    } catch (error) {
      console.warn('❌ [API] Failed to store conversation:', error)
    }
    
    // Agent chat link creation is now handled by the onboarding completion status
    // No need to create agent chat links here since we're using onboarding completion
    let agentChatLink = null
    
    console.log('📤 [API] Returning response:', {
      aiMessageLength: response.aiMessage?.length || 0,
      hasMultipleChoices: !!response.multipleChoices,
      allowMultiple: response.allowMultiple,
      agentChatLink
    })
    
    return NextResponse.json({
      aiMessage: response.aiMessage,
      multipleChoices: response.multipleChoices,
      allowMultiple: response.allowMultiple,
      agentChatLink
    })
    
  } catch (error) {
    console.error('❌ Organization Chat API - Error occurred:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name,
      fullError: error,
      errorKeys: error ? Object.keys(error) : [],
      errorStringified: JSON.stringify(error, null, 2)
    })
    
    // Handle different types of errors
    let errorResponse
    
    if (error instanceof Error) {
      if (error.message.includes('Authentication required') || error.message.includes('Authentication error')) {
        errorResponse = errorHandlingService.handleAuthError(error)
      } else if (error.message.includes('Invalid request') || error.message.includes('Validation error')) {
        errorResponse = errorHandlingService.handleValidationError(error)
      } else if (error.message.includes('Database') || error.message.includes('Supabase')) {
        errorResponse = errorHandlingService.handleDatabaseError(error)
      } else {
        errorResponse = errorHandlingService.handleUnknownError(error)
      }
    } else {
      // Handle non-Error objects
      console.error('⚠️ Non-Error object caught:', error)
      errorResponse = errorHandlingService.handleUnknownError(new Error('Non-Error object thrown'))
    }
    
    // Log the error for debugging
    errorHandlingService.logError(error, 'chat API')
    
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.status }
    )
  }
} 