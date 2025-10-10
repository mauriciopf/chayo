-- Migration: Add supports_reservations to products_list_tool
-- Created: 2025-02-10
-- Description: Adds a boolean flag to products to indicate if they support reservations

BEGIN;

-- ============================================================================
-- 1. ADD supports_reservations COLUMN TO products_list_tool
-- ============================================================================
ALTER TABLE products_list_tool
ADD COLUMN IF NOT EXISTS supports_reservations BOOLEAN DEFAULT false;

-- ============================================================================
-- 2. ADD INDEX FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_supports_reservations 
ON products_list_tool(organization_id, supports_reservations);

-- ============================================================================
-- 3. UPDATE EXISTING PRODUCTS (OPTIONAL)
-- ============================================================================
-- If you want to enable reservations for all existing products, uncomment:
-- UPDATE products_list_tool SET supports_reservations = true;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Update web product management UI to show "Supports Reservations" toggle
-- 2. Update mobile/web ProductDetailScreen to only show "Reservar" if supports_reservations = true
-- 3. Update reservation API to validate product supports reservations before booking
-- ============================================================================

