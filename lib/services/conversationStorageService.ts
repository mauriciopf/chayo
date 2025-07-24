import { createClient } from '@/lib/supabase/server'
import { embeddingService } from '@/lib/services/embeddingService'

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
}

export interface ConversationSegment {
  messages: ConversationMessage[]
  metadata?: Record<string, any>
}

export class ConversationStorageService {
  /**
   * Store a conversation exchange (user message + assistant response)
   */
  async storeConversationExchange(
    organizationId: string,
    userMessage: string,
    assistantResponse: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const conversation: ConversationSegment = {
        messages: [
          { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
          { role: 'assistant', content: assistantResponse, timestamp: new Date().toISOString() }
        ],
        metadata: {
          source: 'chat_exchange',
          ...metadata
        }
      }

      // Convert to format expected by embedding service
      const conversations = [JSON.stringify(conversation)]
      
      await embeddingService.processBusinessConversations(
        organizationId,
        conversations,
        'json'
      )

      console.log('Conversation exchange stored for organization:', organizationId)
    } catch (error) {
      console.error('Failed to store conversation exchange:', error)
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Store a single message (for one-way messages like WhatsApp)
   */
  async storeSingleMessage(
    organizationId: string,
    message: string,
    role: 'user' | 'assistant',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const conversation: ConversationSegment = {
        messages: [
          { role, content: message, timestamp: new Date().toISOString() }
        ],
        metadata: {
          source: 'single_message',
          ...metadata
        }
      }

      const conversations = [JSON.stringify(conversation)]
      
      await embeddingService.processBusinessConversations(
        organizationId,
        conversations,
        'json'
      )

      console.log('Single message stored for organization:', organizationId)
    } catch (error) {
      console.error('Failed to store single message:', error)
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Store a batch of conversation messages
   */
  async storeConversationBatch(
    organizationId: string,
    messages: ConversationMessage[],
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      if (messages.length === 0) return

      const conversation: ConversationSegment = {
        messages,
        metadata: {
          source: 'conversation_batch',
          ...metadata
        }
      }

      const conversations = [JSON.stringify(conversation)]
      
      await embeddingService.processBusinessConversations(
        organizationId,
        conversations,
        'json'
      )

      console.log('Conversation batch stored for organization:', organizationId)
    } catch (error) {
      console.error('Failed to store conversation batch:', error)
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Get recent conversations for an organization
   */
  async getRecentConversations(
    organizationId: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      const summary = await embeddingService.getBusinessKnowledgeSummary(organizationId)
      return summary ? [summary] : []
    } catch (error) {
      console.error('Failed to get recent conversations:', error)
      return []
    }
  }

  /**
   * Search for similar conversations
   */
  async searchSimilarConversations(
    organizationId: string,
    query: string,
    limit: number = 5
  ): Promise<any[]> {
    try {
      const { generateEmbeddings } = await import('@/lib/services/embedding/EmbeddingGenerator')
      const queryEmbedding = (await generateEmbeddings([{ text: query, type: 'conversation', metadata: {} }]))[0]
      
      return await embeddingService.searchSimilarConversations(
        organizationId,
        queryEmbedding,
        0.7,
        limit
      )
    } catch (error) {
      console.error('Failed to search conversations:', error)
      return []
    }
  }
}

// Export singleton instance
export const conversationStorageService = new ConversationStorageService() 