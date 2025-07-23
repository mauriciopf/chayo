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
}

// Export singleton instance
export const embeddingService = new EmbeddingService() 