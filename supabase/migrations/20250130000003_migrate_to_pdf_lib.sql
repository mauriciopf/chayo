-- Drop the old SignatureAPI-based agent_document_tool table
DROP TABLE IF EXISTS agent_document_tool CASCADE;
DROP FUNCTION IF EXISTS update_ceremony_status(text, text, timestamp with time zone, text, text) CASCADE;

-- Create new agent_document_tool table for PDF storage and local signing
CREATE TABLE agent_document_tool (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- PDF file storage information
  file_path text NOT NULL, -- Path in Supabase storage
  file_name text NOT NULL, -- Original filename
  file_size integer NOT NULL, -- File size in bytes
  mime_type text NOT NULL DEFAULT 'application/pdf',
  
  -- Signing status and information
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'completed')),
  recipient_name text, -- Client who signs the document
  recipient_email text, -- Client email
  signed_at timestamp with time zone,
  signed_file_path text, -- Path to the signed PDF version
  
  -- Business owner information
  business_owner_email text NOT NULL, -- Email to notify when signed
  
  -- Metadata
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_agent_document_tool_org_id ON agent_document_tool(organization_id);
CREATE INDEX idx_agent_document_tool_status ON agent_document_tool(status);
CREATE INDEX idx_agent_document_tool_file_path ON agent_document_tool(file_path);

-- Function to update document signing status
CREATE OR REPLACE FUNCTION update_document_signature(
  document_id uuid,
  new_status text,
  signed_timestamp timestamp with time zone DEFAULT null,
  signer_name text DEFAULT null,
  signer_email text DEFAULT null,
  signed_pdf_path text DEFAULT null
)
RETURNS void AS $$
BEGIN
  UPDATE agent_document_tool 
  SET 
    status = new_status,
    signed_at = COALESCE(signed_timestamp, signed_at),
    recipient_name = COALESCE(signer_name, recipient_name),
    recipient_email = COALESCE(signer_email, recipient_email),
    signed_file_path = COALESCE(signed_pdf_path, signed_file_path),
    updated_at = now()
  WHERE id = document_id;
  
  -- TODO: Add email notification logic here
  -- When status = 'completed', send email to business_owner_email with recipient details
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON agent_document_tool TO authenticated;
GRANT EXECUTE ON FUNCTION update_document_signature(uuid, text, timestamp with time zone, text, text, text) TO authenticated;

-- Storage RLS Policy for agent-documents bucket
-- Allow authenticated users to upload to their organization's folder
CREATE POLICY "Allow authenticated uploads to agent-documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'agent-documents' AND
  (storage.foldername(name))[1] = 'agent-documents'
);

-- Allow authenticated users to read files (for PDF preview)
CREATE POLICY "Allow authenticated reads from agent-documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'agent-documents');

-- Allow anonymous users to read files (for client signing)
CREATE POLICY "Allow anonymous reads from agent-documents" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'agent-documents');

-- No RLS for now on our table - keeping it simple for development
-- ALTER TABLE agent_document_tool ENABLE ROW LEVEL SECURITY;