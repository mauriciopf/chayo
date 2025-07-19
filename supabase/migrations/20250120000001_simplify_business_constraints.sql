-- Migration: Simplify business constraints architecture
-- Remove unnecessary functions and simplify the business_constraints_view

-- Drop the complex functions we don't need
DROP FUNCTION IF EXISTS get_agent_business_constraints(UUID);
DROP FUNCTION IF EXISTS generate_business_constraints(UUID);

-- Simplify the business_constraints_view to be a direct aggregation
CREATE OR REPLACE VIEW business_constraints_view AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    jsonb_build_object(
        'name', COALESCE(
            (SELECT field_value FROM business_info_fields 
             WHERE organization_id = o.id AND field_name = 'business_name' AND is_answered = true 
             LIMIT 1), 
            'Business AI Assistant'
        ),
        'tone', 'professional',
        'business_info_gathered', (
            SELECT COUNT(*) 
            FROM business_info_fields 
            WHERE organization_id = o.id AND is_answered = true
        ),
        'whatsapp_trial_mentioned', false
    ) || 
    COALESCE(
        jsonb_object_agg(
            bif.field_name, bif.field_value
        ) FILTER (WHERE bif.is_answered = true), 
        '{}'::jsonb
    ) as business_constraints
FROM organizations o
LEFT JOIN business_info_fields bif ON o.id = bif.organization_id
GROUP BY o.id, o.name;

-- Grant permissions on the simplified view
GRANT SELECT ON business_constraints_view TO authenticated; 