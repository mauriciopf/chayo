-- Migration script to update existing data to new schema structure
-- This script should be run after updating the schema.sql file

-- Step 1: Add business_constraints column if it doesn't exist
ALTER TABLE agents ADD COLUMN IF NOT EXISTS business_constraints JSONB DEFAULT '{}'::jsonb;

-- Step 2: Migrate existing greeting and goals data to business_constraints
UPDATE agents 
SET business_constraints = jsonb_build_object(
  'greeting', COALESCE(greeting, ''),
  'goals', COALESCE(goals, '[]'::jsonb),
  'name', name,
  'tone', tone
)
WHERE business_constraints = '{}'::jsonb OR business_constraints IS NULL;

-- Step 3: Remove the old columns (only if they exist and migration was successful)
-- Note: We'll keep them for now to avoid breaking existing code, but they should be removed later
-- ALTER TABLE agents DROP COLUMN IF EXISTS greeting;
-- ALTER TABLE agents DROP COLUMN IF EXISTS goals;

-- Step 4: Add organization_id column if it doesn't exist
ALTER TABLE agents ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Step 5: Create conversation_embeddings table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversation_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_segment TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002 embedding dimension
  segment_type TEXT NOT NULL DEFAULT 'conversation', -- 'conversation', 'faq', 'knowledge', 'example'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 6: Enable RLS on conversation_embeddings
ALTER TABLE conversation_embeddings ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for conversation_embeddings
DROP POLICY IF EXISTS "Users can view their own conversation embeddings" ON conversation_embeddings;
CREATE POLICY "Users can view their own conversation embeddings" ON conversation_embeddings
  FOR SELECT USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own conversation embeddings" ON conversation_embeddings;
CREATE POLICY "Users can insert their own conversation embeddings" ON conversation_embeddings
  FOR INSERT WITH CHECK (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own conversation embeddings" ON conversation_embeddings;
CREATE POLICY "Users can update their own conversation embeddings" ON conversation_embeddings
  FOR UPDATE USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own conversation embeddings" ON conversation_embeddings;
CREATE POLICY "Users can delete their own conversation embeddings" ON conversation_embeddings
  FOR DELETE USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- Step 8: Create indexes for conversation_embeddings
CREATE INDEX IF NOT EXISTS conversation_embeddings_agent_id_idx ON conversation_embeddings(agent_id);
CREATE INDEX IF NOT EXISTS conversation_embeddings_segment_type_idx ON conversation_embeddings(segment_type);
CREATE INDEX IF NOT EXISTS conversation_embeddings_created_at_idx ON conversation_embeddings(created_at);
CREATE INDEX IF NOT EXISTS conversation_embeddings_vector_idx ON conversation_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Step 9: Create trigger for conversation_embeddings updated_at
CREATE TRIGGER update_conversation_embeddings_updated_at 
  BEFORE UPDATE ON conversation_embeddings 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Step 10: Create vector similarity search function
CREATE OR REPLACE FUNCTION search_similar_conversations(
  query_embedding VECTOR(1536),
  agent_id_param UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  conversation_segment TEXT,
  segment_type TEXT,
  metadata JSONB,
  similarity FLOAT
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
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM conversation_embeddings ce
  WHERE ce.agent_id = agent_id_param
    AND ce.embedding IS NOT NULL
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Step 11: Create function to get business knowledge summary
CREATE OR REPLACE FUNCTION get_business_knowledge_summary(agent_id_param UUID)
RETURNS TABLE (
  conversation_count BIGINT,
  faq_count BIGINT,
  knowledge_count BIGINT,
  example_count BIGINT,
  total_segments BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE segment_type = 'conversation') AS conversation_count,
    COUNT(*) FILTER (WHERE segment_type = 'faq') AS faq_count,
    COUNT(*) FILTER (WHERE segment_type = 'knowledge') AS knowledge_count,
    COUNT(*) FILTER (WHERE segment_type = 'example') AS example_count,
    COUNT(*) AS total_segments
  FROM conversation_embeddings
  WHERE agent_id = agent_id_param;
END;
$$;

-- Step 12: Grant permissions
GRANT ALL ON conversation_embeddings TO authenticated;

-- Step 13: Add comments
COMMENT ON TABLE conversation_embeddings IS 'Stores embeddings of business conversations for AI knowledge retrieval';
COMMENT ON FUNCTION search_similar_conversations IS 'Search for similar conversation segments using vector similarity';
COMMENT ON FUNCTION get_business_knowledge_summary IS 'Get summary statistics of business knowledge for an agent';

-- Step 14: Verify migration
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as total_agents,
  COUNT(*) FILTER (WHERE business_constraints != '{}'::jsonb) as migrated_agents
FROM agents; 