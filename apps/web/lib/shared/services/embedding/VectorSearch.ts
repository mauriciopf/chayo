import { getSupabaseServerClient } from '@/lib/shared/supabase/server'
import type { EmbeddingResult } from './types'

export async function searchSimilarConversations(
  organizationId: string,
  queryEmbedding: number[],
  matchThreshold: number = 0.8,
  matchCount: number = 5
): Promise<EmbeddingResult[]> {
  const supabase = getSupabaseServerClient()
  
  console.log('🔍 Searching conversations for organization:', organizationId)
  
  // Call the correct Postgres function for org-based search
  const { data, error } = await supabase.rpc('search_similar_conversations', {
    organization_id_param: organizationId,
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount
  })
  
  if (error) {
    console.error('❌ Failed to search conversations:', error)
    throw new Error(`Failed to search conversations: ${error.message}`)
  }
  
  console.log('✅ Found conversations:', data?.length || 0)
  return data || []
} 