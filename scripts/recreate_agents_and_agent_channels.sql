-- Recreate agents and agent_channels tables
-- This script recreates the tables with the current expected structure (simplified schema)

-- Drop existing tables if they exist (for clean recreation)
DROP TABLE IF EXISTS agent_channels CASCADE;
DROP TABLE IF EXISTS agents CASCADE;

-- Create agents table with current structure
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agent_channels table with current structure
CREATE TABLE agent_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- e.g. 'whatsapp', 'agent_chat_link', 'web_widget'
  config JSONB DEFAULT '{}', -- channel-specific config (optional)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (agent_id, channel)
);

-- Add indexes for performance
CREATE INDEX idx_agents_organization_id ON agents(organization_id);
CREATE INDEX idx_agents_created_at ON agents(created_at);
CREATE INDEX idx_agent_channels_agent_id ON agent_channels(agent_id);
CREATE INDEX idx_agent_channels_organization_id ON agent_channels(organization_id);
CREATE INDEX idx_agent_channels_channel ON agent_channels(channel);
CREATE INDEX idx_agent_channels_agent_channel ON agent_channels(agent_id, channel);

-- Enable Row Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_channels ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (if any)
DROP POLICY IF EXISTS "Users can view their organization's agents" ON agents;
DROP POLICY IF EXISTS "Users can insert their organization's agents" ON agents;
DROP POLICY IF EXISTS "Users can update their organization's agents" ON agents;
DROP POLICY IF EXISTS "Users can delete their organization's agents" ON agents;

DROP POLICY IF EXISTS "Users can view their organization's agent channels" ON agent_channels;
DROP POLICY IF EXISTS "Users can insert their organization's agent channels" ON agent_channels;
DROP POLICY IF EXISTS "Users can update their organization's agent channels" ON agent_channels;
DROP POLICY IF EXISTS "Users can delete their organization's agent channels" ON agent_channels;

-- Create RLS policies for agents
CREATE POLICY "Users can view their organization's agents" ON agents
  FOR SELECT USING (
    organization_id IN (
      SELECT tm.organization_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Users can insert their organization's agents" ON agents
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT tm.organization_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Users can update their organization's agents" ON agents
  FOR UPDATE USING (
    organization_id IN (
      SELECT tm.organization_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Users can delete their organization's agents" ON agents
  FOR DELETE USING (
    organization_id IN (
      SELECT tm.organization_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

-- Create RLS policies for agent_channels
CREATE POLICY "Users can view their organization's agent channels" ON agent_channels
  FOR SELECT USING (
    organization_id IN (
      SELECT tm.organization_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Users can insert their organization's agent channels" ON agent_channels
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT tm.organization_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Users can update their organization's agent channels" ON agent_channels
  FOR UPDATE USING (
    organization_id IN (
      SELECT tm.organization_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

CREATE POLICY "Users can delete their organization's agent channels" ON agent_channels
  FOR DELETE USING (
    organization_id IN (
      SELECT tm.organization_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_agent_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_agents_updated_at();

CREATE TRIGGER update_agent_channels_updated_at
  BEFORE UPDATE ON agent_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_channels_updated_at();

-- Add table comments
COMMENT ON TABLE agents IS 'AI agents for organizations';
COMMENT ON TABLE agent_channels IS 'Communication channels for agents (chat links, WhatsApp, etc.)';
COMMENT ON COLUMN agent_channels.channel IS 'Channel type: agent_chat_link, whatsapp, web_widget, etc.';
COMMENT ON COLUMN agent_channels.config IS 'Channel-specific configuration options';

-- Verify the tables were created correctly
SELECT 
  'agents table created successfully' AS status,
  COUNT(*) AS column_count
FROM information_schema.columns 
WHERE table_name = 'agents';

SELECT 
  'agent_channels table created successfully' AS status,
  COUNT(*) AS column_count
FROM information_schema.columns 
WHERE table_name = 'agent_channels';

-- Verify indexes were created
SELECT 
  'Indexes created successfully' AS status,
  COUNT(*) AS index_count
FROM pg_indexes 
WHERE tablename IN ('agents', 'agent_channels'); 