-- Alternative Quick Fix - Handle Existing Tables
-- Run this if you got the plan_name column error

-- Step 1: Check and fix user_subscriptions table structure
DO $$ 
BEGIN
    -- Add plan_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_subscriptions' AND column_name = 'plan_name') THEN
        ALTER TABLE user_subscriptions ADD COLUMN plan_name TEXT NOT NULL DEFAULT 'free';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_subscriptions' AND column_name = 'status') THEN
        ALTER TABLE user_subscriptions ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
    END IF;
END $$;

-- Step 2: Create agent_channels table if it doesn't exist
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

-- Step 3: Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_channels ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 5: Agent channels policies
DROP POLICY IF EXISTS "Users can view their own agent channels" ON agent_channels;
CREATE POLICY "Users can view their own agent channels" ON agent_channels
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own agent channels" ON agent_channels;
CREATE POLICY "Users can insert their own agent channels" ON agent_channels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own agent channels" ON agent_channels;
CREATE POLICY "Users can update their own agent channels" ON agent_channels
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS agent_channels_user_id_idx ON agent_channels(user_id);
CREATE INDEX IF NOT EXISTS agent_channels_agent_id_idx ON agent_channels(agent_id);

-- Step 7: Grant permissions
GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON agent_channels TO authenticated;

-- Step 8: Update existing user_subscriptions to have plan_name and status
UPDATE user_subscriptions 
SET plan_name = 'free', status = 'active'
WHERE plan_name IS NULL OR status IS NULL;

-- Step 9: Create default subscriptions for users without one
INSERT INTO user_subscriptions (user_id, plan_name, status)
SELECT id, 'free', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO UPDATE SET 
  plan_name = COALESCE(user_subscriptions.plan_name, 'free'),
  status = COALESCE(user_subscriptions.status, 'active');
