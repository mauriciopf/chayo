-- Re-add payment_enabled column to products_list_tool
-- This represents the user's explicit choice to enable online payments via checkbox

-- Drop dependent view first to avoid constraint issues
DROP VIEW IF EXISTS products_with_payment_info;

-- Add the column back
ALTER TABLE products_list_tool 
ADD COLUMN IF NOT EXISTS payment_enabled BOOLEAN DEFAULT FALSE;

-- Set payment_enabled = TRUE for products that already have payment links
UPDATE products_list_tool 
SET payment_enabled = TRUE 
WHERE payment_link_url IS NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_products_payment_enabled 
ON products_list_tool(payment_enabled) 
WHERE payment_enabled = TRUE;

-- Add comment
COMMENT ON COLUMN products_list_tool.payment_enabled IS 'User-controlled flag: whether "Habilitar Pago Online" checkbox is checked';

-- Recreate the products_with_payment_info view
CREATE VIEW products_with_payment_info AS
SELECT 
    p.id,
    p.organization_id,
    p.name,
    p.description,
    p.price,
    p.discounted_price,
    p.has_active_offer,
    p.image_url,
    p.payment_enabled,      -- User's checkbox: "Habilitar Pago Online"
    p.payment_provider_id,  -- Which provider (null = not configured)
    p.payment_link_url,     -- Generated link (null = not generated yet)
    pp.provider_type,       -- stripe, paypal, mercadopago (null if no provider)
    p.created_at,
    p.updated_at
FROM products_list_tool p
LEFT JOIN payment_providers pp ON p.payment_provider_id = pp.id;

