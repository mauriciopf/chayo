-- Remove unnecessary columns from organizations table
-- featured: Was used for highlighting businesses, no longer needed in marketplace
-- mobile_app_code: Was used for code-based access, replaced by direct business selection

BEGIN;

-- Remove the featured column if it exists
ALTER TABLE organizations 
DROP COLUMN IF EXISTS featured;

-- Remove the mobile_app_code column if it exists
ALTER TABLE organizations 
DROP COLUMN IF EXISTS mobile_app_code;

COMMIT;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'organizations' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
