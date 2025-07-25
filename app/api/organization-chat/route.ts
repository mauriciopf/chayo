import { NextRequest, NextResponse } from 'next/server'
import { OrganizationChatService } from '@/lib/services/organizationChatService'
import { validationService } from '@/lib/services/validationService'
import { errorHandlingService } from '@/lib/services/errorHandlingService'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { AgentService } from '@/lib/services/agentService'
import { cookies } from 'next/headers'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    // Create server-side Supabase client
    const supabase = getSupabaseServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`)
    }
    
    if (!user) {
      throw new Error('Authentication required')
    }
    
    // Create services with server-side client
    const chatService = new OrganizationChatService(supabase)
    const agentService = new AgentService(supabase)
    
    // Parse and validate request
    const body = await req.json()
    
    const validatedRequest = validationService.validateChatRequest(body)
    
    validationService.validateUserMessages(validatedRequest.messages)
    validationService.validateMessageLengths(validatedRequest.messages)
    
    // Sanitize messages and process chat
    const sanitizedMessages = validationService.sanitizeMessages(validatedRequest.messages)
    
    // Process chat using the service's encapsulated logic
    const response = await chatService.processChat(
      sanitizedMessages,
      validatedRequest.locale
    )
    // Check/create agent chat link if threshold met, using the organization returned from processChat
    const agentChatLink = await agentService.maybeCreateAgentChatLinkIfThresholdMet(response.organization)
    
    return NextResponse.json({
      aiMessage: response.aiMessage,
      usingRAG: response.usingRAG,
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