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
  distance?: number
  created_at?: string
  updated_at?: string
}

export interface MemoryUpdate {
  id?: string
  text: string
  type: 'conversation' | 'faq' | 'knowledge' | 'example' | 'document'
  metadata?: Record<string, any>
  confidence?: number
  reason?: string
}

export interface ConflictResolution {
  action: 'merge' | 'replace' | 'keep_both' | 'reject'
  confidence: number
  reason: string
  merged_text?: string
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
    organizationId: string, 
    segments: ConversationSegment[]
  ): Promise<EmbeddingResult[]> {
    try {
      // Generate embeddings for all segments
      const embeddings = await this.generateEmbeddings(segments)

      // Prepare data for insertion
      const embeddingData = segments.map((segment, index) => ({
        organization_id: organizationId,
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
    organizationId: string,
    query: string,
    matchThreshold: number = 0.8,
    matchCount: number = 5
  ): Promise<EmbeddingResult[]> {
    try {
      // Generate embedding for the query
      const queryEmbeddings = await this.generateEmbeddings([{ text: query, type: 'conversation' }])
      const queryEmbedding = queryEmbeddings[0]

      // Search using the database function (update the function to use organization_id)
      const { data, error } = await this.supabase
        .rpc('search_similar_conversations_by_org', {
          query_embedding: queryEmbedding,
          organization_id_param: organizationId,
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
   * 🔄 UPDATE MEMORY - Core writable memory functionality
   * Updates existing memories with new information and handles conflicts
   */
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
    try {
      console.log('🔄 Updating memory:', memoryUpdate.text.substring(0, 100) + '...')

      // Step 1: Find similar existing memories
      const similarMemories = await this.searchSimilarConversations(
        organizationId,
        memoryUpdate.text,
        0.85, // Higher threshold for conflict detection
        3
      )

      console.log(`Found ${similarMemories.length} similar memories`)

      // Step 2: If updating specific memory by ID
      if (memoryUpdate.id) {
        return await this.updateSpecificMemory(organizationId, memoryUpdate)
      }

      // Step 3: Handle conflicts with similar memories
      if (similarMemories.length > 0) {
        const resolution = await this.resolveMemoryConflicts(
          memoryUpdate,
          similarMemories,
          conflictStrategy
        )

        switch (resolution.action) {
          case 'merge':
            return await this.mergeMemories(organizationId, similarMemories[0], memoryUpdate, resolution)
          case 'replace':
            return await this.replaceMemory(organizationId, similarMemories[0].id, memoryUpdate)
          case 'reject':
            return {
              success: false,
              action: 'rejected',
              memoryId: '',
              conflicts: similarMemories,
              resolution
            }
          case 'keep_both':
          default:
            // Create new memory alongside existing ones
            break
        }
      }

      // Step 4: Create new memory if no conflicts or keeping both
      const newMemory = await this.storeConversationEmbeddings(organizationId, [{
        text: memoryUpdate.text,
        type: memoryUpdate.type,
        metadata: {
          ...memoryUpdate.metadata,
          confidence: memoryUpdate.confidence || 0.95,
          source: 'memory_update',
          updated_at: new Date().toISOString()
        }
      }])

      return {
        success: true,
        action: 'created',
        memoryId: newMemory[0]?.id || '',
        conflicts: similarMemories.length > 0 ? similarMemories : undefined
      }

    } catch (error) {
      console.error('Error updating memory:', error)
      throw error
    }
  }

  /**
   * 🔍 DETECT CONFLICTS - Analyzes potential conflicts between memories
   */
  private async resolveMemoryConflicts(
    newMemory: MemoryUpdate,
    existingMemories: EmbeddingResult[],
    strategy: 'auto' | 'manual'
  ): Promise<ConflictResolution> {
    try {
      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      const conflictAnalysisPrompt = `
You are a memory conflict resolver. Analyze the following business information and determine how to handle the conflict.

NEW MEMORY: "${newMemory.text}"
EXISTING MEMORIES:
${existingMemories.map((mem, i) => `${i + 1}. "${mem.conversation_segment}"`).join('\n')}

Determine the best action:
1. "merge" - Combine information (provide merged_text)
2. "replace" - New information supersedes old
3. "keep_both" - Information is complementary
4. "reject" - New information is incorrect/duplicate

Respond with JSON only:
{
  "action": "merge|replace|keep_both|reject",
  "confidence": 0.0-1.0,
  "reason": "explanation",
  "merged_text": "combined text if merging"
}
`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: conflictAnalysisPrompt }],
        temperature: 0.1,
        max_tokens: 500
      })

      const analysis = JSON.parse(response.choices[0].message.content || '{}')
      
      return {
        action: analysis.action || 'keep_both',
        confidence: analysis.confidence || 0.5,
        reason: analysis.reason || 'Automatic conflict resolution',
        merged_text: analysis.merged_text
      }

    } catch (error) {
      console.error('Error resolving conflicts:', error)
      // Default to keeping both on error
      return {
        action: 'keep_both',
        confidence: 0.5,
        reason: 'Error in conflict analysis - defaulting to keep both'
      }
    }
  }

  /**
   * 🔗 MERGE MEMORIES - Combines conflicting memories into one
   */
  private async mergeMemories(
    organizationId: string,
    existingMemory: EmbeddingResult,
    newMemory: MemoryUpdate,
    resolution: ConflictResolution
  ): Promise<{
    success: boolean
    action: string
    memoryId: string
    resolution: ConflictResolution
  }> {
    try {
      const mergedText = resolution.merged_text || `${existingMemory.conversation_segment} ${newMemory.text}`
      
      // Update the existing memory with merged content
      const { data, error } = await this.supabase
        .from('conversation_embeddings')
        .update({
          conversation_segment: mergedText,
          metadata: {
            ...existingMemory.metadata,
            ...newMemory.metadata,
            merged_from: [existingMemory.conversation_segment, newMemory.text],
            merge_confidence: resolution.confidence,
            merge_reason: resolution.reason,
            last_merged_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingMemory.id)
        .eq('organization_id', organizationId)
        .select()

      if (error) {
        throw new Error('Failed to merge memories')
      }

      // Regenerate embedding for merged content
      const newEmbedding = await this.generateEmbeddings([{
        text: mergedText,
        type: newMemory.type
      }])

      // Update embedding
      await this.supabase
        .from('conversation_embeddings')
        .update({ embedding: newEmbedding[0] })
        .eq('id', existingMemory.id)

      console.log('✅ Successfully merged memories')

      return {
        success: true,
        action: 'merged',
        memoryId: existingMemory.id,
        resolution
      }

    } catch (error) {
      console.error('Error merging memories:', error)
      throw error
    }
  }

  /**
   * 🔄 REPLACE MEMORY - Replaces old memory with new information
   */
  private async replaceMemory(
    organizationId: string,
    memoryId: string,
    newMemory: MemoryUpdate
  ): Promise<{
    success: boolean
    action: string
    memoryId: string
  }> {
    try {
      // Generate new embedding
      const newEmbedding = await this.generateEmbeddings([{
        text: newMemory.text,
        type: newMemory.type
      }])

      // Update the memory
      const { data, error } = await this.supabase
        .from('conversation_embeddings')
        .update({
          conversation_segment: newMemory.text,
          segment_type: newMemory.type,
          embedding: newEmbedding[0],
          metadata: {
            ...newMemory.metadata,
            replaced_at: new Date().toISOString(),
            replacement_reason: newMemory.reason || 'Information updated'
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', memoryId)
        .eq('organization_id', organizationId)
        .select()

      if (error) {
        throw new Error('Failed to replace memory')
      }

      console.log('✅ Successfully replaced memory')

      return {
        success: true,
        action: 'replaced',
        memoryId
      }

    } catch (error) {
      console.error('Error replacing memory:', error)
      throw error
    }
  }

  /**
   * ✏️ UPDATE SPECIFIC MEMORY - Updates a memory by ID
   */
  private async updateSpecificMemory(
    organizationId: string,
    memoryUpdate: MemoryUpdate
  ): Promise<{
    success: boolean
    action: string
    memoryId: string
  }> {
    try {
      if (!memoryUpdate.id) {
        throw new Error('Memory ID required for specific update')
      }

      // Generate new embedding
      const newEmbedding = await this.generateEmbeddings([{
        text: memoryUpdate.text,
        type: memoryUpdate.type
      }])

      // Update the specific memory
      const { data, error } = await this.supabase
        .from('conversation_embeddings')
        .update({
          conversation_segment: memoryUpdate.text,
          segment_type: memoryUpdate.type,
          embedding: newEmbedding[0],
          metadata: {
            ...memoryUpdate.metadata,
            updated_at: new Date().toISOString(),
            update_reason: memoryUpdate.reason || 'Direct memory update'
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', memoryUpdate.id)
        .eq('organization_id', organizationId)
        .select()

      if (error || !data || data.length === 0) {
        throw new Error('Memory not found or update failed')
      }

      console.log('✅ Successfully updated specific memory')

      return {
        success: true,
        action: 'updated',
        memoryId: memoryUpdate.id
      }

    } catch (error) {
      console.error('Error updating specific memory:', error)
      throw error
    }
  }

  /**
   * 📊 GET MEMORY CONFLICTS - Find conflicting memories for review
   */
  async getMemoryConflicts(
    organizationId: string,
    similarityThreshold: number = 0.85
  ): Promise<{
    conflicts: Array<{
      group: EmbeddingResult[]
      similarity: number
      topic: string
    }>
    totalConflicts: number
  }> {
    try {
      // Get all memories for the agent
      const { data: memories, error } = await this.supabase
        .from('conversation_embeddings')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error || !memories) {
        throw new Error('Failed to fetch memories for conflict analysis')
      }

      const conflicts = []
      const processed = new Set<string>()

      // Compare each memory with others to find conflicts
      for (let i = 0; i < memories.length; i++) {
        if (processed.has(memories[i].id)) continue

        const similar = await this.searchSimilarConversations(
          organizationId,
          memories[i].conversation_segment,
          similarityThreshold,
          5
        )

        // Filter out the current memory and already processed ones
        const conflictGroup = similar.filter(s => 
          s.id !== memories[i].id && 
          !processed.has(s.id)
        )

        if (conflictGroup.length > 0) {
          // Add current memory to the group
          conflictGroup.unshift(memories[i])
          
          // Mark all as processed
          conflictGroup.forEach(mem => processed.add(mem.id))

          conflicts.push({
            group: conflictGroup,
            similarity: conflictGroup[1]?.distance ? 1 - conflictGroup[1].distance : 0,
            topic: this.extractTopic(memories[i].conversation_segment)
          })
        }
      }

      return {
        conflicts,
        totalConflicts: conflicts.length
      }

    } catch (error) {
      console.error('Error getting memory conflicts:', error)
      throw error
    }
  }

  /**
   * 🏷️ EXTRACT TOPIC - Simple topic extraction from text
   */
  private extractTopic(text: string): string {
    // Simple topic extraction - take first 3-4 meaningful words
    const words = text.split(' ').filter(word => 
      word.length > 3 && 
      !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will'].includes(word.toLowerCase())
    )
    return words.slice(0, 3).join(' ')
  }

  /**
   * 🗑️ DELETE MEMORY - Remove specific memory
   */
  async deleteMemory(organizationId: string, memoryId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('conversation_embeddings')
        .delete()
        .eq('id', memoryId)
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error deleting memory:', error)
        return false
      }

      console.log('✅ Successfully deleted memory')
      return true

    } catch (error) {
      console.error('Error in deleteMemory:', error)
      return false
    }
  }

  /**
   * Get business knowledge summary for an agent
   */
  async getBusinessKnowledgeSummary(organizationId: string) {
    try {
      const { data, error } = await this.supabase
        .rpc('get_business_knowledge_summary', {
          organization_id_param: organizationId
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
    organizationId: string,
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
      return await this.storeConversationEmbeddings(organizationId, segments)
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
   * Delete all embeddings for an organization
   */
  async deleteOrganizationEmbeddings(organizationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('conversation_embeddings')
        .delete()
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error deleting embeddings:', error)
        throw new Error('Failed to delete embeddings')
      }
    } catch (error) {
      console.error('Error in deleteOrganizationEmbeddings:', error)
      throw error
    }
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService() 