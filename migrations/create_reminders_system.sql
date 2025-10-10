-- Migration: Create Reminders System
-- Purpose: Enable businesses to send scheduled reminder emails to customers
-- Date: 2025-01-10

BEGIN;

-- 1. Add organization_ids array to customers table to track all organizations a customer has logged into
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS organization_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Create index for organization_ids array queries
CREATE INDEX IF NOT EXISTS idx_customers_organization_ids ON customers USING GIN(organization_ids);

-- 2. Create reminders_tool table
CREATE TABLE IF NOT EXISTS reminders_tool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Message content
  original_message TEXT NOT NULL,
  ai_generated_html TEXT,
  subject TEXT NOT NULL,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  recurrence TEXT NOT NULL DEFAULT 'once' CHECK (recurrence IN ('once', 'daily', 'weekly', 'monthly')),
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_count INTEGER DEFAULT 0,
  error_message TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reminders_organization_id ON reminders_tool(organization_id);
CREATE INDEX IF NOT EXISTS idx_reminders_customer_id ON reminders_tool(customer_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders_tool(status);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_at ON reminders_tool(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reminders_next_send_at ON reminders_tool(next_send_at);

-- Disable RLS for now (can be enabled later)
ALTER TABLE reminders_tool DISABLE ROW LEVEL SECURITY;

-- 3. Function to update organization_ids when customer logs in
CREATE OR REPLACE FUNCTION update_customer_organization_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- Add organization_id to organization_ids array if not already present
  IF NOT (NEW.organization_id = ANY(NEW.organization_ids)) THEN
    NEW.organization_ids := array_append(NEW.organization_ids, NEW.organization_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update organization_ids
DROP TRIGGER IF EXISTS update_customer_org_ids_trigger ON customers;
CREATE TRIGGER update_customer_org_ids_trigger
  BEFORE INSERT OR UPDATE OF organization_id ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_organization_ids();

-- 4. Function to calculate next send time for recurring reminders
CREATE OR REPLACE FUNCTION calculate_next_send_time(
  p_current_time TIMESTAMPTZ,
  p_recurrence TEXT
) RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE p_recurrence
    WHEN 'daily' THEN
      RETURN p_current_time + INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN p_current_time + INTERVAL '1 week';
    WHEN 'monthly' THEN
      RETURN p_current_time + INTERVAL '1 month';
    ELSE
      RETURN NULL; -- 'once' doesn't repeat
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Function to get pending reminders that need to be sent
CREATE OR REPLACE FUNCTION get_pending_reminders()
RETURNS TABLE (
  reminder_id UUID,
  organization_id UUID,
  customer_email TEXT,
  customer_name TEXT,
  subject TEXT,
  html_content TEXT,
  recurrence TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.organization_id,
    c.email,
    c.full_name,
    r.subject,
    r.ai_generated_html,
    r.recurrence
  FROM reminders_tool r
  INNER JOIN customers c ON r.customer_id = c.id
  WHERE r.status = 'pending'
    AND (
      (r.recurrence = 'once' AND r.scheduled_at <= NOW())
      OR (r.recurrence != 'once' AND r.next_send_at <= NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to mark reminder as sent and update next send time
CREATE OR REPLACE FUNCTION mark_reminder_sent(
  p_reminder_id UUID
) RETURNS void AS $$
DECLARE
  v_reminder reminders_tool;
  v_next_send TIMESTAMPTZ;
BEGIN
  -- Get reminder details
  SELECT * INTO v_reminder FROM reminders_tool WHERE id = p_reminder_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reminder not found';
  END IF;
  
  -- Calculate next send time for recurring reminders
  IF v_reminder.recurrence != 'once' THEN
    v_next_send := calculate_next_send_time(NOW(), v_reminder.recurrence);
    
    UPDATE reminders_tool SET
      last_sent_at = NOW(),
      next_send_at = v_next_send,
      sent_count = sent_count + 1,
      updated_at = NOW()
    WHERE id = p_reminder_id;
  ELSE
    -- Mark one-time reminder as sent
    UPDATE reminders_tool SET
      status = 'sent',
      last_sent_at = NOW(),
      sent_count = sent_count + 1,
      updated_at = NOW()
    WHERE id = p_reminder_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to mark reminder as failed
CREATE OR REPLACE FUNCTION mark_reminder_failed(
  p_reminder_id UUID,
  p_error_message TEXT
) RETURNS void AS $$
BEGIN
  UPDATE reminders_tool SET
    status = 'failed',
    error_message = p_error_message,
    updated_at = NOW()
  WHERE id = p_reminder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Add updated_at trigger
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON reminders_tool
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON reminders_tool TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_reminders TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_reminder_sent TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_reminder_failed TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION calculate_next_send_time TO authenticated, service_role;

-- 10. Backfill existing customers' organization_ids
UPDATE customers SET organization_ids = ARRAY[organization_id] WHERE organization_ids IS NULL OR organization_ids = '{}';

COMMIT;

