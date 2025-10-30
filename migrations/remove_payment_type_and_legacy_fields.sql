-- Migration: Remove payment_type and legacy payment fields
-- Created: 2025-01-30
-- Description: Removes unused fields from payment_providers table that were for the legacy AI agent payment system
-- Product payments always use dynamic pricing, so these fields are unnecessary

-- Drop unused columns from payment_providers table
ALTER TABLE payment_providers
DROP COLUMN IF EXISTS payment_type,
DROP COLUMN IF EXISTS price_id,
DROP COLUMN IF EXISTS default_product_id,
DROP COLUMN IF EXISTS default_price_id,
DROP COLUMN IF EXISTS service_name,
DROP COLUMN IF EXISTS service_amount,
DROP COLUMN IF EXISTS service_type,
DROP COLUMN IF EXISTS recurring_interval;

-- Add comment to table explaining its purpose
COMMENT ON TABLE payment_providers IS 'Stores OAuth credentials and settings for payment providers (Stripe, PayPal, Mercado Pago). Product prices are stored in products_list_tool table.';

