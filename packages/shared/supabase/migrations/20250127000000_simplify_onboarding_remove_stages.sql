-- Simplify onboarding system by removing stage complexity
-- Replace with pure AI intelligence approach

-- Add industry field to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS business_industry TEXT;

-- Remove stage-related columns from setup_completion table
ALTER TABLE setup_completion 
DROP COLUMN IF EXISTS stage1_completed,
DROP COLUMN IF EXISTS stage2_completed,
DROP COLUMN IF EXISTS stage3_completed,
DROP COLUMN IF EXISTS current_stage;

-- Add comment to document the simplified approach
COMMENT ON COLUMN organizations.business_industry IS 'Industry/business type detected by AI during onboarding';
COMMENT ON TABLE setup_completion IS 'Simplified onboarding tracking - only pending/completed status, no stages';
