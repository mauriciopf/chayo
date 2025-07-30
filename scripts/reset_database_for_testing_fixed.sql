-- Complete Database Reset Script for Testing Onboarding Flow (FIXED VERSION)
-- WARNING: This will delete ALL user data from the database
-- Only run this in development/testing environments
-- This version only deletes from tables that actually exist

-- Start transaction to ensure all operations succeed or fail together
BEGIN;

-- Delete conversation embeddings (depends on conversations)
DELETE FROM conversation_embeddings WHERE true;


-- Delete business info fields (onboarding questions/answers)
DELETE FROM business_info_fields WHERE true;

-- Delete setup completion tracking
DELETE FROM setup_completion WHERE true;

-- Delete agent channels (if table exists)
DELETE FROM agent_channels WHERE true;

-- Delete agents (if table exists)
DELETE FROM agents WHERE true;

-- Delete team members
DELETE FROM team_members WHERE true;

-- Delete user subscriptions
DELETE FROM user_subscriptions WHERE true;

-- Delete organizations (this will cascade to related data)
DELETE FROM organizations WHERE true;

-- Optionally delete auth users (uncomment if you want to test complete user registration)
-- WARNING: This will require users to re-register
-- DELETE FROM auth.users;

-- Commit the transaction
COMMIT;

-- Verify cleanup (only check tables that should exist)
SELECT 
  'organizations' as table_name, COUNT(*) as record_count FROM organizations
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
  'conversation_embeddings' as table_name, COUNT(*) as record_count FROM conversation_embeddings
UNION ALL
SELECT 
  'user_subscriptions' as table_name, COUNT(*) as record_count FROM user_subscriptions;

-- Check if agents table exists and show count
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents') 
    THEN (SELECT COUNT(*)::text FROM agents)
    ELSE 'table does not exist'
  END as agents_count;

-- Check if agent_channels table exists and show count  
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_channels') 
    THEN (SELECT COUNT(*)::text FROM agent_channels)
    ELSE 'table does not exist'
  END as agent_channels_count;


-- Show remaining auth users (if any)
SELECT 
  'auth_users' as table_name, COUNT(*) as record_count 
FROM auth.users; 