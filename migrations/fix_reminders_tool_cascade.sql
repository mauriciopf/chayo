-- Migration: Fix reminders_tool cascade deletion
-- Purpose: Delete reminders when the user who created them is deleted
-- Date: 2025-10-27

BEGIN;

-- Drop the existing foreign key constraint
ALTER TABLE reminders_tool 
DROP CONSTRAINT IF EXISTS reminders_tool_created_by_fkey;

-- Recreate the constraint with ON DELETE CASCADE
-- This way, when a user is deleted, all their reminders are also deleted
ALTER TABLE reminders_tool 
ADD CONSTRAINT reminders_tool_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add a comment to document this behavior
COMMENT ON COLUMN reminders_tool.created_by IS 'User who created the reminder. Reminders are deleted when user is deleted (CASCADE).';

COMMIT;

