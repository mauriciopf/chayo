-- Quick Database Setup for Dashboard Loading
-- Run this in your Supabase SQL Editor to fix the dashboard loading issues

-- 1. Create user_subscriptions table if it doesn't exist
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. Add missing columns to existing user_subscriptions table
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS plan_name TEXT NOT NULL DEFAULT 'free';
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create agent_channels table if it doesn't exist  
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_channels ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for user_subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Create RLS policies for agent_channels
DROP POLICY IF EXISTS "Users can view their own agent channels" ON agent_channels;
CREATE POLICY "Users can view their own agent channels" ON agent_channels
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own agent channels" ON agent_channels;
CREATE POLICY "Users can insert their own agent channels" ON agent_channels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own agent channels" ON agent_channels;
CREATE POLICY "Users can update their own agent channels" ON agent_channels
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS agent_channels_user_id_idx ON agent_channels(user_id);
CREATE INDEX IF NOT EXISTS agent_channels_agent_id_idx ON agent_channels(agent_id);

-- 7. Grant permissions
GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON agent_channels TO authenticated;

-- 8. Update existing agent_channels records to have user_id (if any exist)
UPDATE agent_channels 
SET user_id = agents.user_id, updated_at = NOW()
FROM agents 
WHERE agent_channels.agent_id = agents.id 
AND agent_channels.user_id IS NULL;

-- 9. Create default subscription for existing users (optional)
INSERT INTO user_subscriptions (user_id, plan_name, status)
SELECT id, 'free', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO UPDATE SET 
  plan_name = EXCLUDED.plan_name,
  status = EXCLUDED.status;
