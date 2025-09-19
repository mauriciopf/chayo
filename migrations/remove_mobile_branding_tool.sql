-- Migration: Remove mobile-branding from agent tools system
-- Simple and safe approach: remove mobile-branding records and update constraint

-- Step 1: Remove mobile-branding and vibe-card records (vibe-card is not a tool)
DELETE FROM agent_tools WHERE tool_type = 'mobile-branding';
DELETE FROM agent_tools WHERE tool_type = 'vibe-card';

-- Step 2: Drop and recreate constraint without mobile-branding
ALTER TABLE agent_tools DROP CONSTRAINT IF EXISTS agent_tools_tool_type_check;
ALTER TABLE agent_tools ADD CONSTRAINT agent_tools_tool_type_check 
CHECK (tool_type IN ('appointments', 'documents', 'payments', 'notifications', 'faqs', 'intake_forms', 'products', 'customer_support'));

-- Step 3: Update the get_organization_agent_tools function to remove mobile-branding
CREATE OR REPLACE FUNCTION get_organization_agent_tools(org_id uuid)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH all_tools AS (
    SELECT unnest(ARRAY['appointments', 'documents', 'payments', 'notifications', 'faqs', 'intake_forms', 'products', 'customer_support']) AS tool_type
  ),
  current_tools AS (
    SELECT 
      all_tools.tool_type,
      COALESCE(at.enabled, false) as enabled
    FROM all_tools
    LEFT JOIN agent_tools at ON at.organization_id = org_id AND at.tool_type = all_tools.tool_type
  )
  SELECT json_object_agg(tool_type, enabled) INTO result
  FROM current_tools;
  
  RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_organization_agent_tools(uuid) TO authenticated, service_role;

-- Log the completion
SELECT 'Successfully removed mobile-branding and vibe-card from agent tools system' as status;
