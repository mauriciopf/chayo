-- Create agent_tools table
CREATE TABLE agent_tools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tool_type text NOT NULL CHECK (tool_type IN ('appointments', 'documents', 'payments', 'notifications', 'faqs')),
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure one tool setting per type per organization
  UNIQUE(organization_id, tool_type)
);

-- Create index for faster lookups
CREATE INDEX idx_agent_tools_org_id ON agent_tools(organization_id);

-- No RLS policies needed for agent_tools

-- Function to get agent tools with defaults
CREATE OR REPLACE FUNCTION get_organization_agent_tools(org_id uuid)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH all_tools AS (
    SELECT unnest(ARRAY['appointments', 'documents', 'payments', 'notifications', 'faqs']) AS tool_type
  ),
  current_tools AS (
    SELECT 
      at.tool_type,
      COALESCE(agt.enabled, false) AS enabled
    FROM all_tools at
    LEFT JOIN agent_tools agt 
      ON agt.organization_id = org_id AND agt.tool_type = at.tool_type
  )
  SELECT json_object_agg(tool_type, enabled) INTO result
  FROM current_tools;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert agent tool settings
CREATE OR REPLACE FUNCTION upsert_organization_agent_tool(
  org_id uuid,
  tool text,
  is_enabled boolean
)
RETURNS void AS $$
BEGIN
  INSERT INTO agent_tools (organization_id, tool_type, enabled, updated_at)
  VALUES (org_id, tool, is_enabled, now())
  ON CONFLICT (organization_id, tool_type)
  DO UPDATE SET 
    enabled = EXCLUDED.enabled,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON agent_tools TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_agent_tools(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_organization_agent_tool(uuid, text, boolean) TO authenticated;