import { NextRequest, NextResponse } from 'next/server'
import { OrganizationChatService } from '@/lib/services/organizationChatService'
import { validationService } from '@/lib/services/validationService'
import { errorHandlingService } from '@/lib/services/errorHandlingService'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    // Create server-side Supabase client
    const { supabase } = createClient(req)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Authentication required')
    }
    
    // Create chat service with server-side client
    const chatService = new OrganizationChatService(supabase)
    
    // Parse and validate request
    const body = await req.json()
    const validatedRequest = validationService.validateChatRequest(body)
    validationService.validateUserMessages(validatedRequest.messages)
    validationService.validateMessageLengths(validatedRequest.messages)
    
    // Sanitize messages and process chat
    const sanitizedMessages = validationService.sanitizeMessages(validatedRequest.messages)
    const response = await chatService.processChat(
      sanitizedMessages,
      validatedRequest.locale
    )
    
    return NextResponse.json(response)
    
  } catch (error) {
    // Handle different types of errors
    let errorResponse
    
    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
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
    
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.status }
    )
  }
} 