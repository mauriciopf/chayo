import { supabase } from '@/lib/supabase/client'
import type { ConversationSegment, EmbeddingResult } from './types'

export async function insertEmbeddings(organizationId: string, segments: ConversationSegment[], embeddings: number[][]): Promise<EmbeddingResult[]> {
  const embeddingData = segments.map((segment, index) => ({
    organization_id: organizationId,
    conversation_segment: segment.text,
    embedding: embeddings[index],
    segment_type: segment.type,
    metadata: segment.metadata || {}
  }))
  const { data, error } = await supabase
    .from('conversation_embeddings')
    .insert(embeddingData)
    .select()
  if (error) throw new Error('Failed to store embeddings')
  return data || []
}
// Add update, delete, fetch as needed 