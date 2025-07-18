-- Migration: Fix business_info_fields table structure
-- Drop the existing table and recreate it with the correct structure

-- Drop the existing table and all its dependencies
DROP TABLE IF EXISTS business_info_fields CASCADE;

-- Create business_info_fields table with correct structure
CREATE TABLE business_info_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_value TEXT,
  field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'array', 'boolean', 'number')),
  is_answered BOOLEAN NOT NULL DEFAULT false,
  question_template TEXT NOT NULL,
  confidence DECIMAL(3,2),
  source TEXT CHECK (source IN ('conversation', 'document', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique field names per agent
  UNIQUE(agent_id, field_name)
);

-- Create indexes for better performance
CREATE INDEX idx_business_info_fields_agent_id ON business_info_fields(agent_id);
CREATE INDEX idx_business_info_fields_is_answered ON business_info_fields(is_answered);
CREATE INDEX idx_business_info_fields_created_at ON business_info_fields(created_at);

-- Enable RLS for business_info_fields
ALTER TABLE business_info_fields ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see business info fields for their agents
CREATE POLICY "Users can view their own business info fields" ON business_info_fields
  FOR SELECT USING (
    agent_id IN (
      SELECT id FROM agents 
      WHERE organization_id IN (
        SELECT organization_id FROM team_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Policy: Users can insert business info fields for their agents
CREATE POLICY "Users can insert their own business info fields" ON business_info_fields
  FOR INSERT WITH CHECK (
    agent_id IN (
      SELECT id FROM agents 
      WHERE organization_id IN (
        SELECT organization_id FROM team_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Policy: Users can update business info fields for their agents
CREATE POLICY "Users can update their own business info fields" ON business_info_fields
  FOR UPDATE USING (
    agent_id IN (
      SELECT id FROM agents 
      WHERE organization_id IN (
        SELECT organization_id FROM team_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Policy: Users can delete business info fields for their agents
CREATE POLICY "Users can delete their own business info fields" ON business_info_fields
  FOR DELETE USING (
    agent_id IN (
      SELECT id FROM agents 
      WHERE organization_id IN (
        SELECT organization_id FROM team_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Create trigger for business_info_fields updated_at
CREATE TRIGGER update_business_info_fields_updated_at 
  BEFORE UPDATE ON business_info_fields 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON business_info_fields TO authenticated; 