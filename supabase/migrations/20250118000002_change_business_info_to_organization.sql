-- Migration: Change business_info_fields to use organization_id instead of agent_id
-- Business information should be shared across all agents in an organization

-- Drop the existing table and recreate it with organization_id
DROP TABLE IF EXISTS business_info_fields CASCADE;

-- Create business_info_fields table with organization_id
CREATE TABLE business_info_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_value TEXT,
  field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'array', 'boolean', 'number')),
  is_answered BOOLEAN NOT NULL DEFAULT false,
  question_template TEXT NOT NULL,
  confidence DECIMAL(3,2),
  source TEXT CHECK (source IN ('conversation', 'document', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique field names per organization
  UNIQUE(organization_id, field_name)
);

-- Create indexes for better performance
CREATE INDEX idx_business_info_fields_organization_id ON business_info_fields(organization_id);
CREATE INDEX idx_business_info_fields_is_answered ON business_info_fields(is_answered);
CREATE INDEX idx_business_info_fields_created_at ON business_info_fields(created_at);

-- Enable RLS for business_info_fields
ALTER TABLE business_info_fields ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see business info fields for their organizations
CREATE POLICY "Users can view their own business info fields" ON business_info_fields
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Policy: Users can insert business info fields for their organizations
CREATE POLICY "Users can insert their own business info fields" ON business_info_fields
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Policy: Users can update business info fields for their organizations
CREATE POLICY "Users can update their own business info fields" ON business_info_fields
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Policy: Users can delete business info fields for their organizations
CREATE POLICY "Users can delete their own business info fields" ON business_info_fields
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Create trigger for business_info_fields updated_at
CREATE TRIGGER update_business_info_fields_updated_at 
  BEFORE UPDATE ON business_info_fields 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON business_info_fields TO authenticated; 