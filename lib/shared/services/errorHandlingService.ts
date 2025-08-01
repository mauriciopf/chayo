export interface ErrorResponse {
  error: string
  status: number
  details?: any
}

export class ErrorHandlingService {
  /**
   * Handle validation errors
   */
  handleValidationError(error: Error): ErrorResponse {
    console.warn('Validation error:', error.message)
    return {
      error: error.message,
      status: 400
    }
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: Error): ErrorResponse {
    console.warn('Authentication error:', error.message)
    return {
      error: 'Authentication required',
      status: 401
    }
  }

  /**
   * Handle OpenAI API errors
   */
  handleOpenAIError(status: number, errorData: any): ErrorResponse {
    console.error('OpenAI API error:', { status, errorData })
    
    switch (status) {
      case 429:
        return {
          error: "I apologize, but I'm currently experiencing high demand and cannot process your request right now. Please try again in a few minutes, or contact support if this issue persists.",
          status: 429,
          details: errorData
        }
      case 401:
        return {
          error: "I apologize, but there's a configuration issue with my AI service. Please contact support for assistance.",
          status: 500,
          details: errorData
        }
      default:
        return {
          error: "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment.",
          status: 500,
          details: errorData
        }
    }
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(error: any): ErrorResponse {
    console.error('Database error:', error)
    
    // Check for specific database errors
    if (error?.code === '42703') {
      return {
        error: 'Database schema error - please contact support',
        status: 500,
        details: error
      }
    }
    
    if (error?.code === '23505') {
      return {
        error: 'Duplicate entry - this resource already exists',
        status: 409,
        details: error
      }
    }

    return {
      error: 'Database operation failed',
      status: 500,
      details: error
    }
  }

  /**
   * Handle general service errors
   */
  handleServiceError(error: Error, context?: string): ErrorResponse {
    console.error(`Service error${context ? ` in ${context}` : ''}:`, error)
    
    return {
      error: 'Internal server error',
      status: 500,
      details: {
        message: error.message,
        context
      }
    }
  }

  /**
   * Handle unknown errors
   */
  handleUnknownError(error: any): ErrorResponse {
    console.error('Unknown error:', error)
    
    return {
      error: 'An unexpected error occurred',
      status: 500,
      details: error
    }
  }

  /**
   * Log error for debugging
   */
  logError(error: any, context?: string): void {
    const timestamp = new Date().toISOString()
    const errorInfo = {
      timestamp,
      context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    }
    
    console.error('Error logged:', JSON.stringify(errorInfo, null, 2))
  }

  /**
   * Create a user-friendly error message
   */
  createUserFriendlyMessage(error: any): string {
    if (typeof error === 'string') {
      return error
    }
    
    if (error?.message) {
      return error.message
    }
    
    return 'An unexpected error occurred. Please try again.'
  }
}

// Export singleton instance
export const errorHandlingService = new ErrorHandlingService() 