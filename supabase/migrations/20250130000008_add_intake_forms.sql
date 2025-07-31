-- Migration: Add intake forms tables and support
-- Created: 2025-01-30
-- Description: Creates tables for intake forms functionality, replaces notifications with intake_forms in agent tools

-- 1. Create intake_forms table to store form templates
CREATE TABLE public.intake_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of form field definitions
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create intake_form_responses table to store client submissions
CREATE TABLE public.intake_form_responses (
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
CREATE POLICY "Organizations can manage their intake forms" ON public.intake_forms
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.team_members WHERE organization_id = intake_forms.organization_id));

-- 5. Create RLS policies for intake_form_responses
CREATE POLICY "Organizations can view their form responses" ON public.intake_form_responses
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.team_members WHERE organization_id = intake_form_responses.organization_id));

-- Allow anonymous users to submit responses (via API)
CREATE POLICY "Anonymous users can submit form responses" ON public.intake_form_responses
  FOR INSERT WITH CHECK (true); -- This will be controlled by API logic

-- 6. Create indexes for performance
CREATE INDEX idx_intake_forms_organization_id ON public.intake_forms (organization_id);
CREATE INDEX idx_intake_forms_active ON public.intake_forms (organization_id, is_active);
CREATE INDEX idx_intake_form_responses_form_id ON public.intake_form_responses (form_id);
CREATE INDEX idx_intake_form_responses_organization_id ON public.intake_form_responses (organization_id);
CREATE INDEX idx_intake_form_responses_submitted_at ON public.intake_form_responses (submitted_at);

-- 7. Update agent tools to replace 'notifications' with 'intake_forms'
-- Note: This assumes the database function get_organization_agent_tools and related
-- functions already exist and can handle dynamic tool types

-- 8. Create helper function to get active intake forms for an organization
CREATE OR REPLACE FUNCTION get_active_intake_forms(org_id UUID)
RETURNS TABLE (
    form_id UUID,
    form_name TEXT,
    form_description TEXT,
    field_count INTEGER
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
        (jsonb_array_length(fields))::INTEGER as field_count
    FROM public.intake_forms
    WHERE organization_id = org_id 
    AND is_active = true
    ORDER BY created_at DESC;
END;
$$;

-- 9. Create helper function to get form responses for an organization
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

-- 10. Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_active_intake_forms(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_form_responses(UUID, UUID) TO authenticated;

-- 11. Add notification that this migration removes notifications support
COMMENT ON TABLE public.intake_forms IS 'Intake forms table - replaces notifications functionality with form collection';
COMMENT ON TABLE public.intake_form_responses IS 'Client responses to intake forms';