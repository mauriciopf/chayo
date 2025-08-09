-- Remove user_id from agents table
-- Agents should belong to organizations, not individual users

-- First, drop existing RLS policies that depend on user_id
DROP POLICY IF EXISTS "Users can view their own agents" ON agents;
DROP POLICY IF EXISTS "Users can insert their own agents" ON agents;
DROP POLICY IF EXISTS "Users can update their own agents" ON agents;
DROP POLICY IF EXISTS "Users can delete their own agents" ON agents;
DROP POLICY IF EXISTS "Users can manage their own agents" ON agents;

-- Disable RLS on agents table since we're not using it
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;

-- Remove the user_id column from agents table
ALTER TABLE agents DROP COLUMN IF EXISTS user_id;

-- Make organization_id NOT NULL since agents must belong to an organization
ALTER TABLE agents ALTER COLUMN organization_id SET NOT NULL;

-- Create index for better performance on organization-based queries
CREATE INDEX IF NOT EXISTS idx_agents_organization_id ON agents(organization_id);

-- Grant necessary permissions
GRANT ALL ON agents TO authenticated;

-- Add helpful comment
COMMENT ON TABLE agents IS 'AI agents belonging to organizations. Access controlled by organization membership.';