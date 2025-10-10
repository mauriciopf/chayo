-- Migration: Remove Reservations from Agent Tools System
-- Created: 2025-02-10
-- Description: Removes 'reservations' from agent_tools since reservations are now
--              a product-level feature controlled via the supports_reservations flag

BEGIN;

-- ============================================================================
-- 1. DELETE ALL EXISTING RESERVATIONS TOOL RECORDS
-- ============================================================================
DELETE FROM agent_tools WHERE tool_type = 'reservations';

-- ============================================================================
-- 2. UPDATE AGENT_TOOLS CONSTRAINT TO REMOVE 'reservations'
-- ============================================================================
ALTER TABLE agent_tools DROP CONSTRAINT IF EXISTS agent_tools_tool_type_check;
ALTER TABLE agent_tools ADD CONSTRAINT agent_tools_tool_type_check 
    CHECK (tool_type IN (
        'documents', 
        'payments', 
        'notifications', 
        'faqs', 
        'intake_forms', 
        'products', 
        'customer_support'
    ));

-- ============================================================================
-- 3. UPDATE get_organization_agent_tools FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION get_organization_agent_tools(org_id uuid)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH all_tools AS (
    SELECT unnest(ARRAY['documents', 'payments', 'notifications', 'faqs', 'intake_forms', 'products', 'customer_support']) AS tool_type
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_organization_agent_tools(uuid) TO authenticated, service_role;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Reservations are now managed at the product level via the supports_reservations
-- column in the products_list_tool table. The "Reservaciones" menu in the web
-- dashboard will automatically show if ANY product has supports_reservations = true.
-- ============================================================================

