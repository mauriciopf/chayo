-- Update distance threshold for better RAG retrieval
-- Increase default threshold from 0.3 to 0.8 for more permissive matching

CREATE OR REPLACE FUNCTION search_similar_conversations(
  query_embedding VECTOR(1536),
  agent_id_param UUID,
  match_threshold FLOAT DEFAULT 0.8,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  conversation_segment TEXT,
  segment_type TEXT,
  metadata JSONB,
  distance FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id,
    ce.conversation_segment,
    ce.segment_type,
    ce.metadata,
    ce.embedding <=> query_embedding AS distance
  FROM conversation_embeddings ce
  WHERE ce.agent_id = agent_id_param
    AND ce.embedding IS NOT NULL
    AND ce.embedding <=> query_embedding < match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
