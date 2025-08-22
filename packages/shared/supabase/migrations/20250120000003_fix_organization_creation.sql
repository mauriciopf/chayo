-- Migration: Fix organization creation by using server-side function
-- This migration creates a function that can create organizations and team members without RLS issues

-- Create a function to create organization with team member in one transaction
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  org_name TEXT,
  org_slug TEXT,
  owner_id UUID
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
  new_mobile_code VARCHAR(6);
BEGIN
  -- Generate unique mobile app code
  new_mobile_code := generate_unique_mobile_app_code();
  
  -- Create the organization
  INSERT INTO organizations (name, slug, owner_id, mobile_app_code)
  VALUES (org_name, org_slug, owner_id, new_mobile_code)
  RETURNING id INTO new_org_id;
  
  -- Add the user as an active owner in team_members
  INSERT INTO team_members (organization_id, user_id, role, status)
  VALUES (new_org_id, owner_id, 'owner', 'active');
  
  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_organization_with_owner(TEXT, TEXT, UUID) TO authenticated; 