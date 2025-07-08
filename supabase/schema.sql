-- Enable RLS (Row Level Security)
-- This file contains the database schema for Chayo AI Dashboard

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  greeting TEXT,
  tone TEXT DEFAULT 'professional',
  goals TEXT[] DEFAULT '{}',
  system_prompt TEXT,
  paused BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_subscriptions table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'inactive',
  price_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create agent_documents table for PDF uploads
CREATE TABLE IF NOT EXISTS agent_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  storage_path TEXT NOT NULL,
  processed BOOLEAN DEFAULT false,
  embedding_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create organizations table for team management
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create team_members table for organization membership
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

-- Create team_invitations table for pending invitations
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

-- Update agents table to include organization_id
ALTER TABLE agents ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Update user_subscriptions table to include organization_id
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for agents table
CREATE POLICY "Users can view their own agents" ON agents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agents" ON agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents" ON agents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents" ON agents
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for user_subscriptions table
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for agent_documents table
CREATE POLICY "Users can view their own agent documents" ON agent_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent documents" ON agent_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent documents" ON agent_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent documents" ON agent_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for organizations table
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Organization owners can update their organizations" ON organizations
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Organization owners can delete their organizations" ON organizations
  FOR DELETE USING (auth.uid() = owner_id);

-- Create policies for team_members table
CREATE POLICY "Team members can view members of their organizations" ON team_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    ) OR
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners and admins can manage team members" ON team_members
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    ) OR
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- Create policies for team_invitations table
CREATE POLICY "Organization owners and admins can manage invitations" ON team_invitations
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    ) OR
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Users can view invitations sent to their email" ON team_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS agents_user_id_idx ON agents(user_id);
CREATE INDEX IF NOT EXISTS agents_created_at_idx ON agents(created_at);
CREATE INDEX IF NOT EXISTS agents_organization_id_idx ON agents(organization_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_stripe_customer_id_idx ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_organization_id_idx ON user_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS agent_documents_agent_id_idx ON agent_documents(agent_id);
CREATE INDEX IF NOT EXISTS agent_documents_user_id_idx ON agent_documents(user_id);
CREATE INDEX IF NOT EXISTS agent_documents_created_at_idx ON agent_documents(created_at);
CREATE INDEX IF NOT EXISTS agent_documents_embedding_status_idx ON agent_documents(embedding_status);
CREATE INDEX IF NOT EXISTS organizations_owner_id_idx ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS team_members_organization_id_idx ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members(user_id);
CREATE INDEX IF NOT EXISTS team_members_status_idx ON team_members(status);
CREATE INDEX IF NOT EXISTS team_invitations_organization_id_idx ON team_invitations(organization_id);
CREATE INDEX IF NOT EXISTS team_invitations_email_idx ON team_invitations(email);
CREATE INDEX IF NOT EXISTS team_invitations_token_idx ON team_invitations(token);
CREATE INDEX IF NOT EXISTS team_invitations_expires_at_idx ON team_invitations(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_agents_updated_at 
  BEFORE UPDATE ON agents 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON user_subscriptions 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_agent_documents_updated_at 
  BEFORE UPDATE ON agent_documents 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at 
  BEFORE UPDATE ON team_members 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to generate random invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE 'plpgsql';

-- Function to create default organization for new users
CREATE OR REPLACE FUNCTION create_default_organization()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
    org_slug TEXT;
BEGIN
    -- Generate a unique slug based on user email
    org_slug := regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g') || '-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 8);
    
    -- Create organization
    INSERT INTO organizations (name, slug, owner_id)
    VALUES (split_part(NEW.email, '@', 1) || '''s Organization', org_slug, NEW.id)
    RETURNING id INTO org_id;
    
    -- Add user as owner in team_members
    INSERT INTO team_members (organization_id, user_id, role, status)
    VALUES (org_id, NEW.id, 'owner', 'active');
    
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger to automatically create organization for new users
CREATE TRIGGER create_default_organization_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE create_default_organization();
