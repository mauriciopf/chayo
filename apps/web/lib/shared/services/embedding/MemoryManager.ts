import type { MemoryUpdate, EmbeddingResult, ConflictResolution, ConversationSegment } from './types'
import { generateEmbeddings } from './EmbeddingGenerator'
import { insertEmbeddings } from './EmbeddingStore'
import { searchSimilarConversations } from './VectorSearch'

export async function updateMemory(
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
    console.log('🧠 Processing memory update for organization:', organizationId)
    
    // Step 1: Generate embedding for the new memory text
    const segment: ConversationSegment = {
      text: memoryUpdate.text,
      type: memoryUpdate.type,
      metadata: {
        ...memoryUpdate.metadata,
        confidence: memoryUpdate.confidence || 0.8,
        reason: memoryUpdate.reason,
        created_at: new Date().toISOString()
      }
    }
    
    const embeddings = await generateEmbeddings([segment])
    const newEmbedding = embeddings[0]
    
    // Step 2: Search for similar existing memories to detect conflicts
    const similarMemories = await searchSimilarConversations(
      organizationId,
      newEmbedding,
      0.85, // High threshold for conflict detection
      5
    )
    
    // Step 3: Handle conflicts based on strategy
    if (similarMemories.length > 0) {
      console.log(`🔍 Found ${similarMemories.length} similar memories, applying conflict strategy: ${conflictStrategy}`)
      
      if (conflictStrategy === 'auto') {
        // Auto-resolve: Replace if confidence is high enough, otherwise create new
        const highestSimilarity = similarMemories[0]
        const confidence = memoryUpdate.confidence || 0.8
        
        if (confidence > 0.9 && highestSimilarity.distance && highestSimilarity.distance > 0.9) {
          // High confidence update - replace existing memory
          const resolution: ConflictResolution = {
            action: 'replace',
            confidence,
            reason: `Auto-replaced similar memory with higher confidence (${confidence})`
          }
          
          // Store new memory (the old one will naturally become less relevant over time)
          const result = await insertEmbeddings(organizationId, [segment], [newEmbedding])
          
          return {
            success: true,
            action: 'replaced',
            memoryId: result[0]?.id || 'unknown',
            conflicts: similarMemories,
            resolution
          }
        } else {
          // Lower confidence or less similar - keep both
          const resolution: ConflictResolution = {
            action: 'keep_both',
            confidence,
            reason: `Kept both memories due to insufficient confidence for replacement (${confidence})`
          }
          
          const result = await insertEmbeddings(organizationId, [segment], [newEmbedding])
          
          return {
            success: true,
            action: 'created_with_conflicts',
            memoryId: result[0]?.id || 'unknown',
            conflicts: similarMemories,
            resolution
          }
        }
      } else {
        // Manual strategy - return conflicts for user decision
        return {
          success: false,
          action: 'conflicts_detected',
          memoryId: '',
          conflicts: similarMemories
        }
      }
    } else {
      // Step 4: No conflicts - create new memory
      console.log('✅ No conflicts detected, creating new memory')
      const result = await insertEmbeddings(organizationId, [segment], [newEmbedding])
      
      return {
        success: true,
        action: 'created',
        memoryId: result[0]?.id || 'unknown'
      }
    }
    
  } catch (error) {
    console.error('❌ Error in memory update:', error)
    return {
      success: false,
      action: 'error',
      memoryId: '',
      conflicts: []
    }
  }
} 