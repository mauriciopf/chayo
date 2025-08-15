-- Migration: Add organization_id to conversation_embeddings
ALTER TABLE conversation_embeddings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE; 