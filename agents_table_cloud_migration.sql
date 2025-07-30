-- OPTIMAL AGENTS TABLE FOR CLOUD DATABASE
-- This is the best version that supports all current functionality
-- Removes the overcomplicated agent_channels table architecture

-- Drop the overcomplicated agent_channels table first (cascade will handle references)
DROP TABLE IF EXISTS agent_channels CASCADE;

-- Drop and recreate agents table with optimal schema
DROP TABLE IF EXISTS agents CASCADE;

CREATE TABLE agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  greeting TEXT NOT NULL DEFAULT 'Hello! How can I help you today?',
  tone TEXT DEFAULT 'professional',
  goals TEXT[] DEFAULT ARRAY['Provide helpful customer service']::TEXT[],
  system_prompt TEXT,
  paused BOOLEAN NOT NULL DEFAULT FALSE,
  channel TEXT DEFAULT 'client_chat' CHECK (channel IN ('client_chat', 'whatsapp', 'phone', 'email')),
  channel_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: RLS is disabled - no row level security policies

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS agents_user_id_idx ON agents(user_id);
CREATE INDEX IF NOT EXISTS agents_organization_id_idx ON agents(organization_id);
CREATE INDEX IF NOT EXISTS agents_channel_idx ON agents(channel);
CREATE INDEX IF NOT EXISTS agents_org_channel_idx ON agents(organization_id, channel);
CREATE INDEX IF NOT EXISTS agents_created_at_idx ON agents(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at 
  BEFORE UPDATE ON agents 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column(); 