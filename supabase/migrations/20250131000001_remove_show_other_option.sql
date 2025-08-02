-- Remove show_other_option column from business_info_fields table
-- This field is no longer needed as we derive showOtherOption from the existence of multiple_choices

-- Drop the show_other_option column
ALTER TABLE business_info_fields 
DROP COLUMN IF EXISTS show_other_option;

-- Add comment explaining the change
COMMENT ON TABLE business_info_fields IS 'Business information fields with questions. The showOtherOption behavior is now derived from multiple_choices field presence.';