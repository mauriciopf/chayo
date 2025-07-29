-- Add stage completion columns to setup_completion table
ALTER TABLE setup_completion 
ADD COLUMN IF NOT EXISTS stage1_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stage2_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stage3_completed BOOLEAN DEFAULT FALSE;

-- Update existing records to have default values
UPDATE setup_completion 
SET 
  stage1_completed = COALESCE(stage1_completed, FALSE),
  stage2_completed = COALESCE(stage2_completed, FALSE),
  stage3_completed = COALESCE(stage3_completed, FALSE)
WHERE stage1_completed IS NULL OR stage2_completed IS NULL OR stage3_completed IS NULL; 