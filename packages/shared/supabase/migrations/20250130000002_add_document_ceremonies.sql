-- Create agent_document_tool table for tracking SignatureAPI signing sessions
CREATE TABLE agent_document_tool (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES business_documents(id) ON DELETE CASCADE,
  envelope_id text NOT NULL, -- SignatureAPI envelope ID
  ceremony_url text NOT NULL, -- The signing URL for clients
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'expired')),
  recipient_name text,
  recipient_email text,
  signed_at timestamp with time zone,
  business_owner_email text, -- Email to notify when signed
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX idx_agent_document_tool_org_id ON agent_document_tool(organization_id);
CREATE INDEX idx_agent_document_tool_document_id ON agent_document_tool(document_id);
CREATE INDEX idx_agent_document_tool_envelope_id ON agent_document_tool(envelope_id);
CREATE INDEX idx_agent_document_tool_status ON agent_document_tool(status);

-- No RLS for now - disabled for easier testing
-- ALTER TABLE agent_document_tool ENABLE ROW LEVEL SECURITY;

-- Function to update ceremony status and send email notification
CREATE OR REPLACE FUNCTION update_ceremony_status(
  ceremony_envelope_id text,
  new_status text,
  signed_timestamp timestamp with time zone DEFAULT null
)
RETURNS void AS $$
BEGIN
  UPDATE agent_document_tool 
  SET 
    status = new_status,
    signed_at = COALESCE(signed_timestamp, signed_at),
    updated_at = now()
  WHERE envelope_id = ceremony_envelope_id;
  
  -- TODO: Add email notification logic here
  -- When status = 'completed', send email to business_owner_email
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON agent_document_tool TO authenticated;
GRANT EXECUTE ON FUNCTION update_ceremony_status(text, text, timestamp with time zone) TO authenticated;