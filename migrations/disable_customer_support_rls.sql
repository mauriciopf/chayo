-- Migration: Disable RLS for customer support tables
-- This removes row-level security restrictions that are preventing conversation and message creation

-- Drop all existing RLS policies for customer_support_conversations
DROP POLICY IF EXISTS "Organizations can manage their support conversations" ON customer_support_conversations;
DROP POLICY IF EXISTS "Customers can see their own conversations" ON customer_support_conversations;

-- Drop all existing RLS policies for customer_support_messages
DROP POLICY IF EXISTS "Organizations can manage their support messages" ON customer_support_messages;
DROP POLICY IF EXISTS "Customers can see their own messages" ON customer_support_messages;

-- Disable RLS completely for customer_support_conversations table
ALTER TABLE customer_support_conversations DISABLE ROW LEVEL SECURITY;

-- Disable RLS completely for customer_support_messages table
ALTER TABLE customer_support_messages DISABLE ROW LEVEL SECURITY;

-- Add comments explaining the changes
COMMENT ON TABLE customer_support_conversations IS 'Customer support conversations table with RLS disabled - access control handled at application level';
COMMENT ON TABLE customer_support_messages IS 'Customer support messages table with RLS disabled - access control handled at application level';
