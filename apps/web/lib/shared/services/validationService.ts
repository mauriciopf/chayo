import { openAIService } from '@/lib/shared/services/OpenAIService'
import { ValidationResponse, ValidationResponseSchema } from '@/lib/shared/schemas/validationSchemas'

export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  agentId?: string | null
  locale?: string
}

export class ValidationService {
  /**
   * Validate chat request
   */
  validateChatRequest(data: any): ChatRequest {
    // Check if messages exist and is an array
    if (!data.messages || !Array.isArray(data.messages)) {
      throw new Error('Invalid request - messages required and must be an array')
    }

    // Validate each message
    const validatedMessages = data.messages.map((msg: any, index: number) => {
      if (!msg || typeof msg !== 'object') {
        throw new Error(`Invalid message at index ${index} - must be an object`)
      }

      if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
        throw new Error(`Invalid message role at index ${index} - must be 'user', 'assistant', or 'system'`)
      }

      if (!msg.content || typeof msg.content !== 'string') {
        throw new Error(`Invalid message content at index ${index} - must be a string`)
      }

      if (msg.content.trim().length === 0) {
        throw new Error(`Empty message content at index ${index}`)
      }

      return {
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content.trim()
      }
    })

    // Validate agentId if provided
    let agentId: string | null = null
    if (data.agentId !== undefined && data.agentId !== null) {
      if (typeof data.agentId !== 'string') {
        throw new Error('agentId must be a string or null')
      }
      if (data.agentId.trim().length === 0) {
        throw new Error('agentId cannot be an empty string')
      }
      agentId = data.agentId.trim()
    }

    // Validate locale
    let locale = 'en'
    if (data.locale !== undefined) {
      if (typeof data.locale !== 'string') {
        throw new Error('locale must be a string')
      }
      const validLocales = ['en', 'es']
      if (!validLocales.includes(data.locale)) {
        throw new Error(`locale must be one of: ${validLocales.join(', ')}`)
      }
      locale = data.locale
    }

    return {
      messages: validatedMessages,
      agentId,
      locale
    }
  }

  /**
   * Validate that there's at least one user message
   */
  validateUserMessages(messages: ChatRequest['messages']): void {
    const userMessages = messages.filter(msg => msg.role === 'user')
    if (userMessages.length === 0) {
      throw new Error('At least one user message is required')
    }
  }

  /**
   * Validate message length limits
   */
  validateMessageLengths(messages: ChatRequest['messages']): void {
    const maxMessageLength = 4000 // OpenAI limit
    const maxTotalLength = 32000 // Conservative total limit

    let totalLength = 0

    for (const msg of messages) {
      if (msg.content.length > maxMessageLength) {
        throw new Error(`Message too long (${msg.content.length} chars). Maximum allowed: ${maxMessageLength}`)
      }
      totalLength += msg.content.length
    }

    if (totalLength > maxTotalLength) {
      throw new Error(`Total message length too long (${totalLength} chars). Maximum allowed: ${maxTotalLength}`)
    }
  }

  /**
   * Sanitize messages (remove extra whitespace, etc.)
   */
  sanitizeMessages(messages: ChatRequest['messages']): ChatRequest['messages'] {
    return messages.map(msg => ({
      ...msg,
      content: msg.content.trim()
    })).filter(msg => msg.content.length > 0)
  }

   /**
   * Check if a specific question was answered in the conversation
   */
       async validateAnswerWithAI(conversation: string, question: string): Promise<{answered: boolean, answer?: string, confidence?: number}> {
     try {
       console.log('🔍 [VALIDATE] Starting validation with inputs:')
       console.log('🔍 [VALIDATE] Conversation type:', typeof conversation, 'length:', conversation?.length || 0)
       console.log('🔍 [VALIDATE] Question type:', typeof question, 'length:', question?.length || 0)
       console.log('🔍 [VALIDATE] Conversation preview:', conversation?.substring(0, 200))
       console.log('🔍 [VALIDATE] Question preview:', question?.substring(0, 200))
       
       if (!conversation || conversation.trim().length === 0) {
         console.log('❌ [VALIDATE] Empty conversation, returning false')
         return { answered: false }
       }

       const validationPrompt = `You are a precise validator. Analyze if the user's conversation answered the specific question.

Question:
"""
${question}
"""

Conversation (may include both assistant and user messages):
"""
${conversation}
"""

You must respond with a JSON object containing:
- answered: boolean (true if the question was clearly answered, false otherwise)
- answer: string or null (the extracted answer if answered, null if not answered)
- confidence: number or null (confidence level 0.0-1.0 if answered, null if not answered)

Instructions:
- Set answered to true ONLY if the conversation contains a clear, direct answer to the question
- If answered is true, extract the answer concisely and set confidence between 0.0-1.0
- If answered is false, set both answer and confidence to null`

      console.log('🔍 [VALIDATE] Validation prompt length:', validationPrompt.length)
      console.log('🔍 [VALIDATE] About to call OpenAI with schema:', ValidationResponseSchema)

      // 🎯 STRUCTURED OUTPUTS: Use ValidationResponseSchema for guaranteed JSON structure
      const result = await openAIService.callStructuredCompletion<ValidationResponse>([
        { role: 'system', content: 'You are a precise validation assistant. Analyze conversations to determine if specific questions were answered. Always follow the exact JSON schema requirements.' },
        { role: 'user', content: validationPrompt }
      ], ValidationResponseSchema, {
        model: 'gpt-4o-mini',
        temperature: 0.1,
        maxTokens: 200
      })
      
      console.log('✅ [VALIDATE] OpenAI call successful, result:', result)

      return {
        answered: result.answered,
        answer: result.answer || undefined,
        confidence: result.confidence || 0.5
      }
         } catch (error: any) {
       console.error('❌ [VALIDATE] Error validating answer with AI:', error)
       console.error('❌ [VALIDATE] Error message:', error?.message)
       console.error('❌ [VALIDATE] Error status:', error?.status)
       console.error('❌ [VALIDATE] Error code:', error?.code)
       console.error('❌ [VALIDATE] Full error object:', JSON.stringify(error, null, 2))
       return { answered: false }
     }
  }
}


// Export singleton instance
export const validationService = new ValidationService() 