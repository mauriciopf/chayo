-- ============================================
-- CLEAN UP AND MODERNIZE PAYMENT SCHEMA
-- Remove old payment_transaction_id approach
-- Add new provider-agnostic payment link columns
-- ============================================

-- Drop old payment_transaction_id column (old approach)
ALTER TABLE products_list_tool 
DROP COLUMN IF EXISTS payment_transaction_id CASCADE;

-- Add new payment columns (provider-agnostic)
ALTER TABLE products_list_tool 
ADD COLUMN IF NOT EXISTS payment_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_provider_id UUID REFERENCES payment_providers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_link_url TEXT,
ADD COLUMN IF NOT EXISTS payment_link_id TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_products_payment_provider 
  ON products_list_tool(payment_provider_id) 
  WHERE payment_enabled = TRUE;

-- Add comments explaining the new approach
COMMENT ON COLUMN products_list_tool.payment_enabled IS 'Whether online payment is enabled for this product';
COMMENT ON COLUMN products_list_tool.payment_provider_id IS 'Reference to configured payment provider (Mercado Pago, Stripe, or PayPal)';
COMMENT ON COLUMN products_list_tool.payment_link_url IS 'Auto-generated payment link URL from the provider (e.g., Mercado Pago init_point, Stripe Payment Link, PayPal approval URL)';
COMMENT ON COLUMN products_list_tool.payment_link_id IS 'Provider-specific payment link ID for tracking and management';

-- Create view for products with payment info
CREATE OR REPLACE VIEW products_with_payment_info AS
SELECT 
  p.id,
  p.organization_id,
  p.name,
  p.description,
  p.price,
  p.image_url,
  p.supports_reservations,
  p.payment_enabled,
  p.payment_provider_id,
  p.payment_link_url,
  p.payment_link_id,
  pp.provider_type,
  pp.is_active as provider_is_active,
  sl.full_url as shareable_link,
  p.created_at,
  p.updated_at
FROM products_list_tool p
LEFT JOIN payment_providers pp ON p.payment_provider_id = pp.id
LEFT JOIN shareable_links sl ON sl.content_id = p.id 
  AND sl.content_type = 'product' 
  AND sl.is_active = TRUE
ORDER BY p.updated_at DESC;

-- Grant access to the view
GRANT SELECT ON products_with_payment_info TO authenticated;

-- Auto-enable payments when provider is set (UPDATE)
CREATE OR REPLACE FUNCTION auto_enable_payment_on_product()
RETURNS TRIGGER AS $$
BEGIN
  -- Enable payments when provider is set
  IF NEW.payment_provider_id IS NOT NULL AND 
     (OLD.payment_provider_id IS NULL OR OLD.payment_provider_id != NEW.payment_provider_id) THEN
    NEW.payment_enabled := TRUE;
  END IF;
  
  -- Disable payments when provider is removed
  IF NEW.payment_provider_id IS NULL AND OLD.payment_provider_id IS NOT NULL THEN
    NEW.payment_enabled := FALSE;
    NEW.payment_link_url := NULL;
    NEW.payment_link_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_enable_payment_on_product ON products_list_tool;
CREATE TRIGGER trigger_auto_enable_payment_on_product
  BEFORE UPDATE OF payment_provider_id ON products_list_tool
  FOR EACH ROW
  WHEN (OLD.payment_provider_id IS DISTINCT FROM NEW.payment_provider_id)
  EXECUTE FUNCTION auto_enable_payment_on_product();

-- Auto-enable payments when provider is set (INSERT)
CREATE OR REPLACE FUNCTION auto_enable_payment_on_product_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_provider_id IS NOT NULL THEN
    NEW.payment_enabled := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_enable_payment_on_product_insert ON products_list_tool;
CREATE TRIGGER trigger_auto_enable_payment_on_product_insert
  BEFORE INSERT ON products_list_tool
  FOR EACH ROW
  WHEN (NEW.payment_provider_id IS NOT NULL)
  EXECUTE FUNCTION auto_enable_payment_on_product_insert();

-- Summary
DO $$
DECLARE
  total_products INTEGER;
  payment_enabled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_products FROM products_list_tool;
  SELECT COUNT(*) INTO payment_enabled_count FROM products_list_tool WHERE payment_enabled = TRUE;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'PAYMENT SCHEMA CLEANUP COMPLETE';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Total products: %', total_products;
  RAISE NOTICE 'Payment-enabled products: %', payment_enabled_count;
  RAISE NOTICE '';
  RAISE NOTICE 'New columns:';
  RAISE NOTICE '  - payment_enabled (BOOLEAN)';
  RAISE NOTICE '  - payment_provider_id (UUID → payment_providers)';
  RAISE NOTICE '  - payment_link_url (TEXT)';
  RAISE NOTICE '  - payment_link_id (TEXT)';
  RAISE NOTICE '';
  RAISE NOTICE 'Removed columns:';
  RAISE NOTICE '  - payment_transaction_id (old approach)';
  RAISE NOTICE '====================================';
END $$;

