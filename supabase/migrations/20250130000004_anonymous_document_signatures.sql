-- Migration: Anonymous Document Signatures
-- This implements the hybrid approach for document signing:
-- 1. Documents stay "active" permanently (no status changes)
-- 2. Track multiple signatures per document
-- 3. Prevent duplicates by name+email (cross-session)
-- 4. Support anonymous sessions

-- 1. Create document_signatures table for tracking multiple signatures
CREATE TABLE IF NOT EXISTS document_signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES agent_document_tool(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Anonymous session tracking
    anonymous_user_id UUID NULL, -- From anonymous session (temporary)
    
    -- Cross-session credential tracking
    signer_name TEXT NOT NULL,
    signer_email TEXT NOT NULL,
    
    -- Signature details
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    signed_file_path TEXT NULL, -- Path to signed PDF in storage
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_signatures_document_id ON document_signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_organization_id ON document_signatures(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_anonymous_user ON document_signatures(anonymous_user_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_credentials ON document_signatures(document_id, signer_name, signer_email);

-- 3. Add unique constraint to prevent same name+email signing same document twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_document_signatures_unique_credentials 
ON document_signatures(document_id, LOWER(TRIM(signer_name)), LOWER(TRIM(signer_email)));

-- 4. Modify agent_document_tool to remove status changes
-- Documents will always stay "active" instead of changing to "signed"
ALTER TABLE agent_document_tool 
DROP COLUMN IF EXISTS status CASCADE;

ALTER TABLE agent_document_tool 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 5. Remove old columns that are no longer needed with new approach
ALTER TABLE agent_document_tool 
DROP COLUMN IF EXISTS recipient_name CASCADE,
DROP COLUMN IF EXISTS recipient_email CASCADE,
DROP COLUMN IF EXISTS signed_at CASCADE,
DROP COLUMN IF EXISTS signed_file_path CASCADE;

-- 6. Enable RLS on document_signatures table
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for document_signatures
CREATE POLICY "Allow authenticated reads for document signatures" ON document_signatures
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow anonymous reads for document signatures" ON document_signatures
FOR SELECT TO anon
USING (true);

CREATE POLICY "Allow authenticated inserts for document signatures" ON document_signatures
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts for document signatures" ON document_signatures
FOR INSERT TO anon
WITH CHECK (true);

-- 8. Create function to check if name+email already signed a document
CREATE OR REPLACE FUNCTION check_existing_signature(
    p_document_id UUID,
    p_signer_name TEXT,
    p_signer_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM document_signatures 
        WHERE document_id = p_document_id 
        AND LOWER(TRIM(signer_name)) = LOWER(TRIM(p_signer_name))
        AND LOWER(TRIM(signer_email)) = LOWER(TRIM(p_signer_email))
    );
END;
$$;

-- 9. Create function to get signature count for a document
CREATE OR REPLACE FUNCTION get_document_signature_count(p_document_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    signature_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO signature_count
    FROM document_signatures 
    WHERE document_id = p_document_id;
    
    RETURN COALESCE(signature_count, 0);
END;
$$;

-- 10. Update all documents to active status (skip data migration for simplicity)
UPDATE agent_document_tool SET status = 'active' WHERE status != 'active';

-- 11. Add helpful comments
COMMENT ON TABLE document_signatures IS 'Tracks multiple signatures per document with anonymous session and credential-based duplicate prevention';
COMMENT ON FUNCTION check_existing_signature IS 'Checks if a name+email combination has already signed a specific document';
COMMENT ON FUNCTION get_document_signature_count IS 'Returns the total number of signatures for a document';