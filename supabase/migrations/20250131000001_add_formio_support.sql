-- Migration: Complete intake forms setup with Form.io support
-- Created: 2025-01-31
-- Description: Creates complete intake forms system with Form.io integration

-- 1. Create intake_forms table with Form.io support from the start
CREATE TABLE IF NOT EXISTS public.intake_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb, -- Legacy field for compatibility (empty for Form.io forms)
    formio_definition JSONB, -- Form.io form definition stored as JSON schema
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create intake_form_responses table to store client submissions
CREATE TABLE IF NOT EXISTS public.intake_form_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES public.intake_forms(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_name TEXT,
    client_email TEXT,
    responses JSONB NOT NULL DEFAULT '{}'::jsonb, -- Key-value pairs of field responses
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    anonymous_user_id UUID -- For tracking anonymous sessions
);

-- 3. Enable RLS on intake forms tables
ALTER TABLE public.intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_form_responses ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for intake_forms
DROP POLICY IF EXISTS "Organizations can manage their intake forms" ON public.intake_forms;
CREATE POLICY "Organizations can manage their intake forms" ON public.intake_forms
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.team_members WHERE organization_id = intake_forms.organization_id));

-- 5. Create RLS policies for intake_form_responses
DROP POLICY IF EXISTS "Organizations can view their form responses" ON public.intake_form_responses;
CREATE POLICY "Organizations can view their form responses" ON public.intake_form_responses
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.team_members WHERE organization_id = intake_form_responses.organization_id));

-- Allow anonymous users to submit responses (via API)
DROP POLICY IF EXISTS "Anonymous users can submit form responses" ON public.intake_form_responses;
CREATE POLICY "Anonymous users can submit form responses" ON public.intake_form_responses
  FOR INSERT WITH CHECK (true); -- This will be controlled by API logic

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_intake_forms_organization_id ON public.intake_forms (organization_id);
CREATE INDEX IF NOT EXISTS idx_intake_forms_active ON public.intake_forms (organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_intake_forms_formio_def ON public.intake_forms (organization_id) WHERE formio_definition IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intake_form_responses_form_id ON public.intake_form_responses (form_id);
CREATE INDEX IF NOT EXISTS idx_intake_form_responses_organization_id ON public.intake_form_responses (organization_id);
CREATE INDEX IF NOT EXISTS idx_intake_form_responses_submitted_at ON public.intake_form_responses (submitted_at);

-- 7. Create helper function to get active intake forms for an organization
CREATE OR REPLACE FUNCTION get_active_intake_forms(org_id UUID)
RETURNS TABLE (
    form_id UUID,
    form_name TEXT,
    form_description TEXT,
    has_formio_definition BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id as form_id,
        name as form_name,
        description as form_description,
        (formio_definition IS NOT NULL) as has_formio_definition
    FROM public.intake_forms
    WHERE organization_id = org_id 
    AND is_active = true
    ORDER BY created_at DESC;
END;
$$;

-- 8. Create helper function to get form responses for an organization
CREATE OR REPLACE FUNCTION get_form_responses(org_id UUID, form_id UUID DEFAULT NULL)
RETURNS TABLE (
    response_id UUID,
    form_name TEXT,
    client_name TEXT,
    client_email TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    response_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ifr.id as response_id,
        if.name as form_name,
        ifr.client_name,
        ifr.client_email,
        ifr.submitted_at,
        (jsonb_object_keys(ifr.responses))::INTEGER as response_count
    FROM public.intake_form_responses ifr
    JOIN public.intake_forms if ON ifr.form_id = if.id
    WHERE ifr.organization_id = org_id
    AND (form_id IS NULL OR ifr.form_id = form_id)
    ORDER BY ifr.submitted_at DESC;
END;
$$;

-- 9. Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_active_intake_forms(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_form_responses(UUID, UUID) TO authenticated;

-- 10. Update agent_tools constraint to include intake_forms
-- Drop existing constraint and recreate with intake_forms
ALTER TABLE public.agent_tools DROP CONSTRAINT IF EXISTS agent_tools_tool_type_check;
ALTER TABLE public.agent_tools ADD CONSTRAINT agent_tools_tool_type_check 
CHECK (tool_type IN ('appointments', 'documents', 'payments', 'notifications', 'faqs', 'intake_forms'));

-- 11. Update helper functions to include intake_forms
CREATE OR REPLACE FUNCTION get_organization_agent_tools(org_id uuid)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH all_tools AS (
    SELECT unnest(ARRAY['appointments', 'documents', 'payments', 'notifications', 'faqs', 'intake_forms']) AS tool_type
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

-- Also update the upsert function to handle intake_forms
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

-- 12. Add comments
COMMENT ON TABLE public.intake_forms IS 'Intake forms table with Form.io integration for advanced form building';
COMMENT ON TABLE public.intake_form_responses IS 'Client responses to intake forms';
COMMENT ON COLUMN public.intake_forms.fields IS 'Legacy field for compatibility - empty for Form.io forms';
COMMENT ON COLUMN public.intake_forms.formio_definition IS 'Form.io form definition stored as JSON schema';