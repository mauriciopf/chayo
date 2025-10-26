-- ============================================
-- ADD PAYMENT CAPABILITIES TO PRODUCTS
-- Integrates with existing payment_providers table
-- Provider-agnostic design for future flexibility
-- ============================================

-- Add payment columns to products_list_tool
ALTER TABLE products_list_tool 
ADD COLUMN IF NOT EXISTS payment_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_provider_id UUID REFERENCES payment_providers(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_products_payment_provider ON products_list_tool(payment_provider_id) WHERE payment_enabled = TRUE;

-- Add comments
COMMENT ON COLUMN products_list_tool.payment_enabled IS 'Whether this product can be purchased with online payment';
COMMENT ON COLUMN products_list_tool.payment_provider_id IS 'Reference to payment provider (agnostic: Stripe, PayPal, Square, or any future provider)';

-- Create function to get products with payment info (provider-agnostic)
CREATE OR REPLACE FUNCTION get_products_with_payment_info(org_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price NUMERIC,
  image_url TEXT,
  supports_reservations BOOLEAN,
  payment_enabled BOOLEAN,
  payment_provider_id UUID,
  provider_type TEXT,
  provider_is_active BOOLEAN,
  shareable_link TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.image_url,
    p.supports_reservations,
    p.payment_enabled,
    p.payment_provider_id,
    pp.provider_type,
    pp.is_active as provider_is_active,
    sl.full_url as shareable_link,
    p.created_at,
    p.updated_at
  FROM products_list_tool p
  LEFT JOIN payment_providers pp ON p.payment_provider_id = pp.id
  LEFT JOIN shareable_links sl ON sl.content_id = p.id AND sl.content_type = 'product' AND sl.is_active = TRUE
  WHERE p.organization_id = org_id
  ORDER BY p.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_products_with_payment_info(UUID) TO authenticated;

-- Add trigger to auto-enable payment on products when provider is set
CREATE OR REPLACE FUNCTION auto_enable_payment_on_product()
RETURNS TRIGGER AS $$
BEGIN
  -- If payment_provider_id is being set (not null), automatically enable payments
  IF NEW.payment_provider_id IS NOT NULL AND (OLD.payment_provider_id IS NULL OR OLD.payment_provider_id != NEW.payment_provider_id) THEN
    NEW.payment_enabled := TRUE;
  END IF;
  
  -- If payment_provider_id is being removed, disable payments
  IF NEW.payment_provider_id IS NULL AND OLD.payment_provider_id IS NOT NULL THEN
    NEW.payment_enabled := FALSE;
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

-- Also handle INSERT case
CREATE OR REPLACE FUNCTION auto_enable_payment_on_product_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- If payment_provider_id is set on insert, automatically enable payments
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
  payment_enabled_products INTEGER;
  total_providers INTEGER;
  provider_types TEXT;
BEGIN
  SELECT COUNT(*) INTO total_products FROM products_list_tool;
  SELECT COUNT(*) INTO payment_enabled_products FROM products_list_tool WHERE payment_enabled = TRUE;
  SELECT COUNT(*) INTO total_providers FROM payment_providers;
  SELECT STRING_AGG(DISTINCT provider_type, ', ') INTO provider_types FROM payment_providers;
  
  RAISE NOTICE '=== PAYMENT INTEGRATION SUMMARY ===';
  RAISE NOTICE 'Total products: %', total_products;
  RAISE NOTICE 'Payment-enabled products: %', payment_enabled_products;
  RAISE NOTICE 'Available payment providers: % (%)', total_providers, COALESCE(provider_types, 'none');
  RAISE NOTICE 'Products can now accept payments through any configured provider!';
END $$;

