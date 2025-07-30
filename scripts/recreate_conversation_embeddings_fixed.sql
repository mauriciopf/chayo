-- Recreate conversation_embeddings table (FIXED VERSION)
-- This script recreates the conversation_embeddings table with the current expected structure
-- and properly handles existing functions

-- Enable the pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS get_business_knowledge_summary(UUID);
DROP FUNCTION IF EXISTS search_similar_conversations(VECTOR, UUID, FLOAT, INT);

-- Drop the table if it exists (for clean recreation)
DROP TABLE IF EXISTS conversation_embeddings CASCADE;

-- Create conversation_embeddings table with current structure
CREATE TABLE conversation_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_segment TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI text-embedding-ada-002 dimension
  segment_type TEXT DEFAULT 'conversation' CHECK (segment_type IN ('conversation', 'faq', 'knowledge', 'example')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_conversation_embeddings_organization_id ON conversation_embeddings(organization_id);
CREATE INDEX idx_conversation_embeddings_segment_type ON conversation_embeddings(segment_type);
CREATE INDEX idx_conversation_embeddings_created_at ON conversation_embeddings(created_at);

-- Create vector index for similarity search (using HNSW for better performance)
CREATE INDEX idx_conversation_embeddings_vector ON conversation_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_conversation_embeddings_updated_at
  BEFORE UPDATE ON conversation_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_embeddings_updated_at();

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION search_similar_conversations(
  query_embedding VECTOR(1536),
  organization_id_param UUID,
  match_threshold FLOAT DEFAULT 0.3,
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
  WHERE ce.organization_id = organization_id_param
    AND ce.embedding IS NOT NULL
    AND ce.embedding <=> query_embedding < match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function to get business knowledge summary
CREATE OR REPLACE FUNCTION get_business_knowledge_summary(organization_id_param UUID)
RETURNS TABLE (
  total_segments INT,
  conversation_count INT,
  faq_count INT,
  knowledge_count INT,
  example_count INT,
  last_updated TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INT AS total_segments,
    COUNT(*) FILTER (WHERE segment_type = 'conversation')::INT AS conversation_count,
    COUNT(*) FILTER (WHERE segment_type = 'faq')::INT AS faq_count,
    COUNT(*) FILTER (WHERE segment_type = 'knowledge')::INT AS knowledge_count,
    COUNT(*) FILTER (WHERE segment_type = 'example')::INT AS example_count,
    MAX(updated_at) AS last_updated
  FROM conversation_embeddings
  WHERE organization_id = organization_id_param;
END;
$$;

-- Enable Row Level Security
ALTER TABLE conversation_embeddings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their organization's conversation embeddings" ON conversation_embeddings;
DROP POLICY IF EXISTS "Users can insert their organization's conversation embeddings" ON conversation_embeddings;
DROP POLICY IF EXISTS "Users can update their organization's conversation embeddings" ON conversation_embeddings;
DROP POLICY IF EXISTS "Users can delete their organization's conversation embeddings" ON conversation_embeddings;

-- Create RLS policies
CREATE POLICY "Users can view their organization's conversation embeddings" ON conversation_embeddings
  FOR SELECT USING (
    organization_id IN (
      SELECT tm.organization_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Users can insert their organization's conversation embeddings" ON conversation_embeddings
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT tm.organization_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Users can update their organization's conversation embeddings" ON conversation_embeddings
  FOR UPDATE USING (
    organization_id IN (
      SELECT tm.organization_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Users can delete their organization's conversation embeddings" ON conversation_embeddings
  FOR DELETE USING (
    organization_id IN (
      SELECT tm.organization_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

-- Add table and function comments
COMMENT ON TABLE conversation_embeddings IS 'Stores embeddings of business conversations for AI knowledge retrieval';
COMMENT ON COLUMN conversation_embeddings.conversation_segment IS 'The text segment from business conversations';
COMMENT ON COLUMN conversation_embeddings.embedding IS 'Vector embedding of the conversation segment';
COMMENT ON COLUMN conversation_embeddings.segment_type IS 'Type of segment: conversation, faq, knowledge, or example';
COMMENT ON COLUMN conversation_embeddings.metadata IS 'Additional metadata about the segment (source, date, etc.)';
COMMENT ON FUNCTION search_similar_conversations IS 'Search for similar conversation segments using vector distance';
COMMENT ON FUNCTION get_business_knowledge_summary IS 'Get summary statistics of business knowledge for an organization';

-- Verify the table was created correctly
SELECT 
  'conversation_embeddings table created successfully' AS status,
  COUNT(*) AS column_count
FROM information_schema.columns 
WHERE table_name = 'conversation_embeddings';

-- Verify functions were created
SELECT 
  'Functions created successfully' AS status,
  COUNT(*) AS function_count
FROM information_schema.routines 
WHERE routine_name IN ('search_similar_conversations', 'get_business_knowledge_summary');

-- Verify indexes were created
SELECT 
  'Indexes created successfully' AS status,
  COUNT(*) AS index_count
FROM pg_indexes 
WHERE tablename = 'conversation_embeddings'; 