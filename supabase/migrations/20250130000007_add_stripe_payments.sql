-- Create stripe_settings table for OAuth tokens and payment configuration
CREATE TABLE stripe_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Stripe OAuth tokens
    stripe_user_id TEXT, -- Stripe account ID
    access_token TEXT, -- For API calls
    refresh_token TEXT,
    scope TEXT,
    
    -- Payment configuration
    payment_type TEXT NOT NULL DEFAULT 'manual_price_id' CHECK (payment_type IN ('dynamic', 'manual_price_id', 'custom_ui')),
    
    -- For manual_price_id option
    price_id TEXT, -- Stripe Price ID (price_1ABCxyz...)
    
    -- For custom_ui option (stored products/prices created via Chayo)
    default_product_id TEXT, -- Stripe Product ID
    default_price_id TEXT, -- Stripe Price ID
    service_name TEXT, -- What service they offer
    service_amount INTEGER, -- Amount in cents
    service_currency TEXT DEFAULT 'usd',
    service_type TEXT DEFAULT 'one_time' CHECK (service_type IN ('one_time', 'recurring')),
    recurring_interval TEXT CHECK (recurring_interval IN ('day', 'week', 'month', 'year')),
    
    -- Settings and metadata
    settings JSONB DEFAULT '{}', -- Additional Stripe settings
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Unique constraint - one Stripe connection per organization
    UNIQUE(organization_id)
);

-- Add indexes for performance
CREATE INDEX idx_stripe_settings_organization_id ON stripe_settings(organization_id);
CREATE INDEX idx_stripe_settings_stripe_user_id ON stripe_settings(stripe_user_id);
CREATE INDEX idx_stripe_settings_active ON stripe_settings(is_active);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stripe_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_stripe_settings_updated_at
    BEFORE UPDATE ON stripe_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_stripe_settings_updated_at();

-- Create payment_transactions table to track payment links and transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_settings_id UUID NOT NULL REFERENCES stripe_settings(id) ON DELETE CASCADE,
    
    -- Transaction details
    stripe_payment_link_id TEXT, -- Stripe Payment Link ID
    stripe_checkout_session_id TEXT, -- Stripe Checkout Session ID (for dynamic option)
    payment_type TEXT NOT NULL CHECK (payment_type IN ('dynamic', 'manual_price_id', 'custom_ui')),
    
    -- Payment details
    amount INTEGER, -- Amount in cents
    currency TEXT DEFAULT 'usd',
    description TEXT,
    
    -- Customer info (if provided)
    customer_name TEXT,
    customer_email TEXT,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
    
    -- Stripe webhook data
    stripe_payment_intent_id TEXT,
    paid_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for payment_transactions
CREATE INDEX idx_payment_transactions_organization_id ON payment_transactions(organization_id);
CREATE INDEX idx_payment_transactions_stripe_settings_id ON payment_transactions(stripe_settings_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_stripe_payment_link_id ON payment_transactions(stripe_payment_link_id);

-- Add trigger for payment_transactions updated_at
CREATE TRIGGER trigger_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_stripe_settings_updated_at();

-- RLS policies (disabled for now to keep things simple)
-- Note: We're not enabling RLS initially to avoid complications

-- Functions for payment management
CREATE OR REPLACE FUNCTION get_organization_stripe_settings(org_id UUID)
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    stripe_user_id TEXT,
    payment_type TEXT,
    price_id TEXT,
    service_name TEXT,
    service_amount INTEGER,
    service_currency TEXT,
    service_type TEXT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.organization_id,
        s.stripe_user_id,
        s.payment_type,
        s.price_id,
        s.service_name,
        s.service_amount,
        s.service_currency,
        s.service_type,
        s.is_active
    FROM stripe_settings s
    WHERE s.organization_id = org_id AND s.is_active = true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_payment_transaction_status(
    transaction_id UUID,
    new_status TEXT,
    stripe_payment_intent_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE payment_transactions
    SET 
        status = new_status,
        stripe_payment_intent_id = COALESCE(update_payment_transaction_status.stripe_payment_intent_id, payment_transactions.stripe_payment_intent_id),
        paid_at = CASE 
            WHEN new_status = 'paid' AND paid_at IS NULL THEN now()
            ELSE paid_at
        END,
        updated_at = now()
    WHERE id = transaction_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql;