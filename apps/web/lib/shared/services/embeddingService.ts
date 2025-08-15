import type { ConversationSegment, EmbeddingResult, MemoryUpdate, ConflictResolution } from './embedding/types'
import { generateEmbeddings } from './embedding/EmbeddingGenerator'
import { insertEmbeddings } from './embedding/EmbeddingStore'
import { searchSimilarConversations } from './embedding/VectorSearch'
import { updateMemory as memoryManagerUpdateMemory } from './embedding/MemoryManager'
import { supabase } from '@/lib/shared/supabase/client'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export class EmbeddingService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }

  private async getSupabaseClient() {
    // Check if we're in a server-side context (API route)
    if (typeof window === 'undefined') {
      try {
        return getSupabaseServerClient()
      } catch (error) {
        console.warn('Failed to load server client, falling back to provided client')
        return this.supabaseClient
      }
    }
    return this.supabaseClient
  }

  private async storeConversationEmbeddings(
    organizationId: string,
    segments: ConversationSegment[]
  ): Promise<EmbeddingResult[]> {
    const embeddings = await generateEmbeddings(segments)
    return insertEmbeddings(organizationId, segments, embeddings)
  }

  async searchSimilarConversations(
    organizationId: string,
    queryEmbedding: number[],
    matchThreshold: number = 0.8,
    matchCount: number = 5
  ): Promise<EmbeddingResult[]> {
    return searchSimilarConversations(organizationId, queryEmbedding, matchThreshold, matchCount)
  }

  async updateMemory(
    organizationId: string,
    memoryUpdate: MemoryUpdate,
    conflictStrategy: 'auto' | 'manual' = 'auto'
  ): Promise<{
    success: boolean
    action: string
    memoryId: string
    conflicts?: EmbeddingResult[]
    resolution?: ConflictResolution
  }> {
    return memoryManagerUpdateMemory(organizationId, memoryUpdate, conflictStrategy)
  }

  /**
   * Process and store business conversations with embeddings
   */
  async processBusinessConversations(
    organizationId: string,
    conversations: string[],
    format: string = 'json'
  ): Promise<EmbeddingResult[]> {
    // Prepare segments
    const segments: ConversationSegment[] = conversations.map((content) => ({
      text: content,
      type: 'conversation',
      metadata: {}
    }))
    // Store embeddings
    return this.storeConversationEmbeddings(organizationId, segments)
  }

  /**
   * Get a summary of business knowledge from conversation embeddings
   */
  async getBusinessKnowledgeSummary(
    organizationId: string
  ): Promise<string> {
    try {
      const supabase = await this.getSupabaseClient()
      console.log('📚 Getting business knowledge summary for organization:', organizationId)
      
      // Fetch recent conversation segments for the organization
      const { data, error } = await supabase
        .from('conversation_embeddings')
        .select('conversation_segment')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10)
        
      if (error) {
        console.error('❌ Failed to get business knowledge:', error)
        return ''
      }
      
      const summary = data ? data.map((row: any) => row.conversation_segment).join('\n') : ''
      console.log('✅ Retrieved business knowledge:', summary.length > 0 ? `${summary.length} characters` : 'no data')
      return summary
    } catch (error) {
      console.error('❌ Error getting business knowledge summary:', error)
      return ''
    }
  }

  /**
   * Delete all embeddings for an organization
   */
  async deleteOrganizationEmbeddings(
    organizationId: string
  ): Promise<void> {
    const supabase = await this.getSupabaseClient()
    console.log('🗑️ Deleting embeddings for organization:', organizationId)
    
    const { error } = await supabase
      .from('conversation_embeddings')
      .delete()
      .eq('organization_id', organizationId)
      
    if (error) {
      console.error('❌ Failed to delete embeddings:', error)
      throw new Error(`Failed to delete embeddings: ${error.message}`)
    }
    
    console.log('✅ Successfully deleted embeddings for organization:', organizationId)
  }

  /**
   * Delete a specific memory (embedding) by ID
   */
  async deleteMemory(
    organizationId: string,
    memoryId: string
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabaseClient()
      console.log('🗑️ Deleting memory:', memoryId, 'for organization:', organizationId)
      
      const { error } = await supabase
        .from('conversation_embeddings')
        .delete()
        .eq('organization_id', organizationId)
        .eq('id', memoryId)
        
      if (error) {
        console.error('❌ Failed to delete memory:', error)
        return false
      }
      
      console.log('✅ Successfully deleted memory:', memoryId)
      return true
    } catch (error) {
      console.error('❌ Error deleting memory:', error)
      return false
    }
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService() 