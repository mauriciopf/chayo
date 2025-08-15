-- Fix business_constraints_view
-- This migration ensures the view is properly created and accessible

-- Drop and recreate the view to ensure it's up to date
DROP VIEW IF EXISTS business_constraints_view;

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

-- Grant permissions to the view
GRANT SELECT ON business_constraints_view TO authenticated;

-- Add comment
COMMENT ON VIEW business_constraints_view IS 'Dynamic view that aggregates business info fields into business constraints for each organization'; 