-- Create simplified table for WhatsApp Business Accounts
-- Note: This is the SIMPLIFIED version. See simplify_whatsapp_business_accounts.sql for migration.
CREATE TABLE IF NOT EXISTS whatsapp_business_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Core WhatsApp identifiers
  waba_id TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  
  -- Access token for API calls
  access_token TEXT NOT NULL,
  
  -- Simple active/inactive flag
  is_active BOOLEAN DEFAULT true,
  
  -- One WhatsApp account per organization
  UNIQUE(organization_id)
);

-- Create minimal index (organization_id already indexed via UNIQUE constraint)
CREATE INDEX IF NOT EXISTS idx_whatsapp_waba_id ON whatsapp_business_accounts(waba_id);
