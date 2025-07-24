import { supabase } from '@/lib/supabase/client'
import type { EmbeddingResult } from './types'

export async function searchSimilarConversations(
  organizationId: string,
  queryEmbedding: number[],
  matchThreshold: number = 0.8,
  matchCount: number = 5
): Promise<EmbeddingResult[]> {
  // Call the correct Postgres function for org-based search
  const { data, error } = await supabase.rpc('search_similar_conversations', {
    organization_id_param: organizationId,
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount
  })
  if (error) throw new Error('Failed to search conversations')
  return data || []
} 