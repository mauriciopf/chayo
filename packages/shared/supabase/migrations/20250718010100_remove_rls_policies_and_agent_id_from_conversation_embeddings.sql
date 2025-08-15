-- Migration: Remove RLS policies referencing agent_id and drop agent_id column from conversation_embeddings

-- Drop policies (replace policy names with actual names if needed)
DROP POLICY IF EXISTS "Users can view their own conversation embeddings" ON conversation_embeddings;
DROP POLICY IF EXISTS "Users can insert their own conversation embeddings" ON conversation_embeddings;
DROP POLICY IF EXISTS "Users can update their own conversation embeddings" ON conversation_embeddings;
DROP POLICY IF EXISTS "Users can delete their own conversation embeddings" ON conversation_embeddings;

-- Now drop the agent_id column
ALTER TABLE conversation_embeddings DROP COLUMN IF EXISTS agent_id; 