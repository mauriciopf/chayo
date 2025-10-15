-- Add manual email fields to reminders_tool table
-- This allows sending reminders to custom email addresses without creating customer records

-- Make customer_id nullable
ALTER TABLE reminders_tool 
  ALTER COLUMN customer_id DROP NOT NULL;

-- Add manual email fields
ALTER TABLE reminders_tool 
  ADD COLUMN IF NOT EXISTS manual_email TEXT,
  ADD COLUMN IF NOT EXISTS manual_name TEXT;

-- Add constraint: either customer_id OR manual_email must be provided
ALTER TABLE reminders_tool
  ADD CONSTRAINT reminders_tool_recipient_check 
  CHECK (
    (customer_id IS NOT NULL) OR 
    (manual_email IS NOT NULL)
  );

-- Add index for manual_email lookups
CREATE INDEX IF NOT EXISTS idx_reminders_manual_email ON reminders_tool(manual_email);

-- Add comment explaining the change
COMMENT ON COLUMN reminders_tool.customer_id IS 'Customer ID if sending to existing customer. Nullable to support manual emails.';
COMMENT ON COLUMN reminders_tool.manual_email IS 'Email address for manual/custom recipients (not in customer database).';
COMMENT ON COLUMN reminders_tool.manual_name IS 'Optional name for manual/custom recipients.';

