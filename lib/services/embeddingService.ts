import type { ConversationSegment, EmbeddingResult, MemoryUpdate, ConflictResolution } from './embedding/types'
import { generateEmbeddings } from './embedding/EmbeddingGenerator'
import { insertEmbeddings } from './embedding/EmbeddingStore'
import { searchSimilarConversations } from './embedding/VectorSearch'
import { updateMemory as memoryManagerUpdateMemory } from './embedding/MemoryManager'
// OpenAI client will be initialized when needed
// This avoids issues with server-side vs client-side execution

export class EmbeddingService {
  async storeConversationEmbeddings(
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
    format: string = 'json',
    supabaseClient?: any
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
    organizationId: string,
    supabaseClient?: any
  ): Promise<string> {
    // Fetch recent conversation segments for the organization
    const supabase = supabaseClient || (globalThis as any).supabase
    if (!supabase) return ''
    const { data, error } = await supabase
      .from('conversation_embeddings')
      .select('conversation_segment')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(10)
    if (error || !data) return ''
    return data.map((row: any) => row.conversation_segment).join('\n')
  }

  /**
   * Delete all embeddings for an organization
   */
  async deleteOrganizationEmbeddings(
    organizationId: string,
    supabaseClient?: any
  ): Promise<void> {
    const supabase = supabaseClient || (globalThis as any).supabase
    if (!supabase) return
    await supabase
      .from('conversation_embeddings')
      .delete()
      .eq('organization_id', organizationId)
  }

  /**
   * Delete a specific memory (embedding) by ID
   */
  async deleteMemory(
    organizationId: string,
    memoryId: string,
    supabaseClient?: any
  ): Promise<boolean> {
    const supabase = supabaseClient || (globalThis as any).supabase
    if (!supabase) return false
    const { error } = await supabase
      .from('conversation_embeddings')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', memoryId)
    return !error
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService() 