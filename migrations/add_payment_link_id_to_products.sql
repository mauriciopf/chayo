-- Migration: Add payment_link_id to products_list_tool
-- Created: 2025-01-30
-- Description: Store Stripe payment_link_id so we can deactivate old links when price changes

-- Add column to store the provider's payment link ID (for deactivation/replacement)
ALTER TABLE products_list_tool
ADD COLUMN IF NOT EXISTS payment_link_id TEXT;

-- Add comment
COMMENT ON COLUMN products_list_tool.payment_link_id IS 'Provider-specific payment link ID (e.g., Stripe payment_link ID) used for deactivating old links when price changes';

