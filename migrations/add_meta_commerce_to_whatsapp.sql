-- =============================================
-- Add Meta Commerce Catalog Support to WhatsApp Business Accounts
-- =============================================
-- This migration adds catalog_id to track Meta Commerce catalogs
-- for syncing products when WABA is connected

-- Add catalog_id to whatsapp_business_accounts
ALTER TABLE whatsapp_business_accounts
ADD COLUMN IF NOT EXISTS catalog_id TEXT;

COMMENT ON COLUMN whatsapp_business_accounts.catalog_id IS 'Meta Commerce catalog ID for product syncing (created in Commerce Manager)';

-- Add meta sync fields to products_list_tool
ALTER TABLE products_list_tool
ADD COLUMN IF NOT EXISTS meta_product_id TEXT,
ADD COLUMN IF NOT EXISTS synced_to_meta_at TIMESTAMPTZ;

COMMENT ON COLUMN products_list_tool.meta_product_id IS 'Meta Commerce product handle/ID returned from items_batch API';
COMMENT ON COLUMN products_list_tool.synced_to_meta_at IS 'Timestamp when product was last synced to Meta Commerce';

-- Create index for Meta product lookups
CREATE INDEX IF NOT EXISTS idx_products_meta_product_id ON products_list_tool(meta_product_id) WHERE meta_product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_synced_to_meta ON products_list_tool(synced_to_meta_at) WHERE synced_to_meta_at IS NOT NULL;

