-- AI Offers System Database Schema
-- Creates comprehensive offers system with AI banner generation and per-user activation

-- 1. Create offers table
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Offer Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    offer_type VARCHAR(20) NOT NULL CHECK (offer_type IN ('percentage', 'fixed_amount')),
    offer_value DECIMAL(10,2) NOT NULL, -- percentage (0-100) or fixed dollar amount
    
    -- Dates
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'expired')),
    
    -- AI Generated Banner
    ai_banner_url TEXT, -- URL to generated banner image
    ai_banner_prompt TEXT, -- Store the prompt used for regeneration
    banner_generated_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_offer_value CHECK (
        (offer_type = 'percentage' AND offer_value > 0 AND offer_value <= 100) OR
        (offer_type = 'fixed_amount' AND offer_value > 0)
    ),
    CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- 2. Add discounted_price column to products_list_tool table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products_list_tool') THEN
        ALTER TABLE products_list_tool 
        ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS has_active_offer BOOLEAN DEFAULT FALSE;
    ELSE
        RAISE NOTICE 'products_list_tool table does not exist, skipping column additions';
    END IF;
END $$;

-- 3. Create product_offers junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS product_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products_list_tool(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate assignments
    UNIQUE(product_id, offer_id)
);

-- 4. Create user_offer_activations table (per-user offer activation tracking)
CREATE TABLE IF NOT EXISTS user_offer_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Activation details
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata for analytics (future use)
    activation_source VARCHAR(50) DEFAULT 'mobile_app', -- mobile_app, web, etc.
    
    -- Constraints
    UNIQUE(user_id, offer_id), -- One activation per user per offer
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_offers_organization_id ON offers(organization_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_dates ON offers(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_product_offers_product_id ON product_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_offers_offer_id ON product_offers(offer_id);
CREATE INDEX IF NOT EXISTS idx_user_offer_activations_user_id ON user_offer_activations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_offer_activations_offer_id ON user_offer_activations(offer_id);
CREATE INDEX IF NOT EXISTS idx_user_offer_activations_org_id ON user_offer_activations(organization_id);

-- 6. Create function to automatically expire offers
CREATE OR REPLACE FUNCTION expire_offers()
RETURNS TRIGGER AS $$
BEGIN
    -- Update offers that have passed their end_date to expired status
    UPDATE offers 
    SET status = 'expired', updated_at = NOW()
    WHERE end_date < NOW() AND status = 'active';
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to auto-expire offers (runs daily)
-- Note: This would typically be handled by a cron job, but we'll add the function for manual use
-- DROP TRIGGER IF EXISTS trigger_expire_offers ON offers;
-- CREATE TRIGGER trigger_expire_offers
--     AFTER INSERT OR UPDATE ON offers
--     FOR EACH STATEMENT
--     EXECUTE FUNCTION expire_offers();

-- 8. Create function to calculate discounted prices
CREATE OR REPLACE FUNCTION calculate_discounted_price(
    original_price DECIMAL(10,2),
    offer_type VARCHAR(20),
    offer_value DECIMAL(10,2)
)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    IF offer_type = 'percentage' THEN
        RETURN ROUND(original_price * (1 - offer_value / 100), 2);
    ELSIF offer_type = 'fixed_amount' THEN
        RETURN GREATEST(0, original_price - offer_value);
    ELSE
        RETURN original_price;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to update product discounted prices when offer is applied
CREATE OR REPLACE FUNCTION update_product_discounted_prices(offer_uuid UUID)
RETURNS VOID AS $$
DECLARE
    offer_record RECORD;
BEGIN
    -- Get offer details
    SELECT * INTO offer_record FROM offers WHERE id = offer_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Offer not found: %', offer_uuid;
    END IF;
    
    -- Update discounted prices for all products in this offer
    UPDATE products_list_tool 
    SET 
        discounted_price = calculate_discounted_price(price, offer_record.offer_type, offer_record.offer_value),
        has_active_offer = TRUE,
        updated_at = NOW()
    WHERE id IN (
        SELECT product_id 
        FROM product_offers 
        WHERE offer_id = offer_uuid
    );
    
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to remove discounted prices when offer is deactivated
CREATE OR REPLACE FUNCTION remove_product_discounted_prices(offer_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Remove discounted prices for products in this offer
    UPDATE products_list_tool 
    SET 
        discounted_price = NULL,
        has_active_offer = FALSE,
        updated_at = NOW()
    WHERE id IN (
        SELECT product_id 
        FROM product_offers 
        WHERE offer_id = offer_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- 11. Helper functions for price calculations
CREATE OR REPLACE FUNCTION update_product_discounted_prices(offer_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Update products with discounted prices based on the offer
  UPDATE products_list_tool 
  SET 
    discounted_price = CASE 
      WHEN o.offer_type = 'percentage' THEN 
        ROUND(products_list_tool.price * (1 - o.offer_value / 100.0), 2)
      WHEN o.offer_type = 'fixed_amount' THEN 
        GREATEST(products_list_tool.price - o.offer_value, 0)
      ELSE products_list_tool.price
    END,
    has_active_offer = true,
    updated_at = NOW()
  FROM offers o
  INNER JOIN product_offers po ON po.offer_id = o.id
  WHERE 
    o.id = offer_uuid 
    AND products_list_tool.id = po.product_id
    AND o.status = 'active'
    AND products_list_tool.price IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_product_discounted_prices(offer_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Remove discounted prices for products in this offer
  UPDATE products_list_tool 
  SET 
    discounted_price = NULL,
    has_active_offer = false,
    updated_at = NOW()
  FROM product_offers po
  WHERE 
    po.offer_id = offer_uuid 
    AND products_list_tool.id = po.product_id;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically expire offers
CREATE OR REPLACE FUNCTION expire_old_offers()
RETURNS void AS $$
BEGIN
  -- Update expired offers
  UPDATE offers 
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    status = 'active' 
    AND end_date < NOW();
    
  -- Remove pricing for expired offers
  UPDATE products_list_tool 
  SET 
    discounted_price = NULL,
    has_active_offer = false,
    updated_at = NOW()
  WHERE 
    id IN (
      SELECT DISTINCT po.product_id 
      FROM product_offers po
      INNER JOIN offers o ON o.id = po.offer_id
      WHERE o.status = 'expired' AND o.updated_at >= NOW() - INTERVAL '1 minute'
    );
END;
$$ LANGUAGE plpgsql;

-- 12. RLS DISABLED - No Row Level Security for easier management
-- ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_offers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_offer_activations ENABLE ROW LEVEL SECURITY;

-- 12. RLS policies DISABLED for production simplicity
-- Access control is handled at the application level
-- No RLS policies needed since RLS is disabled

-- 13. Grant permissions (optional - Supabase handles this automatically)
-- GRANT ALL ON offers TO authenticated;
-- GRANT ALL ON product_offers TO authenticated;
-- GRANT ALL ON user_offer_activations TO authenticated;

-- 14. Create updated_at trigger for offers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_offers_updated_at 
    BEFORE UPDATE ON offers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_offer_activations_updated_at 
    BEFORE UPDATE ON user_offer_activations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 15. Insert sample data (optional - remove in production)
-- This is just for testing purposes
/*
INSERT INTO offers (organization_id, name, description, offer_type, offer_value, start_date, end_date, status)
VALUES (
    (SELECT id FROM organizations LIMIT 1),
    'Summer Sale 2024',
    'Get 20% off on all products this summer!',
    'percentage',
    20.00,
    NOW(),
    NOW() + INTERVAL '30 days',
    'active'
);
*/

COMMENT ON TABLE offers IS 'Stores promotional offers with AI-generated banners';
COMMENT ON TABLE product_offers IS 'Junction table linking products to offers (many-to-many)';
COMMENT ON TABLE user_offer_activations IS 'Tracks per-user offer activations for personalized pricing';
COMMENT ON COLUMN offers.ai_banner_url IS 'URL to AI-generated promotional banner image';
COMMENT ON COLUMN offers.ai_banner_prompt IS 'Prompt used to generate banner (for regeneration)';
COMMENT ON COLUMN products_list_tool.discounted_price IS 'Price after applying active offers';
COMMENT ON COLUMN products_list_tool.has_active_offer IS 'Quick flag to check if product has any active offers';
