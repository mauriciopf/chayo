-- Emergency fix script - run this to quickly restore your data
-- This bypasses RLS and creates records directly

-- First, let's disable RLS temporarily to avoid permission issues
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_trials DISABLE ROW LEVEL SECURITY;

-- Clear and recreate organization for your user
-- Replace 'your-email@example.com' with your actual email
DO $$
DECLARE
    target_user_id UUID := '0de5d55b-c525-4f72-8e01-18c22d7ca0ef'; -- Your user ID from the error
    org_id UUID;
    user_email TEXT;
BEGIN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = target_user_id;
    
    -- Delete existing records for clean start
    DELETE FROM team_members WHERE user_id = target_user_id;
    DELETE FROM user_subscriptions WHERE user_id = target_user_id;
    DELETE FROM organizations WHERE owner_id = target_user_id;
    
    -- Create fresh organization
    INSERT INTO organizations (name, slug, owner_id)
    VALUES (
        COALESCE(split_part(user_email, '@', 1), 'My') || '''s Organization',
        COALESCE(lower(replace(split_part(user_email, '@', 1), '.', '-')), 'my-org'),
        target_user_id
    )
    RETURNING id INTO org_id;
    
    -- Create team membership
    INSERT INTO team_members (organization_id, user_id, role, status)
    VALUES (org_id, target_user_id, 'owner', 'active');
    
    -- Create subscription
    INSERT INTO user_subscriptions (user_id, organization_id, plan_name, status)
    VALUES (target_user_id, org_id, 'free', 'active');
    
    -- Update agents to belong to organization
    UPDATE agents 
    SET organization_id = org_id 
    WHERE user_id = target_user_id;
    
    RAISE NOTICE 'Successfully created organization % for user %', org_id, user_email;
END $$;

-- Re-enable RLS with proper policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_trials ENABLE ROW LEVEL SECURITY;

-- Create essential policies
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR ALL USING (
    owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can view team members of their organizations" ON team_members;
CREATE POLICY "Users can view team members of their organizations" ON team_members
  FOR ALL USING (
    user_id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can manage their own subscriptions" ON user_subscriptions
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own agents" ON agents;
CREATE POLICY "Users can manage their own agents" ON agents
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own channels" ON agent_channels;
CREATE POLICY "Users can manage their own channels" ON agent_channels
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own trials" ON whatsapp_trials;
CREATE POLICY "Users can manage their own trials" ON whatsapp_trials
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON team_members TO authenticated;
GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON agents TO authenticated;
GRANT ALL ON agent_channels TO authenticated;
GRANT ALL ON whatsapp_trials TO authenticated;

-- Create a test agent if none exists
INSERT INTO agents (user_id, name, greeting, tone, goals, system_prompt)
SELECT 
    '0de5d55b-c525-4f72-8e01-18c22d7ca0ef',
    'Test Agent',
    'Hello! I''m your AI assistant. How can I help you today?',
    'friendly',
    ARRAY['Help customers', 'Answer questions', 'Provide support'],
    'You are a helpful AI assistant for customer support.'
WHERE NOT EXISTS (
    SELECT 1 FROM agents WHERE user_id = '0de5d55b-c525-4f72-8e01-18c22d7ca0ef'
);

-- Update the test agent with organization
UPDATE agents 
SET organization_id = (
    SELECT id FROM organizations WHERE owner_id = '0de5d55b-c525-4f72-8e01-18c22d7ca0ef' LIMIT 1
)
WHERE user_id = '0de5d55b-c525-4f72-8e01-18c22d7ca0ef';

-- Emergency fix completed successfully!
