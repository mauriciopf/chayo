-- Disable RLS on team_members table
-- RLS was causing issues with new users not being able to fetch their organizations
-- Since we're using server-side auth checks, RLS is unnecessary complexity

-- Drop all existing RLS policies on team_members
DROP POLICY IF EXISTS "Users can view their team memberships" ON team_members;
DROP POLICY IF EXISTS "Team members can view members of their organizations" ON team_members;
DROP POLICY IF EXISTS "Users can insert team members" ON team_members;
DROP POLICY IF EXISTS "Users can update team members" ON team_members;
DROP POLICY IF EXISTS "Users can delete team members" ON team_members;

-- Disable RLS entirely on team_members
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- Disable RLS on organizations table as well
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Users can view their own organizations" ON organizations;
DROP POLICY IF EXISTS "Organization owners can update their organizations" ON organizations;

ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Note: Authentication is handled at the application level via middleware
-- All API routes verify user authentication before allowing access to data

