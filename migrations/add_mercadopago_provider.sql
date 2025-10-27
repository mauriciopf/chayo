-- Migration: Add Mercado Pago as payment provider
-- Created: 2025-10-27
-- Description: Adds mercadopago to provider_type enum and removes square

-- 1. Update payment_providers table to support mercadopago
-- Drop the existing CHECK constraint
ALTER TABLE payment_providers DROP CONSTRAINT IF EXISTS payment_providers_provider_type_check;

-- Add new CHECK constraint with mercadopago, removing square
ALTER TABLE payment_providers ADD CONSTRAINT payment_providers_provider_type_check 
    CHECK (provider_type IN ('stripe', 'paypal', 'mercadopago'));

-- 2. Update payment_transactions table provider_type constraint
ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_provider_type_check;

ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_provider_type_check 
    CHECK (provider_type IN ('stripe', 'paypal', 'mercadopago'));

-- 3. Migrate any existing square providers to be inactive (in case they exist)
UPDATE payment_providers 
SET is_active = false 
WHERE provider_type = 'square';

-- 4. Add comments for documentation
COMMENT ON CONSTRAINT payment_providers_provider_type_check ON payment_providers IS 
    'Supported payment providers: stripe (global), paypal (global), mercadopago (Latin America)';

-- Note: Square has been removed in favor of Mercado Pago for better Latin America coverage

