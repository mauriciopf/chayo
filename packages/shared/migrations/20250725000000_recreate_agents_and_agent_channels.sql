-- Drop legacy tables if they exist
DROP TABLE IF EXISTS agent_channels CASCADE;
DROP TABLE IF EXISTS agents CASCADE;

-- Create new agents table
CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create new agent_channels table
CREATE TABLE agent_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  channel text NOT NULL, -- e.g. 'whatsapp', 'agent_chat_link', 'web_widget'
  config jsonb,          -- channel-specific config (optional)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (agent_id, channel)
); 