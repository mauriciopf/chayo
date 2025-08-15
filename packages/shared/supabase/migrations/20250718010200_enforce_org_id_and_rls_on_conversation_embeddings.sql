-- Migration: Enforce organization_id and RLS on conversation_embeddings

-- Make organization_id NOT NULL
-- ALTER TABLE conversation_embeddings ALTER COLUMN organization_id SET NOT NULL;

-- Drop any existing policies for conversation_embeddings (safety)
DROP POLICY IF EXISTS "Users can view their own conversation embeddings" ON conversation_embeddings;
DROP POLICY IF EXISTS "Users can insert their own conversation embeddings" ON conversation_embeddings;
DROP POLICY IF EXISTS "Users can update their own conversation embeddings" ON conversation_embeddings;
DROP POLICY IF EXISTS "Users can delete their own conversation embeddings" ON conversation_embeddings;

-- Create new RLS policies based on organization_id
CREATE POLICY "Org members can view conversation embeddings" ON conversation_embeddings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Org members can insert conversation embeddings" ON conversation_embeddings
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Org members can update conversation embeddings" ON conversation_embeddings
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Org members can delete conversation embeddings" ON conversation_embeddings
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  ); 