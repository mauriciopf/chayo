import { createClient } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'
// OpenAI client will be initialized when needed
// This avoids issues with server-side vs client-side execution

export interface ConversationSegment {
  text: string
  type: 'conversation' | 'faq' | 'knowledge' | 'example' | 'document'
  metadata?: Record<string, any>
}

export interface EmbeddingResult {
  id: string
  conversation_segment: string
  embedding: number[]
  segment_type: string
  metadata: Record<string, any>
  similarity?: number
}

export class EmbeddingService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  /**
   * Generate embeddings for conversation segments using OpenAI
   */
  async generateEmbeddings(segments: ConversationSegment[]): Promise<number[][]> {
    try {
      const texts = segments.map(segment => segment.text)
      
      // Initialize OpenAI client
      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts,
      })

      return response.data.map((item: any) => item.embedding)
    } catch (error: any) {
      console.error('Error generating embeddings:', error)
      
      // Handle specific OpenAI errors
      if (error?.status === 429) {
        throw new Error('OpenAI quota exceeded - embeddings temporarily unavailable')
      } else if (error?.status === 401) {
        throw new Error('OpenAI API key invalid')
      } else {
        throw new Error('Failed to generate embeddings')
      }
    }
  }

  /**
   * Store conversation embeddings in Supabase
   */
  async storeConversationEmbeddings(
    agentId: string, 
    segments: ConversationSegment[]
  ): Promise<EmbeddingResult[]> {
    try {
      // Generate embeddings for all segments
      const embeddings = await this.generateEmbeddings(segments)

      // Prepare data for insertion
      const embeddingData = segments.map((segment, index) => ({
        agent_id: agentId,
        conversation_segment: segment.text,
        embedding: embeddings[index],
        segment_type: segment.type,
        metadata: segment.metadata || {}
      }))

      // Insert into conversation_embeddings table
      const { data, error } = await this.supabase
        .from('conversation_embeddings')
        .insert(embeddingData)
        .select()

      if (error) {
        console.error('Error storing embeddings:', error)
        throw new Error('Failed to store embeddings')
      }

      return data || []
    } catch (error) {
      console.error('Error in storeConversationEmbeddings:', error)
      throw error
    }
  }

  /**
   * Search for similar conversation segments
   */
  async searchSimilarConversations(
    agentId: string,
    query: string,
    matchThreshold: number = 0.7,
    matchCount: number = 5
  ): Promise<EmbeddingResult[]> {
    try {
      // Generate embedding for the query
      const queryEmbeddings = await this.generateEmbeddings([{ text: query, type: 'conversation' }])
      const queryEmbedding = queryEmbeddings[0]

      // Search using the database function
      const { data, error } = await this.supabase
        .rpc('search_similar_conversations', {
          query_embedding: queryEmbedding,
          agent_id_param: agentId,
          match_threshold: matchThreshold,
          match_count: matchCount
        })

      if (error) {
        console.error('Error searching conversations:', error)
        throw new Error('Failed to search conversations')
      }

      return data || []
    } catch (error) {
      console.error('Error in searchSimilarConversations:', error)
      throw error
    }
  }

  /**
   * Get business knowledge summary for an agent
   */
  async getBusinessKnowledgeSummary(agentId: string) {
    try {
      const { data, error } = await this.supabase
        .rpc('get_business_knowledge_summary', {
          agent_id_param: agentId
        })

      if (error) {
        console.error('Error getting knowledge summary:', error)
        throw new Error('Failed to get knowledge summary')
      }

      return data?.[0] || null
    } catch (error) {
      console.error('Error in getBusinessKnowledgeSummary:', error)
      throw error
    }
  }

  /**
   * Process and store business conversations from various formats
   */
  async processBusinessConversations(
    agentId: string,
    conversations: any[],
    format: 'json' | 'csv' | 'text' = 'json'
  ): Promise<EmbeddingResult[]> {
    try {
      let segments: ConversationSegment[] = []

      switch (format) {
        case 'json':
          segments = this.parseJsonConversations(conversations)
          break
        case 'csv':
          segments = this.parseCsvConversations(conversations)
          break
        case 'text':
          segments = this.parseTextConversations(conversations)
          break
        default:
          throw new Error('Unsupported format')
      }

      // Store the processed segments
      return await this.storeConversationEmbeddings(agentId, segments)
    } catch (error) {
      console.error('Error processing conversations:', error)
      throw error
    }
  }

  /**
   * Parse JSON conversation format
   */
  private parseJsonConversations(conversations: any[]): ConversationSegment[] {
    const segments: ConversationSegment[] = []

    for (const conversation of conversations) {
      // Handle different JSON structures
      if (conversation.messages) {
        // Format: { messages: [{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }] }
        conversation.messages.forEach((msg: any) => {
          segments.push({
            text: msg.content,
            type: 'conversation',
            metadata: {
              role: msg.role,
              timestamp: msg.timestamp,
              source: 'json_import'
            }
          })
        })
      } else if (conversation.text) {
        // Format: { text: '...', type: '...' }
        segments.push({
          text: conversation.text,
          type: conversation.type || 'conversation',
          metadata: conversation.metadata || { source: 'json_import' }
        })
      } else if (typeof conversation === 'string') {
        // Format: simple string
        segments.push({
          text: conversation,
          type: 'conversation',
          metadata: { source: 'json_import' }
        })
      }
    }

    return segments
  }

  /**
   * Parse CSV conversation format
   */
  private parseCsvConversations(csvData: any[]): ConversationSegment[] {
    const segments: ConversationSegment[] = []

    for (const row of csvData) {
      // Assume CSV has columns: text, type, metadata
      if (row.text) {
        segments.push({
          text: row.text,
          type: (row.type as any) || 'conversation',
          metadata: {
            ...row.metadata,
            source: 'csv_import'
          }
        })
      }
    }

    return segments
  }

  /**
   * Parse text conversation format
   */
  private parseTextConversations(textData: string[]): ConversationSegment[] {
    return textData.map(text => ({
      text,
      type: 'conversation',
      metadata: { source: 'text_import' }
    }))
  }

  /**
   * Delete all embeddings for an agent
   */
  async deleteAgentEmbeddings(agentId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('conversation_embeddings')
        .delete()
        .eq('agent_id', agentId)

      if (error) {
        console.error('Error deleting embeddings:', error)
        throw new Error('Failed to delete embeddings')
      }
    } catch (error) {
      console.error('Error in deleteAgentEmbeddings:', error)
      throw error
    }
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService() 