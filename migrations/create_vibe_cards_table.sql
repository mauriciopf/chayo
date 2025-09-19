-- Migration: Create Vibe Cards Table
-- This migration creates a dedicated table for AI-enhanced vibe card data

-- Create vibe_cards table for processed marketplace data
CREATE TABLE IF NOT EXISTS vibe_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Core Business Info
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  
  -- Vibe Elements (AI-enhanced)
  origin_story TEXT NOT NULL,
  value_badges JSONB DEFAULT '[]'::jsonb, -- Array of strings
  personality_traits JSONB DEFAULT '[]'::jsonb, -- Array of strings
  
  -- Visual Vibe (AI-generated)
  vibe_colors JSONB NOT NULL DEFAULT '{
    "primary": "#8B7355",
    "secondary": "#A8956F", 
    "accent": "#E6D7C3"
  }'::jsonb,
  vibe_aesthetic TEXT DEFAULT 'Boho-chic',
  
  -- Connection Elements (AI-enhanced)
  why_different TEXT NOT NULL,
  perfect_for JSONB DEFAULT '[]'::jsonb, -- Array of strings
  
  -- Social Proof (AI-generated)
  customer_love TEXT NOT NULL,
  
  -- Optional fields
  location TEXT,
  website TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one vibe card per organization
  UNIQUE(organization_id)
);

-- Enable RLS for vibe_cards
ALTER TABLE vibe_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vibe_cards
DROP POLICY IF EXISTS "Users can view their own vibe cards" ON vibe_cards;
CREATE POLICY "Users can view their own vibe cards" ON vibe_cards
  FOR SELECT USING (
    organization_id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
  );

DROP POLICY IF EXISTS "Users can insert their own vibe cards" ON vibe_cards;
CREATE POLICY "Users can insert their own vibe cards" ON vibe_cards
  FOR INSERT WITH CHECK (
    organization_id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
  );

DROP POLICY IF EXISTS "Users can update their own vibe cards" ON vibe_cards;
CREATE POLICY "Users can update their own vibe cards" ON vibe_cards
  FOR UPDATE USING (
    organization_id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vibe_cards_organization_id ON vibe_cards(organization_id);
CREATE INDEX IF NOT EXISTS idx_vibe_cards_business_type ON vibe_cards(business_type);
CREATE INDEX IF NOT EXISTS idx_vibe_cards_created_at ON vibe_cards(created_at DESC);

-- Create GIN indexes for JSONB fields (for filtering)
CREATE INDEX IF NOT EXISTS idx_vibe_cards_value_badges ON vibe_cards USING GIN (value_badges);
CREATE INDEX IF NOT EXISTS idx_vibe_cards_personality_traits ON vibe_cards USING GIN (personality_traits);
CREATE INDEX IF NOT EXISTS idx_vibe_cards_perfect_for ON vibe_cards USING GIN (perfect_for);

-- Create full-text search index for marketplace search
CREATE INDEX IF NOT EXISTS idx_vibe_cards_search ON vibe_cards USING GIN (
  to_tsvector('english', 
    business_name || ' ' || 
    business_type || ' ' || 
    origin_story || ' ' || 
    why_different || ' ' || 
    customer_love || ' ' || 
    COALESCE(location, '')
  )
);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_vibe_cards_updated_at ON vibe_cards;
CREATE TRIGGER update_vibe_cards_updated_at 
  BEFORE UPDATE ON vibe_cards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON vibe_cards TO authenticated;

-- Add comments
COMMENT ON TABLE vibe_cards IS 'Stores AI-enhanced vibe card data for marketplace display';
COMMENT ON COLUMN vibe_cards.value_badges IS 'Array of value propositions like ["Sustainable", "Local", "Artisan"]';
COMMENT ON COLUMN vibe_cards.personality_traits IS 'Array of personality traits like ["Warm", "Creative", "Authentic"]';
COMMENT ON COLUMN vibe_cards.perfect_for IS 'Array of ideal customer types like ["Busy professionals", "Health-conscious families"]';
COMMENT ON COLUMN vibe_cards.vibe_colors IS 'JSON object with primary, secondary, and accent colors';

-- Create view for marketplace API
CREATE OR REPLACE VIEW marketplace_vibe_cards AS
SELECT 
  vc.organization_id,
  o.slug,
  vc.business_name,
  vc.business_type,
  vc.origin_story,
  vc.value_badges,
  vc.personality_traits,
  vc.vibe_colors,
  vc.vibe_aesthetic,
  vc.why_different,
  vc.perfect_for,
  vc.customer_love,
  vc.location,
  vc.website,
  vc.contact_phone,
  vc.contact_email,
  vc.created_at,
  vc.updated_at
FROM vibe_cards vc
INNER JOIN organizations o ON vc.organization_id = o.id
WHERE o.active = true;

-- Grant access to the view
GRANT SELECT ON marketplace_vibe_cards TO authenticated;

-- Add RLS to the view
ALTER VIEW marketplace_vibe_cards SET (security_invoker = true);
