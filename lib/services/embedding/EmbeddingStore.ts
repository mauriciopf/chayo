import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { ConversationSegment, EmbeddingResult } from './types'

export async function insertEmbeddings(organizationId: string, segments: ConversationSegment[], embeddings: number[][]): Promise<EmbeddingResult[]> {
  const supabase = getSupabaseServerClient()
  
  const embeddingData = segments.map((segment, index) => ({
    organization_id: organizationId,
    conversation_segment: segment.text,
    embedding: embeddings[index],
    segment_type: segment.type,
    metadata: segment.metadata || {}
  }))
  
  console.log('🔧 Storing embeddings for organization:', organizationId, 'count:', embeddingData.length)
  
  const { data, error } = await supabase
    .from('conversation_embeddings')
    .insert(embeddingData)
    .select()
    
  if (error) {
    console.error('❌ Failed to store embeddings:', error)
    throw new Error(`Failed to store embeddings: ${error.message}`)
  }
  
  console.log('✅ Successfully stored embeddings:', data?.length || 0)
  return data || []
}
// Add update, delete, fetch as needed 