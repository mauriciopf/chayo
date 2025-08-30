-- Fix agent_tools constraint to include both intake_forms and mobile-branding
-- This fixes the conflict between the two 20250131000001 migrations

-- Drop existing constraint and recreate with both intake_forms and mobile-branding
ALTER TABLE public.agent_tools DROP CONSTRAINT IF EXISTS agent_tools_tool_type_check;
ALTER TABLE public.agent_tools ADD CONSTRAINT agent_tools_tool_type_check 
    CHECK (tool_type IN ('appointments', 'documents', 'payments', 'notifications', 'faqs', 'intake_forms', 'mobile-branding'));

-- Update the get_organization_agent_tools function to include both tools
CREATE OR REPLACE FUNCTION get_organization_agent_tools(org_id uuid)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH all_tools AS (
    SELECT unnest(ARRAY['appointments', 'documents', 'payments', 'notifications', 'faqs', 'intake_forms', 'mobile-branding']) AS tool_type
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_organization_agent_tools(uuid) TO authenticated, service_role;
