-- Clear Database for Testing
-- This script safely empties all tables while preserving schema structure
-- Run this to test the complete flow from scratch

-- Disable triggers temporarily to avoid conflicts during cleanup
SET session_replication_role = replica;

-- Clear tables in order of dependencies (child tables first, then parent tables)

-- 1. Clear conversation_embeddings (no dependencies)
TRUNCATE TABLE conversation_embeddings RESTART IDENTITY CASCADE;

-- 2. Clear business_documents (depends on organizations, users)
TRUNCATE TABLE business_documents RESTART IDENTITY CASCADE;

-- 3. Clear team_invitations (depends on organizations, users)
TRUNCATE TABLE team_invitations RESTART IDENTITY CASCADE;

-- 4. Clear team_members (depends on organizations, users)
TRUNCATE TABLE team_members RESTART IDENTITY CASCADE;

-- 5. Clear agents (depends on organizations, users)
TRUNCATE TABLE agents RESTART IDENTITY CASCADE;

-- 6. Clear user_subscriptions (depends on organizations, users)
TRUNCATE TABLE user_subscriptions RESTART IDENTITY CASCADE;

-- 7. Clear business_info_fields (depends on organizations)
TRUNCATE TABLE business_info_fields RESTART IDENTITY CASCADE;

-- 8. Clear organizations (depends on users)
TRUNCATE TABLE organizations RESTART IDENTITY CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verify all tables are empty
SELECT 
    'conversation_embeddings' as table_name, COUNT(*) as row_count FROM conversation_embeddings
UNION ALL
SELECT 'business_documents', COUNT(*) FROM business_documents
UNION ALL
SELECT 'team_invitations', COUNT(*) FROM team_invitations
UNION ALL
SELECT 'team_members', COUNT(*) FROM team_members
UNION ALL
SELECT 'agents', COUNT(*) FROM agents
UNION ALL
SELECT 'user_subscriptions', COUNT(*) FROM user_subscriptions
UNION ALL
SELECT 'business_info_fields', COUNT(*) FROM business_info_fields
UNION ALL
SELECT 'organizations', COUNT(*) FROM organizations
ORDER BY table_name;

-- Success message
SELECT 'Database cleared successfully! All tables are now empty and ready for testing.' as status; 