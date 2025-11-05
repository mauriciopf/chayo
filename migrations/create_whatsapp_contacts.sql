-- Create whatsapp_contacts table to store customers who have messaged the business
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  name TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one phone number per organization
  UNIQUE(organization_id, phone_number)
);

-- Index for faster lookups
CREATE INDEX idx_whatsapp_contacts_org_id ON whatsapp_contacts(organization_id);
CREATE INDEX idx_whatsapp_contacts_phone ON whatsapp_contacts(phone_number);
CREATE INDEX idx_whatsapp_contacts_last_message ON whatsapp_contacts(organization_id, last_message_at DESC);

-- No RLS policies (consistent with whatsapp_business_accounts table)

