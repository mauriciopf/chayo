import { NextRequest, NextResponse } from 'next/server'
import { OrganizationChatService } from '@/lib/services/organizationChatService'
import { validationService } from '@/lib/services/validationService'
import { errorHandlingService } from '@/lib/services/errorHandlingService'
import { supabase } from '@/lib/supabase/server'
import { maybeCreateAgentChatLinkIfThresholdMet } from '@/lib/services/agentService'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  console.log('🚀 Organization Chat API - Request started')
  
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Authentication error:', authError)
      throw new Error(`Authentication error: ${authError.message}`)
    }
    
    if (!user) {
      console.error('❌ No user found')
      throw new Error('Authentication required')
    }
    
    console.log('✅ User authenticated:', { userId: user.id, email: user.email })
    
    // Create chat service with server-side client
    const chatService = new OrganizationChatService(supabase)
    console.log('✅ Chat service created')
    
    // Parse and validate request
    const body = await req.json()
    console.log('📥 Request body:', {
      messageCount: body.messages?.length || 0,
      locale: body.locale,
      lastMessage: body.messages?.[body.messages.length - 1]?.content?.substring(0, 100) + '...'
    })
    
    const validatedRequest = validationService.validateChatRequest(body)
    console.log('✅ Request validation passed')
    
    validationService.validateUserMessages(validatedRequest.messages)
    validationService.validateMessageLengths(validatedRequest.messages)
    console.log('✅ Message validation passed')
    
    // Sanitize messages and process chat
    const sanitizedMessages = validationService.sanitizeMessages(validatedRequest.messages)
    console.log('✅ Messages sanitized, processing chat...')
    
    // Process chat using the service's encapsulated logic
    const response = await chatService.processChat(
      sanitizedMessages,
      validatedRequest.locale
    )
    // Check/create agent chat link if threshold met, using the organization returned from processChat
    const agentChatLink = await maybeCreateAgentChatLinkIfThresholdMet(supabase, response.organization)
    
    return NextResponse.json({
      aiMessage: response.aiMessage,
      usingRAG: response.usingRAG,
      agentChatLink
    })
    
  } catch (error) {
    console.error('❌ Organization Chat API - Error occurred:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name
    })
    
    // Handle different types of errors
    let errorResponse
    
    if (error instanceof Error) {
      if (error.message.includes('Authentication required') || error.message.includes('Authentication error')) {
        errorResponse = errorHandlingService.handleAuthError(error)
      } else if (error.message.includes('Invalid request') || error.message.includes('must be')) {
        errorResponse = errorHandlingService.handleValidationError(error)
      } else if (error.message.includes('Failed to get or create')) {
        errorResponse = errorHandlingService.handleServiceError(error, 'agent/organization creation')
      } else {
        errorResponse = errorHandlingService.handleServiceError(error, 'chat processing')
      }
    } else {
      errorResponse = errorHandlingService.handleUnknownError(error)
    }
    
    // Log the error for debugging
    errorHandlingService.logError(error, 'chat API')
    
    console.log('❌ Returning error response:', {
      error: errorResponse.error,
      status: errorResponse.status
    })
    
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.status }
    )
  }
} 