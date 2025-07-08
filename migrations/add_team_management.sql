-- Migration script to add team management to existing Chayo database
-- Run this in your Supabase SQL editor or via psql

-- 1. Create new tables for team management
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'pending', 'suspended'
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, email)
);

-- 2. Add organization_id to existing tables
ALTER TABLE agents ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 3. Enable Row Level Security for new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for organizations
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    -- Users can only see organizations they own
    owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Organization owners can update their organizations" ON organizations;
CREATE POLICY "Organization owners can update their organizations" ON organizations
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Organization owners can delete their organizations" ON organizations;
CREATE POLICY "Organization owners can delete their organizations" ON organizations
  FOR DELETE USING (auth.uid() = owner_id);

-- 5. Create RLS policies for team_members
DROP POLICY IF EXISTS "Team members can view members of their organizations" ON team_members;
CREATE POLICY "Team members can view members of their organizations" ON team_members
  FOR SELECT USING (
    -- Users can see members of organizations they own
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    ) OR
    -- Users can see their own membership record
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Organization owners and admins can manage team members" ON team_members;
CREATE POLICY "Organization owners and admins can manage team members" ON team_members
  FOR ALL USING (
    -- Only organization owners can manage team members
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- 6. Create RLS policies for team_invitations
DROP POLICY IF EXISTS "Organization owners and admins can manage invitations" ON team_invitations;
CREATE POLICY "Organization owners and admins can manage invitations" ON team_invitations
  FOR ALL USING (
    -- Only organization owners can manage invitations
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON team_invitations;
CREATE POLICY "Users can view invitations sent to their email" ON team_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS organizations_owner_id_idx ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS team_members_organization_id_idx ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members(user_id);
CREATE INDEX IF NOT EXISTS team_members_status_idx ON team_members(status);
CREATE INDEX IF NOT EXISTS team_invitations_organization_id_idx ON team_invitations(organization_id);
CREATE INDEX IF NOT EXISTS team_invitations_email_idx ON team_invitations(email);
CREATE INDEX IF NOT EXISTS team_invitations_token_idx ON team_invitations(token);
CREATE INDEX IF NOT EXISTS team_invitations_expires_at_idx ON team_invitations(expires_at);
CREATE INDEX IF NOT EXISTS agents_organization_id_idx ON agents(organization_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_organization_id_idx ON user_subscriptions(organization_id);

-- 8. Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at 
  BEFORE UPDATE ON team_members 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 9. Create function to generate invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE 'plpgsql';

-- 10. Create function and trigger to auto-create organization for existing users
CREATE OR REPLACE FUNCTION create_default_organization_for_user(user_id UUID, user_email TEXT)
RETURNS UUID AS $$
DECLARE
    org_id UUID;
    org_slug TEXT;
    org_name TEXT;
BEGIN
    -- Generate a unique slug based on user email
    org_slug := regexp_replace(split_part(user_email, '@', 1), '[^a-zA-Z0-9]', '', 'g') || '-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 8);
    org_name := split_part(user_email, '@', 1) || '''s Organization';
    
    -- Create organization
    INSERT INTO organizations (name, slug, owner_id)
    VALUES (org_name, org_slug, user_id)
    RETURNING id INTO org_id;
    
    -- Add user as owner in team_members
    INSERT INTO team_members (organization_id, user_id, role, status)
    VALUES (org_id, user_id, 'owner', 'active');
    
    RETURN org_id;
END;
$$ LANGUAGE 'plpgsql';

-- 11. Create default organizations for existing users
DO $$
DECLARE
    user_record RECORD;
    org_id UUID;
BEGIN
    FOR user_record IN 
        SELECT id, email FROM auth.users 
        WHERE id NOT IN (SELECT DISTINCT user_id FROM team_members WHERE role = 'owner')
    LOOP
        -- Only create if user doesn't have any organization membership
        IF NOT EXISTS (SELECT 1 FROM team_members WHERE user_id = user_record.id) THEN
            SELECT create_default_organization_for_user(user_record.id, user_record.email) INTO org_id;
            
            -- Update existing agents to belong to this organization
            UPDATE agents 
            SET organization_id = org_id 
            WHERE user_id = user_record.id AND organization_id IS NULL;
            
            -- Update existing subscriptions to belong to this organization
            UPDATE user_subscriptions 
            SET organization_id = org_id 
            WHERE user_id = user_record.id AND organization_id IS NULL;
        END IF;
    END LOOP;
END $$;

-- 12. Create trigger for new user registration
CREATE OR REPLACE FUNCTION create_default_organization()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT create_default_organization_for_user(NEW.id, NEW.email) INTO org_id;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_default_organization_trigger ON auth.users;

-- Create trigger to automatically create organization for new users
CREATE TRIGGER create_default_organization_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE create_default_organization();

-- 13. Update agents RLS policies to include organization access
DROP POLICY IF EXISTS "Users can view their own agents" ON agents;
CREATE POLICY "Users can view their own agents" ON agents
  FOR SELECT USING (
    auth.uid() = user_id OR
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own agents" ON agents;
CREATE POLICY "Users can insert their own agents" ON agents
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (organization_id IS NULL OR organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can update their own agents" ON agents;
CREATE POLICY "Users can update their own agents" ON agents
  FOR UPDATE USING (
    auth.uid() = user_id OR
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own agents" ON agents;
CREATE POLICY "Users can delete their own agents" ON agents
  FOR DELETE USING (
    auth.uid() = user_id OR
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Success message
SELECT 'Team management migration completed successfully!' as message;
