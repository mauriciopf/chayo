-- Diagnostic script to check database state
-- Run this in Supabase SQL Editor to see what data exists

-- 1. Check if tables exist
SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('organizations', 'team_members', 'user_subscriptions', 'agents', 'agent_channels', 'whatsapp_trials')
ORDER BY table_name;

-- 2. Check auth.users
SELECT 
  id, 
  email, 
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 3. Check organizations table
SELECT 
  id,
  name,
  slug,
  owner_id,
  created_at
FROM organizations
ORDER BY created_at DESC;

-- 4. Check team_members table
SELECT 
  id,
  organization_id,
  user_id,
  role,
  status,
  joined_at
FROM team_members
ORDER BY joined_at DESC;

-- 5. Check user_subscriptions table
SELECT 
  id,
  user_id,
  organization_id,
  plan_name,
  status,
  created_at
FROM user_subscriptions
ORDER BY created_at DESC;

-- 6. Check agents table
SELECT 
  id,
  user_id,
  organization_id,
  name,
  greeting,
  created_at
FROM agents
ORDER BY created_at DESC;

-- 7. Check if RLS is enabled on tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'team_members', 'user_subscriptions', 'agents');

-- 8. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
