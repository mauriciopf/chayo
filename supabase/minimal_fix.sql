-- Minimal fix to get dashboard working
-- This disables RLS temporarily so we can troubleshoot

-- Disable RLS on all tables
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_trials DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON team_members TO authenticated;
GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON agents TO authenticated;
GRANT ALL ON agent_channels TO authenticated;
GRANT ALL ON whatsapp_trials TO authenticated;

-- Create your organization record if it doesn't exist
INSERT INTO organizations (id, name, slug, owner_id, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'My Organization',
    'my-organization',
    '0de5d55b-c525-4f72-8e01-18c22d7ca0ef',
    NOW(),
    NOW()
)
ON CONFLICT (owner_id) DO NOTHING;

-- Create team membership
INSERT INTO team_members (id, organization_id, user_id, role, status, joined_at, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    o.id,
    '0de5d55b-c525-4f72-8e01-18c22d7ca0ef',
    'owner',
    'active',
    NOW(),
    NOW(),
    NOW()
FROM organizations o
WHERE o.owner_id = '0de5d55b-c525-4f72-8e01-18c22d7ca0ef'
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Create subscription
INSERT INTO user_subscriptions (id, user_id, organization_id, plan_name, status, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    '0de5d55b-c525-4f72-8e01-18c22d7ca0ef',
    o.id,
    'free',
    'active',
    NOW(),
    NOW()
FROM organizations o
WHERE o.owner_id = '0de5d55b-c525-4f72-8e01-18c22d7ca0ef'
ON CONFLICT (user_id) DO UPDATE SET 
    organization_id = EXCLUDED.organization_id,
    updated_at = NOW();

-- Create a test agent if none exists
INSERT INTO agents (id, user_id, organization_id, name, greeting, tone, goals, system_prompt, paused, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    '0de5d55b-c525-4f72-8e01-18c22d7ca0ef',
    o.id,
    'My First Agent',
    'Hello! How can I help you today?',
    'friendly',
    ARRAY['Help customers', 'Answer questions'],
    'You are a helpful AI assistant.',
    false,
    NOW(),
    NOW()
FROM organizations o
WHERE o.owner_id = '0de5d55b-c525-4f72-8e01-18c22d7ca0ef'
  AND NOT EXISTS (
    SELECT 1 FROM agents 
    WHERE user_id = '0de5d55b-c525-4f72-8e01-18c22d7ca0ef'
  );

-- Update existing agents to have organization
UPDATE agents 
SET organization_id = (
    SELECT id FROM organizations 
    WHERE owner_id = '0de5d55b-c525-4f72-8e01-18c22d7ca0ef' 
    LIMIT 1
),
updated_at = NOW()
WHERE user_id = '0de5d55b-c525-4f72-8e01-18c22d7ca0ef'
  AND organization_id IS NULL;
