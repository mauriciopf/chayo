-- Clean Payment System Migration
DROP VIEW IF EXISTS products_with_payment_info CASCADE;

ALTER TABLE products_list_tool ADD COLUMN IF NOT EXISTS payment_link_url TEXT;
ALTER TABLE products_list_tool ADD COLUMN IF NOT EXISTS payment_provider_id UUID REFERENCES payment_providers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_payment_provider ON products_list_tool(payment_provider_id);

-- Migrate data: For products with payment_enabled=true, set provider from organization default
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products_list_tool' AND column_name = 'payment_enabled') THEN
        UPDATE products_list_tool p
        SET payment_provider_id = (
            SELECT pp.id FROM payment_providers pp
            WHERE pp.organization_id = p.organization_id AND pp.is_active = true AND pp.is_default = true
            LIMIT 1
        )
        WHERE payment_enabled = true AND payment_provider_id IS NULL;
    END IF;
END $$;

ALTER TABLE products_list_tool DROP COLUMN IF EXISTS payment_enabled CASCADE;
ALTER TABLE products_list_tool DROP COLUMN IF EXISTS payment_link_id CASCADE;
ALTER TABLE products_list_tool DROP COLUMN IF EXISTS payment_transaction_id CASCADE;

CREATE OR REPLACE VIEW products_with_payment_info AS
SELECT 
    p.*,
    pp.provider_type,
    pp.is_active as provider_is_active,
    (p.payment_link_url IS NOT NULL) as payment_enabled
FROM products_list_tool p
LEFT JOIN payment_providers pp ON p.payment_provider_id = pp.id;

UPDATE products_list_tool SET payment_link_url = NULL, payment_provider_id = NULL
WHERE payment_provider_id IN (SELECT id FROM payment_providers WHERE is_active = false);

