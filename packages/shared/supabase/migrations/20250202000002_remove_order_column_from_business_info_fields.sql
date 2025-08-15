-- Migration: Remove order column from business_info_fields table
-- Description: The order column is not needed since AI determines question sequence dynamically
--              based on conversation context, not predetermined order.
-- Date: 2025-02-02

-- Drop the index first (if it exists)
DROP INDEX IF EXISTS idx_business_info_fields_order;

-- Drop the order column from business_info_fields table
ALTER TABLE business_info_fields 
DROP COLUMN IF EXISTS "order";

-- Add a comment to document the change
COMMENT ON TABLE business_info_fields IS 'Stores individual business information fields. Questions are ordered dynamically by AI based on context';