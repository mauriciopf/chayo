-- Migration: Add setup completion tracking
-- This migration adds a table to track onboarding setup completion status

-- Create setup_completion table
CREATE TABLE IF NOT EXISTS setup_completion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  setup_status TEXT NOT NULL DEFAULT 'in_progress' CHECK (setup_status IN ('in_progress', 'completed', 'abandoned')),
  completed_at TIMESTAMPTZ,
  total_questions INTEGER DEFAULT 0,
  answered_questions INTEGER DEFAULT 0,
  current_stage TEXT DEFAULT 'stage_1',
  stage_progress JSONB DEFAULT '{}'::jsonb,
  completion_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Enable RLS for setup_completion
ALTER TABLE setup_completion ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for setup_completion
DROP POLICY IF EXISTS "Users can view their own setup completion" ON setup_completion;
CREATE POLICY "Users can view their own setup completion" ON setup_completion
  FOR SELECT USING (
    organization_id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
  );

DROP POLICY IF EXISTS "Users can insert their own setup completion" ON setup_completion;
CREATE POLICY "Users can insert their own setup completion" ON setup_completion
  FOR INSERT WITH CHECK (
    organization_id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
  );

DROP POLICY IF EXISTS "Users can update their own setup completion" ON setup_completion;
CREATE POLICY "Users can update their own setup completion" ON setup_completion
  FOR UPDATE USING (
    organization_id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
  );

-- Create indexes for setup_completion
CREATE INDEX IF NOT EXISTS idx_setup_completion_organization_id ON setup_completion(organization_id);
CREATE INDEX IF NOT EXISTS idx_setup_completion_status ON setup_completion(setup_status);
CREATE INDEX IF NOT EXISTS idx_setup_completion_created_at ON setup_completion(created_at);

-- Create trigger for setup_completion updated_at
DROP TRIGGER IF EXISTS update_setup_completion_updated_at ON setup_completion;
CREATE TRIGGER update_setup_completion_updated_at 
  BEFORE UPDATE ON setup_completion 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON setup_completion TO authenticated;

-- Add comment
COMMENT ON TABLE setup_completion IS 'Tracks onboarding setup completion status for organizations'; 