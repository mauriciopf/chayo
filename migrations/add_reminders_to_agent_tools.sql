-- Migration: Add reminders to agent_tools
-- Purpose: Add reminders as a valid tool_type in agent_tools table
-- Date: 2025-01-10

BEGIN;

-- 1. Update the tool_type CHECK constraint to include 'reminders'
ALTER TABLE agent_tools DROP CONSTRAINT IF EXISTS agent_tools_tool_type_check;
ALTER TABLE agent_tools ADD CONSTRAINT agent_tools_tool_type_check
    CHECK (tool_type IN ('documents', 'payments', 'faqs', 'intake_forms', 'products', 'customer_support', 'reminders'));

-- 2. Update the get_organization_agent_tools function to include 'reminders'
CREATE OR REPLACE FUNCTION get_organization_agent_tools(org_id uuid)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH all_tools AS (
    SELECT unnest(ARRAY['documents', 'payments', 'faqs', 'intake_forms', 'products', 'customer_support', 'reminders']) AS tool_type
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

COMMIT;

