-- Migration: Add onboarding columns to business_info_fields table
-- This migration adds columns needed for the integrated onboarding system

-- Add missing columns to business_info_fields table
ALTER TABLE business_info_fields 
ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_other BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'stage_1',
ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Add comments for the new columns
COMMENT ON COLUMN business_info_fields.allow_multiple IS 'Whether multiple choices can be selected for this question';
COMMENT ON COLUMN business_info_fields.show_other IS 'Whether to show "Other" option for multiple choice questions';
COMMENT ON COLUMN business_info_fields.stage IS 'Which onboarding stage this question belongs to';
COMMENT ON COLUMN business_info_fields."order" IS 'Order of the question within its stage';

-- Create index for ordering questions
CREATE INDEX IF NOT EXISTS idx_business_info_fields_order ON business_info_fields("order");

-- Create index for stage-based queries
CREATE INDEX IF NOT EXISTS idx_business_info_fields_stage ON business_info_fields(stage);

-- Update existing records to have default values
UPDATE business_info_fields 
SET 
  allow_multiple = false,
  show_other = false,
  stage = 'stage_1',
  "order" = id::text::integer % 1000
WHERE allow_multiple IS NULL OR show_other IS NULL OR stage IS NULL OR "order" IS NULL; 