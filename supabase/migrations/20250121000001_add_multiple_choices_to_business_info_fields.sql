-- Add multiple_choices field to business_info_fields table
-- This field will store an array of multiple choice options for questions

-- Add the multiple_choices column
ALTER TABLE business_info_fields 
ADD COLUMN IF NOT EXISTS multiple_choices JSONB DEFAULT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN business_info_fields.multiple_choices IS 'Array of multiple choice options for questions. Format: ["option1", "option2", "option3"]';

-- Update the field_type check to include 'multiple_choice'
ALTER TABLE business_info_fields 
DROP CONSTRAINT IF EXISTS business_info_fields_field_type_check;

ALTER TABLE business_info_fields 
ADD CONSTRAINT business_info_fields_field_type_check 
CHECK (field_type IN ('text', 'array', 'boolean', 'number', 'multiple_choice')); 