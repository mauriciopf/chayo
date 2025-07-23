// Embedding types and interfaces

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