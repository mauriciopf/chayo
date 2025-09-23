-- Create organization_app_configs table for mobile branding and app configuration
CREATE TABLE IF NOT EXISTS organization_app_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    theme_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_app_configs_org_id ON organization_app_configs(organization_id);

-- Disable RLS for organization_app_configs
ALTER TABLE organization_app_configs DISABLE ROW LEVEL SECURITY;

-- Update existing agent_tools table to include mobile-branding
ALTER TABLE agent_tools DROP CONSTRAINT IF EXISTS agent_tools_tool_type_check;
ALTER TABLE agent_tools ADD CONSTRAINT agent_tools_tool_type_check 
    CHECK (tool_type IN ('appointments', 'documents', 'payments', 'notifications', 'faqs', 'mobile-branding'));

-- Update the get_organization_agent_tools function to include mobile-branding
CREATE OR REPLACE FUNCTION get_organization_agent_tools(org_id uuid)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH all_tools AS (
    SELECT unnest(ARRAY['appointments', 'documents', 'payments', 'notifications', 'faqs', 'mobile-branding']) AS tool_type
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

-- Insert mobile-branding tool for existing organizations (disabled by default)
INSERT INTO agent_tools (organization_id, tool_type, enabled, updated_at)
SELECT 
    o.id,
    'mobile-branding',
    false,
    NOW()
FROM organizations o
ON CONFLICT (organization_id, tool_type) DO NOTHING;

-- Note: Storage policies removed - using application-level security instead