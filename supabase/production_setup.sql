-- Production Database Setup for Chayo AI WhatsApp Trial System
-- This script sets up all required tables and configurations
-- Run this in your Supabase SQL Editor

-- =============================================================================
-- 1. ORGANIZATIONS TABLE (Base requirement)
-- =============================================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 1b. TEAM MEMBERS TABLE (Required for organization management)
-- =============================================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

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

-- Update organizations policy to use team_members table
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

-- =============================================================================
-- 2. AGENTS TABLE (if not exists)
-- =============================================================================
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

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own agents" ON agents;
CREATE POLICY "Users can manage their own agents" ON agents
  USING (auth.uid() = user_id);

-- =============================================================================
-- 3. USER SUBSCRIPTIONS TABLE
-- =============================================================================
-- Handle existing table or create new one
DO $$ 
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
        -- Create table if it doesn't exist
        CREATE TABLE user_subscriptions (
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
    ELSE
        -- Add missing columns to existing table
        ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'free';
        ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
        ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
        ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
        ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;
        ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        
        -- Add unique constraint on user_id if it doesn't exist
        DO $constraint$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                          WHERE table_name = 'user_subscriptions' AND constraint_name = 'user_subscriptions_user_id_key') THEN
                ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE(user_id);
            END IF;
        END $constraint$;
        
        -- Update existing records to have required values
        UPDATE user_subscriptions 
        SET plan_name = COALESCE(plan_name, 'free'), 
            status = COALESCE(status, 'active')
        WHERE plan_name IS NULL OR status IS NULL;
    END IF;
END $$;

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- 4. AGENT CHANNELS TABLE
-- =============================================================================
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

ALTER TABLE agent_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own agent channels" ON agent_channels;
CREATE POLICY "Users can view their own agent channels" ON agent_channels
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own agent channels" ON agent_channels;
CREATE POLICY "Users can insert their own agent channels" ON agent_channels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own agent channels" ON agent_channels;
CREATE POLICY "Users can update their own agent channels" ON agent_channels
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- 5. WHATSAPP TRIALS TABLE (3-Day Trial System)
-- =============================================================================
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

ALTER TABLE whatsapp_trials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own trials" ON whatsapp_trials;
CREATE POLICY "Users can view their own trials" ON whatsapp_trials
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own trials" ON whatsapp_trials;
CREATE POLICY "Users can create their own trials" ON whatsapp_trials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trials" ON whatsapp_trials;
CREATE POLICY "Users can update their own trials" ON whatsapp_trials
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- 6. INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS organizations_owner_id_idx ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);

CREATE INDEX IF NOT EXISTS team_members_organization_id_idx ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members(user_id);
CREATE INDEX IF NOT EXISTS team_members_status_idx ON team_members(status);

CREATE INDEX IF NOT EXISTS agents_user_id_idx ON agents(user_id);
CREATE INDEX IF NOT EXISTS agents_organization_id_idx ON agents(organization_id);

CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_stripe_customer_id_idx ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_organization_id_idx ON user_subscriptions(organization_id);

CREATE INDEX IF NOT EXISTS agent_channels_user_id_idx ON agent_channels(user_id);
CREATE INDEX IF NOT EXISTS agent_channels_agent_id_idx ON agent_channels(agent_id);
CREATE INDEX IF NOT EXISTS agent_channels_phone_idx ON agent_channels(phone_number, channel_type);

CREATE INDEX IF NOT EXISTS whatsapp_trials_user_id_idx ON whatsapp_trials(user_id);
CREATE INDEX IF NOT EXISTS whatsapp_trials_status_idx ON whatsapp_trials(status);
CREATE INDEX IF NOT EXISTS whatsapp_trials_trial_end_date_idx ON whatsapp_trials(trial_end_date);
CREATE INDEX IF NOT EXISTS whatsapp_trials_twilio_sid_idx ON whatsapp_trials(twilio_number_sid);

-- =============================================================================
-- 7. AUTOMATIC TIMESTAMP FUNCTIONS
-- =============================================================================
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

DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
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

-- =============================================================================
-- 8. GRANT PERMISSIONS
-- =============================================================================
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON agents TO authenticated;
GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON agent_channels TO authenticated;
GRANT ALL ON whatsapp_trials TO authenticated;

-- =============================================================================
-- 9. DATA CLEANUP AND SETUP
-- =============================================================================
-- Update existing agent_channels to have user_id if missing
UPDATE agent_channels 
SET user_id = agents.user_id, updated_at = NOW()
FROM agents 
WHERE agent_channels.agent_id = agents.id 
AND agent_channels.user_id IS NULL;

-- Create default subscriptions for existing users (safe version)
DO $$
BEGIN
    -- Insert subscriptions for users who don't have one
    INSERT INTO user_subscriptions (user_id, plan_name, status)
    SELECT id, 'free', 'active'
    FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM user_subscriptions WHERE user_id IS NOT NULL);
EXCEPTION
    WHEN unique_violation THEN
        -- Handle case where constraint exists and conflicts occur
        NULL; -- Do nothing, user already has subscription
END $$;

-- =============================================================================
-- 10. TRIAL EXPIRATION FUNCTION (For CRON)
-- =============================================================================
CREATE OR REPLACE FUNCTION expire_whatsapp_trials()
RETURNS TABLE(processed INTEGER, failed INTEGER) AS $$
DECLARE
  trial_record RECORD;
  success_count INTEGER := 0;
  failure_count INTEGER := 0;
BEGIN
  -- Update expired trials
  UPDATE whatsapp_trials 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' 
    AND trial_end_date <= NOW();

  -- Return summary
  GET DIAGNOSTICS success_count = ROW_COUNT;
  
  RETURN QUERY SELECT success_count, failure_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION expire_whatsapp_trials() TO authenticated;

-- =============================================================================
-- SETUP COMPLETE
-- =============================================================================
-- This script has set up:
-- 1. All required tables with proper structure
-- 2. Row Level Security policies
-- 3. Performance indexes
-- 4. Automatic timestamp updates
-- 5. WhatsApp trial system
-- 6. Data cleanup for existing records
-- 7. CRON function for trial expiration
--
-- Your dashboard should now load without errors!
-- Your WhatsApp trial system is ready for production use.
-- =============================================================================
