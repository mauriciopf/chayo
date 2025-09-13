-- Migration: Create Customer Authentication System
-- Purpose: Enable mobile app users to authenticate and link to organizations
-- Date: 2024-12-XX

-- Create customers table (mobile app users per organization)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  auth_provider TEXT CHECK (auth_provider IN ('google', 'apple', 'email')),
  supabase_user_id UUID, -- link to auth.users
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}', -- store additional user data from OAuth providers
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique email per organization (same person can be customer of multiple businesses)
  UNIQUE(organization_id, email)
);

-- Create customer_organization_interactions table
CREATE TABLE IF NOT EXISTS customer_organization_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tool TEXT NOT NULL CHECK (tool IN ('appointments', 'intake_forms', 'documents', 'products')),
  interaction_data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_supabase_user_id ON customers(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer_id ON customer_organization_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_organization_id ON customer_organization_interactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_tool ON customer_organization_interactions(tool);

-- Disable Row Level Security for now (can be enabled later)
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_organization_interactions DISABLE ROW LEVEL SECURITY;

-- Functions for customer management
CREATE OR REPLACE FUNCTION get_or_create_customer(
  p_organization_id UUID,
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_auth_provider TEXT DEFAULT 'email',
  p_supabase_user_id UUID DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS customers AS $$
DECLARE
  customer_record customers;
BEGIN
  -- Try to find existing customer
  SELECT * INTO customer_record
  FROM customers
  WHERE organization_id = p_organization_id AND email = p_email;
  
  -- If customer exists, update with new info and return
  IF FOUND THEN
    UPDATE customers SET
      full_name = COALESCE(p_full_name, full_name),
      phone = COALESCE(p_phone, phone),
      auth_provider = COALESCE(p_auth_provider, auth_provider),
      supabase_user_id = COALESCE(p_supabase_user_id, supabase_user_id),
      avatar_url = COALESCE(p_avatar_url, avatar_url),
      metadata = p_metadata,
      updated_at = NOW()
    WHERE id = customer_record.id
    RETURNING * INTO customer_record;
    
    RETURN customer_record;
  END IF;
  
  -- Create new customer
  INSERT INTO customers (
    organization_id,
    email,
    full_name,
    phone,
    auth_provider,
    supabase_user_id,
    avatar_url,
    metadata
  ) VALUES (
    p_organization_id,
    p_email,
    p_full_name,
    p_phone,
    p_auth_provider,
    p_supabase_user_id,
    p_avatar_url,
    p_metadata
  ) RETURNING * INTO customer_record;
  
  RETURN customer_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create customer interaction
CREATE OR REPLACE FUNCTION create_customer_interaction(
  p_customer_id UUID,
  p_organization_id UUID,
  p_tool TEXT,
  p_interaction_data JSONB DEFAULT '{}',
  p_status TEXT DEFAULT 'active'
) RETURNS customer_organization_interactions AS $$
DECLARE
  interaction_record customer_organization_interactions;
BEGIN
  INSERT INTO customer_organization_interactions (
    customer_id,
    organization_id,
    tool,
    interaction_data,
    status
  ) VALUES (
    p_customer_id,
    p_organization_id,
    p_tool,
    p_interaction_data,
    p_status
  ) RETURNING * INTO interaction_record;
  
  RETURN interaction_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON customers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON customer_organization_interactions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_customer TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_customer_interaction TO anon, authenticated;

-- Add updated_at trigger for customers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_interactions_updated_at
  BEFORE UPDATE ON customer_organization_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
