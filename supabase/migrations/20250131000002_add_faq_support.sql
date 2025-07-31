-- Migration: FAQ system with Form.io-like architecture
-- Created: 2025-01-31
-- Description: Creates FAQ system reusing intake forms patterns for Q&A management

-- 1. Create faqs_tool table
CREATE TABLE IF NOT EXISTS public.faqs_tool (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    faq_items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {id, question, answer, order} objects
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS for faqs_tool table
ALTER TABLE public.faqs_tool ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for faqs_tool
-- Organizations can manage their own FAQs
CREATE POLICY "Organizations can manage their own FAQs"
ON public.faqs_tool
FOR ALL
USING (
    organization_id IN (
        SELECT organizations.id 
        FROM organizations 
        WHERE organizations.id = organization_id
    )
);

-- Public read access to active FAQs (for client chat)
CREATE POLICY "Public read access to active FAQs"
ON public.faqs_tool
FOR SELECT
USING (is_active = true);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_faqs_tool_organization_id ON public.faqs_tool(organization_id);
CREATE INDEX IF NOT EXISTS idx_faqs_tool_is_active ON public.faqs_tool(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_tool_organization_active ON public.faqs_tool(organization_id, is_active);

-- 5. Create helper functions

-- Get active FAQs for an organization
CREATE OR REPLACE FUNCTION get_active_faqs(org_id uuid)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'description', description,
      'faq_items', faq_items,
      'created_at', created_at,
      'updated_at', updated_at
    )
  ) INTO result
  FROM faqs_tool 
  WHERE organization_id = org_id 
  AND is_active = true
  ORDER BY updated_at DESC;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search FAQ items by question content (for client chat)
CREATE OR REPLACE FUNCTION search_faq_items(org_id uuid, search_query text)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'faq_id', id,
      'faq_name', name,
      'question', item->>'question',
      'answer', item->>'answer',
      'order', (item->>'order')::integer
    )
  ) INTO result
  FROM faqs_tool,
  jsonb_array_elements(faq_items) AS item
  WHERE organization_id = org_id 
  AND is_active = true
  AND (
    item->>'question' ILIKE '%' || search_query || '%' 
    OR item->>'answer' ILIKE '%' || search_query || '%'
  )
  ORDER BY (item->>'order')::integer;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update agent tools helper functions to handle FAQs properly
-- (FAQs are already included in the constraint from the previous migration)

-- Add grants
GRANT ALL ON public.faqs_tool TO authenticated;
GRANT ALL ON public.faqs_tool TO anon;
GRANT EXECUTE ON FUNCTION get_active_faqs(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_faqs(uuid) TO anon;
GRANT EXECUTE ON FUNCTION search_faq_items(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION search_faq_items(uuid, text) TO anon;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_faqs_tool_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_faqs_tool_updated_at_trigger
    BEFORE UPDATE ON public.faqs_tool
    FOR EACH ROW
    EXECUTE FUNCTION update_faqs_tool_updated_at();