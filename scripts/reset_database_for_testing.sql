-- Complete Database Reset Script for Testing Onboarding Flow
-- WARNING: This will delete ALL user data from the database
-- Only run this in development/testing environments

-- Start transaction to ensure all operations succeed or fail together
BEGIN;

-- Delete conversation embeddings (depends on conversations)
DELETE FROM conversation_embeddings;


-- Delete business info fields (onboarding questions/answers)
DELETE FROM business_info_fields;

-- Delete setup completion tracking
DELETE FROM setup_completion;

-- Delete agent channels
DELETE FROM agent_channels;

-- Delete agents
DELETE FROM agents;

-- Delete team members
DELETE FROM team_members;

-- Delete user subscriptions
DELETE FROM user_subscriptions;

-- Delete organizations (this will cascade to related data)
DELETE FROM organizations;

-- Reset any auto-increment sequences if needed
-- Note: Supabase uses UUIDs by default, so this might not be necessary
-- but including for completeness

-- Optionally delete auth users (uncomment if you want to test complete user registration)
-- WARNING: This will require users to re-register
-- DELETE FROM auth.users;

-- Reset any sequences (if your database uses them)
-- ALTER SEQUENCE IF EXISTS organizations_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS agents_id_seq RESTART WITH 1;

-- Commit the transaction
COMMIT;

-- Verify cleanup
SELECT 
  'organizations' as table_name, COUNT(*) as record_count FROM organizations
UNION ALL
SELECT 
  'agents' as table_name, COUNT(*) as record_count FROM agents
UNION ALL
SELECT 
  'agent_channels' as table_name, COUNT(*) as record_count FROM agent_channels
UNION ALL
SELECT 
  'team_members' as table_name, COUNT(*) as record_count FROM team_members
UNION ALL
SELECT 
  'business_info_fields' as table_name, COUNT(*) as record_count FROM business_info_fields
UNION ALL
SELECT 
  'setup_completion' as table_name, COUNT(*) as record_count FROM setup_completion
UNION ALL
SELECT 
  'conversations' as table_name, COUNT(*) as record_count FROM conversations
UNION ALL
SELECT 
  'conversation_embeddings' as table_name, COUNT(*) as record_count FROM conversation_embeddings
UNION ALL
SELECT 
  'user_subscriptions' as table_name, COUNT(*) as record_count FROM user_subscriptions;

-- Show remaining auth users (if any)
SELECT 
  'auth_users' as table_name, COUNT(*) as record_count 
FROM auth.users; 