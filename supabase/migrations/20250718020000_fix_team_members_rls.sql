-- Migration: Fix infinite recursion in team_members RLS policies
-- Create a SECURITY DEFINER function to get organization IDs for a user

CREATE OR REPLACE FUNCTION get_user_organization_ids(uid UUID)
RETURNS UUID[] AS $$
  SELECT ARRAY(
    SELECT organization_id FROM team_members
    WHERE user_id = uid AND status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Update team_members RLS policy to use the helper function
DROP POLICY IF EXISTS "Team members can view members of their organizations" ON team_members;
CREATE POLICY "Team members can view members of their organizations" ON team_members
  FOR SELECT USING (
    organization_id = ANY(get_user_organization_ids(auth.uid()))
    OR
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Update business_info_fields RLS policies to use the helper function
DROP POLICY IF EXISTS "Users can view their own business info fields" ON business_info_fields;
CREATE POLICY "Users can view their own business info fields" ON business_info_fields
  FOR SELECT USING (
    agent_id IN (
      SELECT id FROM agents 
      WHERE organization_id = ANY(get_user_organization_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can insert their own business info fields" ON business_info_fields;
CREATE POLICY "Users can insert their own business info fields" ON business_info_fields
  FOR INSERT WITH CHECK (
    agent_id IN (
      SELECT id FROM agents 
      WHERE organization_id = ANY(get_user_organization_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can update their own business info fields" ON business_info_fields;
CREATE POLICY "Users can update their own business info fields" ON business_info_fields
  FOR UPDATE USING (
    agent_id IN (
      SELECT id FROM agents 
      WHERE organization_id = ANY(get_user_organization_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can delete their own business info fields" ON business_info_fields;
CREATE POLICY "Users can delete their own business info fields" ON business_info_fields
  FOR DELETE USING (
    agent_id IN (
      SELECT id FROM agents 
      WHERE organization_id = ANY(get_user_organization_ids(auth.uid()))
    )
  ); 