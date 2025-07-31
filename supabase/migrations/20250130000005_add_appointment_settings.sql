-- Migration: Add appointment provider settings table
-- This allows organizations to configure their appointment booking providers

-- 1. Create appointment_settings table
CREATE TABLE IF NOT EXISTS appointment_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Provider configuration
    provider TEXT NOT NULL CHECK (provider IN ('calendly', 'vagaro', 'square', 'custom')),
    provider_url TEXT NULL, -- Required for external providers, null for custom
    
    -- Additional settings (can be expanded later)
    settings JSONB DEFAULT '{}' NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Unique constraint: one setting per organization
    UNIQUE(organization_id)
);

-- 2. Create indexes for performance
CREATE INDEX idx_appointment_settings_organization_id ON appointment_settings(organization_id);
CREATE INDEX idx_appointment_settings_provider ON appointment_settings(provider);

-- 3. Add helpful comments
COMMENT ON TABLE appointment_settings IS 'Stores appointment booking provider configuration for organizations';
COMMENT ON COLUMN appointment_settings.provider IS 'Appointment provider type: calendly, vagaro, square, or custom';
COMMENT ON COLUMN appointment_settings.provider_url IS 'URL for external booking providers (required for external providers)';
COMMENT ON COLUMN appointment_settings.settings IS 'Additional provider-specific settings in JSON format';