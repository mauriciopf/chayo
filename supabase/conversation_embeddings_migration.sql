-- Conversation Embeddings Migration
-- This migration adds support for storing and searching business conversation embeddings

-- Enable the pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create conversation_embeddings table
CREATE TABLE IF NOT EXISTS conversation_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  conversation_segment TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI text-embedding-ada-002 dimension
  segment_type TEXT DEFAULT 'conversation' CHECK (segment_type IN ('conversation', 'faq', 'knowledge', 'example')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_agent_id ON conversation_embeddings(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_segment_type ON conversation_embeddings(segment_type);
CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_created_at ON conversation_embeddings(created_at);

-- Create vector index for similarity search (using HNSW for better performance)
CREATE INDEX IF NOT EXISTS idx_conversation_embeddings_vector ON conversation_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Update agents table to simplify and focus on business constraints
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS business_constraints JSONB DEFAULT '{}';

-- Add business constraints validation
ALTER TABLE agents 
ADD CONSTRAINT agents_business_name_required 
CHECK (name IS NOT NULL AND length(trim(name)) > 0);

ALTER TABLE agents 
ADD CONSTRAINT agents_tone_required 
CHECK (tone IS NOT NULL AND length(trim(tone)) > 0);

-- Create function to update updated_at timestamp for conversation_embeddings
CREATE OR REPLACE FUNCTION update_conversation_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conversation_embeddings updated_at
CREATE TRIGGER update_conversation_embeddings_updated_at
  BEFORE UPDATE ON conversation_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_embeddings_updated_at();

-- Enable Row Level Security
ALTER TABLE conversation_embeddings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversation_embeddings
CREATE POLICY "Users can view their own conversation embeddings" ON conversation_embeddings
  FOR SELECT USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own conversation embeddings" ON conversation_embeddings
  FOR INSERT WITH CHECK (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own conversation embeddings" ON conversation_embeddings
  FOR UPDATE USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own conversation embeddings" ON conversation_embeddings
  FOR DELETE USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON conversation_embeddings TO authenticated;

-- Create function for similarity search
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
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id,
    ce.conversation_segment,
    ce.segment_type,
    1 - (ce.embedding <=> query_embedding) AS similarity,
    ce.metadata
  FROM conversation_embeddings ce
  WHERE ce.agent_id = agent_id_param
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function to get business knowledge summary
CREATE OR REPLACE FUNCTION get_business_knowledge_summary(agent_id_param UUID)
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
  WHERE agent_id = agent_id_param;
END;
$$;

-- Add comments for documentation
COMMENT ON TABLE conversation_embeddings IS 'Stores embeddings of business conversations for AI knowledge retrieval';
COMMENT ON COLUMN conversation_embeddings.conversation_segment IS 'The text segment from business conversations';
COMMENT ON COLUMN conversation_embeddings.embedding IS 'Vector embedding of the conversation segment';
COMMENT ON COLUMN conversation_embeddings.segment_type IS 'Type of segment: conversation, faq, knowledge, or example';
COMMENT ON COLUMN conversation_embeddings.metadata IS 'Additional metadata about the segment (source, date, etc.)';

COMMENT ON FUNCTION search_similar_conversations IS 'Search for similar conversation segments using vector similarity';
COMMENT ON FUNCTION get_business_knowledge_summary IS 'Get summary statistics of business knowledge for an agent'; 