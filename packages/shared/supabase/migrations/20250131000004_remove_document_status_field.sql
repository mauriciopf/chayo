-- Migration: Remove redundant status field from agent_document_tool
-- Created: 2025-01-31
-- Description: Removes the status field since document signing is now tracked via document_signatures table

-- Remove the status field and its constraint
ALTER TABLE agent_document_tool 
DROP COLUMN IF EXISTS status CASCADE;

-- Remove the status index if it exists
DROP INDEX IF EXISTS idx_agent_document_tool_status;
