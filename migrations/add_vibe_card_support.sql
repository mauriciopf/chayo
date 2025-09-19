-- Migration: Add Vibe Card Support to Setup Completion
-- This migration adds minimal support for tracking vibe card creation
-- Note: business_info_fields table is NOT modified - it already supports all needed field types

-- Add vibe_card_created flag to setup_completion to track when vibe card is generated
ALTER TABLE setup_completion 
ADD COLUMN IF NOT EXISTS vibe_card_created BOOLEAN DEFAULT FALSE;

-- Add index for setup completion filtering
CREATE INDEX IF NOT EXISTS idx_setup_completion_status_created 
ON setup_completion(setup_status, vibe_card_created, completed_at) 
WHERE setup_status = 'completed';

-- Update comment to clarify completion_data is for metadata, not vibe card display data
COMMENT ON COLUMN setup_completion.completion_data IS 'Stores onboarding metadata and completion info. Vibe card display data is stored in vibe_cards table.';

-- ARCHITECTURE NOTES:
-- 1. business_info_fields: Raw onboarding Q&A data (unchanged)
-- 2. vibe_cards: AI-enhanced marketplace data (new table in separate migration)
-- 3. setup_completion: Tracks completion status with vibe_card_created flag

-- Example of vibe card data structure that will be stored in completion_data:
/*
{
  "business_name": "Luna's Healing Garden",
  "business_type": "Wellness Spa",
  "origin_story": "Started in my grandmother's garden, inspired by her natural healing wisdom...",
  "value_badges": ["Sustainable", "Family-owned", "Local", "Organic"],
  "personality_traits": ["Nurturing", "Authentic", "Peaceful", "Holistic"],
  "vibe_colors": {
    "primary": "#8B7355",
    "secondary": "#A8956F", 
    "accent": "#E6D7C3"
  },
  "vibe_aesthetic": "Earthy-boho",
  "why_different": "We blend ancient wisdom with modern wellness techniques...",
  "perfect_for": ["Stressed professionals", "Health-conscious individuals", "Natural wellness seekers"],
  "customer_love": "Clients say we create a sanctuary where they can truly heal and reconnect..."
}
*/
