-- Migration: Add multi-payment provider support (PayPal, Square, Stripe)
-- Created: 2025-02-01
-- Description: Replaces stripe_settings with unified payment_providers table supporting multiple providers

-- 1. Create payment_providers table to replace stripe_settings
CREATE TABLE payment_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Provider identification
    provider_type TEXT NOT NULL CHECK (provider_type IN ('stripe', 'paypal', 'square')),
    provider_account_id TEXT, -- Stripe account ID, PayPal merchant ID, Square application ID
    
    -- OAuth tokens (common across providers)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    scope TEXT,
    
    -- Provider-specific settings stored as JSON
    provider_settings JSONB DEFAULT '{}',
    
    -- Payment configuration
    payment_type TEXT NOT NULL DEFAULT 'manual_price_id' CHECK (payment_type IN ('dynamic', 'manual_price_id', 'custom_ui')),
    
    -- For manual_price_id option (provider-specific product/price IDs)
    price_id TEXT, -- Stripe Price ID, PayPal plan ID, etc.
    
    -- For custom_ui option
    default_product_id TEXT,
    default_price_id TEXT,
    service_name TEXT,
    service_amount INTEGER, -- Amount in cents
    service_currency TEXT DEFAULT 'usd',
    service_type TEXT DEFAULT 'one_time' CHECK (service_type IN ('one_time', 'recurring')),
    recurring_interval TEXT CHECK (recurring_interval IN ('day', 'week', 'month', 'year')),
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Which provider to use as default
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    UNIQUE(organization_id, provider_type), -- One config per provider per org
    CHECK (NOT (is_default = true AND is_active = false)) -- Default provider must be active
);

-- 2. Create indexes
CREATE INDEX idx_payment_providers_organization_id ON payment_providers(organization_id);
CREATE INDEX idx_payment_providers_provider_type ON payment_providers(provider_type);
CREATE INDEX idx_payment_providers_active ON payment_providers(is_active);
CREATE INDEX idx_payment_providers_default ON payment_providers(is_default);

-- 3. Create function to ensure only one default provider per organization
CREATE OR REPLACE FUNCTION ensure_single_default_provider()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a provider as default, unset all other defaults for this organization
    IF NEW.is_default = true THEN
        UPDATE payment_providers 
        SET is_default = false 
        WHERE organization_id = NEW.organization_id 
        AND id != NEW.id 
        AND is_default = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for default provider enforcement
CREATE TRIGGER trigger_ensure_single_default_provider
    BEFORE INSERT OR UPDATE ON payment_providers
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_provider();

-- 5. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_payment_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create updated_at trigger
CREATE TRIGGER trigger_payment_providers_updated_at
    BEFORE UPDATE ON payment_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_providers_updated_at();

-- 7. Update payment_transactions table to support multiple providers
ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_stripe_settings_id_fkey;
ALTER TABLE payment_transactions DROP COLUMN IF EXISTS stripe_settings_id;

-- Add new columns for multi-provider support
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS payment_provider_id UUID REFERENCES payment_providers(id) ON DELETE CASCADE;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS provider_type TEXT CHECK (provider_type IN ('stripe', 'paypal', 'square'));
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS provider_transaction_id TEXT; -- Stripe payment intent, PayPal invoice ID, Square payment ID
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS provider_link_id TEXT; -- Payment link ID from each provider

-- Update existing columns to be more generic
ALTER TABLE payment_transactions RENAME COLUMN stripe_payment_link_id TO payment_link_id;
ALTER TABLE payment_transactions RENAME COLUMN stripe_checkout_session_id TO checkout_session_id;
ALTER TABLE payment_transactions RENAME COLUMN stripe_payment_intent_id TO payment_intent_id;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_provider_id ON payment_transactions(payment_provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_type ON payment_transactions(provider_type);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_transaction_id ON payment_transactions(provider_transaction_id);

-- 8. Migrate existing stripe_settings data to payment_providers
INSERT INTO payment_providers (
    organization_id,
    provider_type,
    provider_account_id,
    access_token,
    refresh_token,
    provider_settings,
    payment_type,
    price_id,
    default_product_id,
    default_price_id,
    service_name,
    service_amount,
    service_currency,
    service_type,
    recurring_interval,
    is_active,
    is_default,
    created_at,
    updated_at
)
SELECT 
    organization_id,
    'stripe'::TEXT,
    stripe_user_id,
    access_token,
    refresh_token,
    COALESCE(settings, '{}'),
    payment_type,
    price_id,
    default_product_id,
    default_price_id,
    service_name,
    service_amount,
    service_currency,
    service_type,
    recurring_interval,
    is_active,
    is_active, -- Only set as default if provider is active
    created_at,
    updated_at
FROM stripe_settings
WHERE NOT EXISTS (
    SELECT 1 FROM payment_providers pp 
    WHERE pp.organization_id = stripe_settings.organization_id 
    AND pp.provider_type = 'stripe'
);

-- 9. Update payment_transactions to reference new payment_providers
UPDATE payment_transactions pt
SET 
    payment_provider_id = pp.id,
    provider_type = 'stripe'
FROM payment_providers pp, stripe_settings ss
WHERE pt.organization_id = pp.organization_id
    AND pp.provider_type = 'stripe'
    AND ss.organization_id = pp.organization_id
    AND pt.payment_provider_id IS NULL;

-- 10. Create helper functions for multi-provider support
CREATE OR REPLACE FUNCTION get_organization_payment_providers(org_id UUID)
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    provider_type TEXT,
    provider_account_id TEXT,
    payment_type TEXT,
    price_id TEXT,
    service_name TEXT,
    service_amount INTEGER,
    service_currency TEXT,
    service_type TEXT,
    is_active BOOLEAN,
    is_default BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.id,
        pp.organization_id,
        pp.provider_type,
        pp.provider_account_id,
        pp.payment_type,
        pp.price_id,
        pp.service_name,
        pp.service_amount,
        pp.service_currency,
        pp.service_type,
        pp.is_active,
        pp.is_default
    FROM payment_providers pp
    WHERE pp.organization_id = org_id
    ORDER BY pp.is_default DESC, pp.provider_type;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_default_payment_provider(org_id UUID)
RETURNS TABLE (
    id UUID,
    provider_type TEXT,
    provider_account_id TEXT,
    access_token TEXT,
    payment_type TEXT,
    price_id TEXT,
    service_name TEXT,
    service_amount INTEGER,
    service_currency TEXT,
    service_type TEXT,
    provider_settings JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.id,
        pp.provider_type,
        pp.provider_account_id,
        pp.access_token,
        pp.payment_type,
        pp.price_id,
        pp.service_name,
        pp.service_amount,
        pp.service_currency,
        pp.service_type,
        pp.provider_settings
    FROM payment_providers pp
    WHERE pp.organization_id = org_id 
        AND pp.is_active = true 
        AND pp.is_default = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 11. Update agent_tools constraint checking function for new payment system
CREATE OR REPLACE FUNCTION check_payment_provider_constraints(org_id UUID)
RETURNS JSONB AS $$
DECLARE
    has_active_provider BOOLEAN;
    default_provider_info RECORD;
    result JSONB;
BEGIN
    -- Check if organization has any active payment provider
    SELECT EXISTS(
        SELECT 1 FROM payment_providers 
        WHERE organization_id = org_id 
        AND is_active = true
    ) INTO has_active_provider;
    
    IF NOT has_active_provider THEN
        result := jsonb_build_object(
            'can_enable', false,
            'reason', 'no_provider_configured',
            'missing_config', jsonb_build_array('payment_provider')
        );
        RETURN result;
    END IF;
    
    -- Get default provider details
    SELECT * INTO default_provider_info
    FROM get_default_payment_provider(org_id)
    LIMIT 1;
    
    IF default_provider_info IS NULL THEN
        result := jsonb_build_object(
            'can_enable', false,
            'reason', 'no_default_provider',
            'missing_config', jsonb_build_array('default_payment_provider')
        );
        RETURN result;
    END IF;
    
    -- Check payment configuration based on payment type
    IF default_provider_info.payment_type = 'manual_price_id' AND 
       (default_provider_info.price_id IS NULL OR default_provider_info.price_id = '') THEN
        result := jsonb_build_object(
            'can_enable', false,
            'reason', 'missing_price_id',
            'missing_config', jsonb_build_array('price_id')
        );
        RETURN result;
    END IF;
    
    IF default_provider_info.payment_type = 'custom_ui' AND 
       (default_provider_info.service_name IS NULL OR default_provider_info.service_name = '' OR
        default_provider_info.service_amount IS NULL OR default_provider_info.service_amount <= 0) THEN
        result := jsonb_build_object(
            'can_enable', false,
            'reason', 'incomplete_service_config',
            'missing_config', jsonb_build_array('service_name', 'service_amount')
        );
        RETURN result;
    END IF;
    
    -- All checks passed
    result := jsonb_build_object(
        'can_enable', true,
        'provider_type', default_provider_info.provider_type,
        'payment_type', default_provider_info.payment_type
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 12. Grant permissions
GRANT ALL ON payment_providers TO authenticated;
GRANT ALL ON payment_providers TO anon;

-- 13. Clean up - Drop stripe_settings table (data already migrated)
DROP TABLE IF EXISTS stripe_settings CASCADE;

-- 14. Add comments for documentation
COMMENT ON TABLE payment_providers IS 'Multi-provider payment configuration supporting Stripe, PayPal, and Square';
COMMENT ON COLUMN payment_providers.provider_type IS 'Payment provider: stripe, paypal, or square';
COMMENT ON COLUMN payment_providers.provider_settings IS 'Provider-specific settings stored as JSON (webhooks, sandbox mode, etc.)';
COMMENT ON COLUMN payment_providers.is_default IS 'Whether this provider is the default for new payment links';