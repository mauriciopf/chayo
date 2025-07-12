-- Complete setup script for Chayo AI with user data
-- This will create tables AND populate them with your user data
-- Run this in your Supabase SQL Editor

-- Step 1: Create all required tables
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_name TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  greeting TEXT NOT NULL,
  tone TEXT,
  goals TEXT[],
  system_prompt TEXT,
  paused BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  phone_number TEXT,
  country_code TEXT,
  business_name TEXT,
  business_description TEXT,
  twilio_messaging_service_sid TEXT,
  twilio_phone_number_sid TEXT,
  webhook_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  connected BOOLEAN DEFAULT FALSE,
  credentials JSONB,
  number_flow TEXT DEFAULT 'existing',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, channel_type)
);

CREATE TABLE IF NOT EXISTS whatsapp_trials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  twilio_number_sid TEXT NOT NULL UNIQUE,
  trial_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_end_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '3 days'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'released')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_trials ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can manage their own organizations" ON organizations;
CREATE POLICY "Users can manage their own organizations" ON organizations
  FOR ALL USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can view team members of their organizations" ON team_members;
CREATE POLICY "Users can view team members of their organizations" ON team_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Organization owners can manage team members" ON team_members;
CREATE POLICY "Organization owners can manage team members" ON team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE id = team_members.organization_id 
      AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can manage their own subscriptions" ON user_subscriptions
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own agents" ON agents;
CREATE POLICY "Users can manage their own agents" ON agents
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own channels" ON agent_channels;
CREATE POLICY "Users can manage their own channels" ON agent_channels
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own trials" ON whatsapp_trials;
CREATE POLICY "Users can view their own trials" ON whatsapp_trials
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own trials" ON whatsapp_trials;
CREATE POLICY "Users can manage their own trials" ON whatsapp_trials
  FOR ALL USING (auth.uid() = user_id);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS organizations_owner_id_idx ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS team_members_organization_id_idx ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members(user_id);
CREATE INDEX IF NOT EXISTS team_members_status_idx ON team_members(status);
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS agents_user_id_idx ON agents(user_id);
CREATE INDEX IF NOT EXISTS agents_organization_id_idx ON agents(organization_id);
CREATE INDEX IF NOT EXISTS agent_channels_user_id_idx ON agent_channels(user_id);
CREATE INDEX IF NOT EXISTS agent_channels_agent_id_idx ON agent_channels(agent_id);
CREATE INDEX IF NOT EXISTS whatsapp_trials_user_id_idx ON whatsapp_trials(user_id);
CREATE INDEX IF NOT EXISTS whatsapp_trials_status_idx ON whatsapp_trials(status);

-- Step 5: Grant permissions
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON team_members TO authenticated;
GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON agents TO authenticated;
GRANT ALL ON agent_channels TO authenticated;
GRANT ALL ON whatsapp_trials TO authenticated;

-- Step 6: Create organization and team membership for existing users
-- This will create an organization for each user and make them the owner
DO $$
DECLARE
    user_record RECORD;
    org_id UUID;
    user_email TEXT;
    existing_org_id UUID;
BEGIN
    -- Loop through all users and create organizations
    FOR user_record IN SELECT id, email FROM auth.users LOOP
        -- Get user email
        user_email := user_record.email;
        
        -- Check if user already has an organization
        SELECT id INTO existing_org_id 
        FROM organizations 
        WHERE owner_id = user_record.id 
        LIMIT 1;
        
        IF existing_org_id IS NOT NULL THEN
            -- User already has organization, use it
            org_id := existing_org_id;
            RAISE NOTICE 'User % already has organization: %', user_email, org_id;
        ELSE
            -- Create organization name from email (before @ symbol)
            IF user_email IS NOT NULL THEN
                -- Insert organization
                INSERT INTO organizations (name, slug, owner_id)
                VALUES (
                    CASE 
                        WHEN user_email LIKE '%@%' THEN split_part(user_email, '@', 1) || '''s Organization'
                        ELSE 'My Organization'
                    END,
                    CASE 
                        WHEN user_email LIKE '%@%' THEN lower(replace(split_part(user_email, '@', 1), '.', '-'))
                        ELSE 'my-org-' || substr(user_record.id::text, 1, 8)
                    END,
                    user_record.id
                )
                ON CONFLICT (slug) DO UPDATE SET slug = organizations.slug || '-' || substr(gen_random_uuid()::text, 1, 8)
                RETURNING id INTO org_id;
                
                RAISE NOTICE 'Created new organization for user: %', user_email;
            END IF;
        END IF;
        
        -- Create team membership (only if org_id exists)
        IF org_id IS NOT NULL THEN
            INSERT INTO team_members (organization_id, user_id, role, status)
            VALUES (org_id, user_record.id, 'owner', 'active')
            ON CONFLICT (organization_id, user_id) DO NOTHING;
            
            -- Create user subscription
            INSERT INTO user_subscriptions (user_id, organization_id, plan_name, status)
            VALUES (user_record.id, org_id, 'free', 'active')
            ON CONFLICT (user_id) DO UPDATE SET organization_id = org_id;
            
            -- Update any existing agents to belong to this organization
            UPDATE agents 
            SET organization_id = org_id 
            WHERE user_id = user_record.id AND organization_id IS NULL;
            
            RAISE NOTICE 'Updated membership and subscription for user: %', user_email;
        END IF;
        
        -- Reset for next iteration
        org_id := NULL;
        existing_org_id := NULL;
    END LOOP;
END $$;

-- Step 7: Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_channels_updated_at ON agent_channels;
CREATE TRIGGER update_agent_channels_updated_at
  BEFORE UPDATE ON agent_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_trials_updated_at ON whatsapp_trials;
CREATE TRIGGER update_whatsapp_trials_updated_at
  BEFORE UPDATE ON whatsapp_trials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- DONE! This script should:
-- 1. Create all required tables
-- 2. Set up proper RLS policies
-- 3. Create organizations for all existing users
-- 4. Create team memberships (making users owners of their orgs)
-- 5. Create default free subscriptions
-- 6. Link existing agents to their user's organization
-- 7. Set up performance indexes and triggers
