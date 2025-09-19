-- Migration: Streamline vibe_cards table to essential fields only
-- Removes columns that are not used in mobile vibe card UI

-- Step 1: Drop the existing view that depends on these columns
DROP VIEW IF EXISTS marketplace_vibe_cards;

-- Step 2: Remove non-essential columns that are not displayed in mobile marketplace
ALTER TABLE vibe_cards DROP COLUMN IF EXISTS personality_traits;
ALTER TABLE vibe_cards DROP COLUMN IF EXISTS why_different;
ALTER TABLE vibe_cards DROP COLUMN IF EXISTS customer_love;
ALTER TABLE vibe_cards DROP COLUMN IF EXISTS location;
ALTER TABLE vibe_cards DROP COLUMN IF EXISTS website;
ALTER TABLE vibe_cards DROP COLUMN IF EXISTS contact_phone;
ALTER TABLE vibe_cards DROP COLUMN IF EXISTS contact_email;

-- Step 3: Recreate the marketplace view with streamlined columns
CREATE OR REPLACE VIEW marketplace_vibe_cards AS
SELECT 
  vc.organization_id,
  o.slug,
  vc.business_name,
  vc.business_type,
  vc.origin_story,
  vc.value_badges,
  vc.perfect_for,
  vc.vibe_colors,
  vc.vibe_aesthetic,
  vc.created_at,
  vc.updated_at
FROM vibe_cards vc
INNER JOIN organizations o ON vc.organization_id = o.id
WHERE o.active = true;

-- Grant access to the updated view
GRANT SELECT ON marketplace_vibe_cards TO authenticated;

-- Add RLS to the view
ALTER VIEW marketplace_vibe_cards SET (security_invoker = true);

-- Update table comment
COMMENT ON TABLE vibe_cards IS 'Streamlined vibe card data: essential fields for mobile marketplace display';

-- Update column comments
COMMENT ON COLUMN vibe_cards.business_name IS 'Business name collected during onboarding';
COMMENT ON COLUMN vibe_cards.business_type IS 'Business type collected during onboarding';
COMMENT ON COLUMN vibe_cards.origin_story IS 'Origin story collected during onboarding, AI-enhanced';
COMMENT ON COLUMN vibe_cards.value_badges IS 'Value badges collected during onboarding';
COMMENT ON COLUMN vibe_cards.perfect_for IS 'Perfect customer types collected during onboarding';
COMMENT ON COLUMN vibe_cards.vibe_colors IS 'AI-generated color palette for vibe card';
COMMENT ON COLUMN vibe_cards.vibe_aesthetic IS 'AI-generated aesthetic classification';

SELECT 'Streamlined vibe_cards table - removed non-essential columns' as status;
