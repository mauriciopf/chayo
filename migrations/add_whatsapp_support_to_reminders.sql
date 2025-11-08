-- =============================================
-- Add WhatsApp Support to Reminders System
-- =============================================
-- This migration extends the reminders_tool table to support WhatsApp as a delivery channel
-- in addition to email. Users can now send reminders via WhatsApp using approved templates
-- or fallback to wa.me direct links.

-- Add channel selection and WhatsApp-specific fields
ALTER TABLE reminders_tool
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp')),
ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_template_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN reminders_tool.channel IS 'Delivery channel: email or whatsapp';
COMMENT ON COLUMN reminders_tool.whatsapp_phone IS 'Customer WhatsApp phone number (E.164 format, e.g. +52XXXXXXXXXX)';
COMMENT ON COLUMN reminders_tool.whatsapp_template_name IS 'WhatsApp template name to use (if NULL, falls back to wa.me direct link)';

-- Update existing reminders to explicitly set channel='email'
UPDATE reminders_tool 
SET channel = 'email' 
WHERE channel IS NULL;

-- Create index for faster filtering by channel
CREATE INDEX IF NOT EXISTS idx_reminders_channel ON reminders_tool(channel);
CREATE INDEX IF NOT EXISTS idx_reminders_whatsapp_phone ON reminders_tool(whatsapp_phone) WHERE channel = 'whatsapp';

-- =============================================
-- Update Functions to Support WhatsApp
-- =============================================

-- Update get_pending_reminders function to include WhatsApp fields
CREATE OR REPLACE FUNCTION get_pending_reminders()
RETURNS TABLE (
  reminder_id UUID,
  organization_id UUID,
  customer_id UUID,
  customer_email TEXT,
  customer_name TEXT,
  channel TEXT,
  whatsapp_phone TEXT,
  whatsapp_template_name TEXT,
  original_message TEXT,
  html_content TEXT,
  subject TEXT,
  recurrence TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.id,
    rt.organization_id,
    rt.customer_id,
    COALESCE(c.email, rt.manual_email) AS customer_email,
    COALESCE(c.name, rt.manual_name) AS customer_name,
    rt.channel,
    rt.whatsapp_phone,
    rt.whatsapp_template_name,
    rt.original_message,
    rt.ai_generated_html,
    rt.subject,
    rt.recurrence
  FROM reminders_tool rt
  LEFT JOIN customers c ON c.id = rt.customer_id
  WHERE rt.status = 'pending'
    AND rt.next_send_at <= NOW()
  ORDER BY rt.next_send_at ASC;
END;
$$;

COMMENT ON FUNCTION get_pending_reminders() IS 'Fetches all pending reminders (both email and WhatsApp) that are due to be sent';

