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
      if (!conversation || conversation.trim().length === 0) {
        return { answered: false }
      }

  

      const validationPrompt = `You are a precise validator. Determine if the user's conversation answered the question. Extract the answer succinctly.

Question:
"""
${question}
"""

Conversation (may include both assistant and user messages):
"""
${conversation}
"""

Analyze the conversation and determine:
1. Whether the question was clearly answered
2. What the extracted answer is (if answered)
3. Your confidence level in this assessment`

      // 🎯 STRUCTURED OUTPUTS: Use ValidationResponseSchema for guaranteed JSON structure
      const result = await openAIService.callStructuredCompletion<ValidationResponse>([
        { role: 'system', content: 'You validate question answering with high precision. Focus on accuracy and provide clear confidence assessments.' },
        { role: 'user', content: validationPrompt }
      ], ValidationResponseSchema, {
        model: 'gpt-4o-mini',
        temperature: 0.1,
        maxTokens: 200
      })

      return {
        answered: result.answered,
        answer: result.answer,
        confidence: result.confidence || 0.5
      }
    } catch (error) {
      console.error('Error validating answer with AI:', error)
      return { answered: false }
    }
  }
}


// Export singleton instance
export const validationService = new ValidationService() 