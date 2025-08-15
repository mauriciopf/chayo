-- Migration: Remove stage column from business_info_fields table
-- Description: The stage column is no longer needed as we're using setup_completion.current_stage
--              as the single source of truth for onboarding stage tracking.
-- Date: 2025-02-02

-- Drop the stage column from business_info_fields table
ALTER TABLE business_info_fields 
DROP COLUMN IF EXISTS stage;

-- Add a comment to document the change
COMMENT ON TABLE business_info_fields IS 'Stores individual business information fields. Stage tracking moved to setup_completion.current_stage';