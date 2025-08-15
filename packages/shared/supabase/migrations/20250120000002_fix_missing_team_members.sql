-- Migration: Fix missing team_members records for organization owners
-- This migration ensures that all organization owners are properly added to the team_members table

-- Add missing team_members records for organization owners who don't have them
INSERT INTO team_members (organization_id, user_id, role, status, joined_at)
SELECT 
    o.id as organization_id,
    o.owner_id as user_id,
    'owner' as role,
    'active' as status,
    o.created_at as joined_at
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.organization_id = o.id 
    AND tm.user_id = o.owner_id 
    AND tm.status = 'active'
);

-- Update the create_default_organization function to include team_members creation
CREATE OR REPLACE FUNCTION create_default_organization()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create the organization
  INSERT INTO public.organizations (name, slug, owner_id)
  VALUES (
    'My Organization',
    'org-' || REPLACE(NEW.id::text, '-', ''),
    NEW.id
  )
  RETURNING id INTO new_org_id;
  
  -- Add the user as an active owner in team_members
  INSERT INTO public.team_members (organization_id, user_id, role, status)
  VALUES (new_org_id, NEW.id, 'owner', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 