-- Validation script for conversation_embeddings table and functions
-- Run this after recreating the conversation_embeddings table

-- 1. Check that the table exists with correct structure
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'conversation_embeddings' 
ORDER BY ordinal_position;

-- 2. Check that indexes exist
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'conversation_embeddings';

-- 3. Check that functions exist
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN ('search_similar_conversations', 'get_business_knowledge_summary')
ORDER BY routine_name;

-- 4. Verify RLS policies exist
SELECT 
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'conversation_embeddings';

-- 5. Test basic table operations (if you have an organization_id to test with)
-- Uncomment and replace 'your-organization-id' with an actual UUID
/*
-- Insert a test embedding (with dummy vector data)
INSERT INTO conversation_embeddings (
  organization_id,
  conversation_segment,
  embedding,
  segment_type,
  metadata
) VALUES (
  'your-organization-id'::UUID,
  'This is a test conversation segment for validation',
  array_fill(0.1, ARRAY[1536])::vector, -- Dummy embedding vector
  'conversation',
  '{"test": true}'::jsonb
);

-- Query the test data
SELECT 
  id,
  organization_id,
  conversation_segment,
  segment_type,
  created_at
FROM conversation_embeddings 
WHERE organization_id = 'your-organization-id'::UUID;

-- Test the business knowledge summary function
SELECT * FROM get_business_knowledge_summary('your-organization-id'::UUID);

-- Clean up test data
DELETE FROM conversation_embeddings 
WHERE organization_id = 'your-organization-id'::UUID 
  AND conversation_segment = 'This is a test conversation segment for validation';
*/

-- 6. Check if pgvector extension is properly installed
SELECT 
  extname,
  extversion,
  extrelocatable
FROM pg_extension 
WHERE extname = 'vector';

-- 7. Verify that the update trigger works
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'conversation_embeddings';

PRINT '✅ Validation complete! Check the results above to ensure everything is working correctly.'; 