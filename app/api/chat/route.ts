import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/lib/services/chatService'
import { validationService } from '@/lib/services/validationService'
import { errorHandlingService } from '@/lib/services/errorHandlingService'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json()
    
    // Validate request
    const validatedRequest = validationService.validateChatRequest(body)
    validationService.validateUserMessages(validatedRequest.messages)
    validationService.validateMessageLengths(validatedRequest.messages)
    
    // Sanitize messages
    const sanitizedMessages = validationService.sanitizeMessages(validatedRequest.messages)
    
    // Process chat request
    const response = await chatService.processChat(
      sanitizedMessages,
      validatedRequest.agentId,
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