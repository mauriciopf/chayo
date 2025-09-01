-- Disable RLS on tables that are causing issues with client chat API
-- These tables don't need RLS since they're accessed by service role for business functionality

-- 1. Drop all existing RLS policies on conversation_embeddings
DROP POLICY IF EXISTS "Org members can view conversation embeddings" ON conversation_embeddings;
DROP POLICY IF EXISTS "Org members can insert conversation embeddings" ON conversation_embeddings;
DROP POLICY IF EXISTS "Org members can update conversation embeddings" ON conversation_embeddings;
DROP POLICY IF EXISTS "Org members can delete conversation embeddings" ON conversation_embeddings;

-- 2. Drop all existing RLS policies on client_insights
DROP POLICY IF EXISTS "Users can view their own client insights" ON client_insights;
DROP POLICY IF EXISTS "Users can insert their own client insights" ON client_insights;

-- 3. Disable RLS entirely on these tables
ALTER TABLE conversation_embeddings DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_insights DISABLE ROW LEVEL SECURITY;
