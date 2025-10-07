-- Customer Support Email Notifications via Supabase Webhooks
-- This migration adds a helper function to get organization owner email
-- The actual email sending is handled by a Supabase Database Webhook + Edge Function

BEGIN;

-- Function to get organization owner email
-- This is useful for the Edge Function to query
CREATE OR REPLACE FUNCTION get_organization_owner_email(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    owner_email TEXT;
BEGIN
    SELECT u.email INTO owner_email
    FROM organizations o
    JOIN auth.users u ON u.id = o.owner_id
    WHERE o.id = org_id;
    
    RETURN owner_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_organization_owner_email(UUID) TO authenticated, anon, service_role;

COMMIT;

-- ============================================================================
-- SETUP INSTRUCTIONS:
-- ============================================================================
-- 
-- After running this migration, set up the Database Webhook in Supabase:
-- 
-- 1. Go to Supabase Dashboard > Database > Webhooks
-- 2. Click "Create a new hook"
-- 3. Configure:
--    - Name: "customer-support-email-notification"
--    - Table: "customer_support_messages"
--    - Events: [x] Insert
--    - Type: "Edge Function"
--    - Edge Function: "send-support-email"
--    - HTTP Headers: (none needed)
-- 
-- 4. Deploy the Edge Function:
--    cd supabase/functions
--    supabase functions deploy send-support-email
-- 
-- 5. Set secrets:
--    supabase secrets set RESEND_API_KEY=your_resend_api_key
-- 
-- The webhook will trigger automatically when a customer sends a message!
-- ============================================================================