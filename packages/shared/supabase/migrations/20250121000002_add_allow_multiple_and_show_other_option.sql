-- Add allow_multiple and show_other_option fields to business_info_fields table
-- These fields will store configuration for multiple choice questions

-- Add the allow_multiple column
ALTER TABLE business_info_fields 
ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN DEFAULT false;

-- Add the show_other_option column  
ALTER TABLE business_info_fields 
ADD COLUMN IF NOT EXISTS show_other_option BOOLEAN DEFAULT false;

-- Add comments explaining the fields
COMMENT ON COLUMN business_info_fields.allow_multiple IS 'Whether users can select multiple options for this question';
COMMENT ON COLUMN business_info_fields.show_other_option IS 'Whether to show an "Other" option for multiple choice questions'; 