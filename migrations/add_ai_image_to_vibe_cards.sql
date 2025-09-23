-- Migration: Add AI-generated image support to vibe_cards
-- This migration adds image generation capability to vibe cards

-- Add ai_generated_image_url column to vibe_cards table
ALTER TABLE vibe_cards 
ADD COLUMN IF NOT EXISTS ai_generated_image_url TEXT;

-- Add comment for the new column
COMMENT ON COLUMN vibe_cards.ai_generated_image_url IS 'URL to AI-generated image representing the business vibe and story';

-- Update the marketplace view to include the image
DROP VIEW IF EXISTS marketplace_vibe_cards;
CREATE OR REPLACE VIEW marketplace_vibe_cards AS
SELECT 
  vc.organization_id,
  o.slug,
  jsonb_build_object(
    'business_name', vc.business_name,
    'business_type', vc.business_type,
    'origin_story', vc.origin_story,
    'value_badges', vc.value_badges,
    'perfect_for', vc.perfect_for,
    'vibe_colors', vc.vibe_colors,
    'vibe_aesthetic', vc.vibe_aesthetic,
    'ai_generated_image_url', vc.ai_generated_image_url
  ) as vibe_data,
  vc.created_at,
  vc.updated_at
FROM vibe_cards vc
INNER JOIN organizations o ON vc.organization_id = o.id;

-- Grant access to the updated view
GRANT SELECT ON marketplace_vibe_cards TO authenticated;

-- Add RLS to the view
ALTER VIEW marketplace_vibe_cards SET (security_invoker = true);
