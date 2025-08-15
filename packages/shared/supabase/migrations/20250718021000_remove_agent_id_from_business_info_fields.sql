-- Migration: Remove agent_id from business_info_fields and update policies/views

-- 1. Drop foreign key and column agent_id from business_info_fields
ALTER TABLE business_info_fields DROP CONSTRAINT IF EXISTS business_info_fields_agent_id_fkey;
ALTER TABLE business_info_fields DROP COLUMN IF EXISTS agent_id;

-- 2. Add organization_id column if not exists
ALTER TABLE business_info_fields ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;

-- 3. Update unique constraint to use organization_id and field_name
ALTER TABLE business_info_fields DROP CONSTRAINT IF EXISTS business_info_fields_agent_id_field_name_key;
ALTER TABLE business_info_fields ADD CONSTRAINT business_info_fields_organization_id_field_name_key UNIQUE(organization_id, field_name);

-- 4. Update RLS policies to use organization_id
DROP POLICY IF EXISTS "Users can view their own business info fields" ON business_info_fields;
CREATE POLICY "Users can view their own business info fields" ON business_info_fields
  FOR SELECT USING (
    organization_id = ANY(get_user_organization_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert their own business info fields" ON business_info_fields;
CREATE POLICY "Users can insert their own business info fields" ON business_info_fields
  FOR INSERT WITH CHECK (
    organization_id = ANY(get_user_organization_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update their own business info fields" ON business_info_fields;
CREATE POLICY "Users can update their own business info fields" ON business_info_fields
  FOR UPDATE USING (
    organization_id = ANY(get_user_organization_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete their own business info fields" ON business_info_fields;
CREATE POLICY "Users can delete their own business info fields" ON business_info_fields
  FOR DELETE USING (
    organization_id = ANY(get_user_organization_ids(auth.uid()))
  );

-- 5. Update business_constraints_view to use organization_id
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