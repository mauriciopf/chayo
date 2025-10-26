-- ============================================
-- REGENERATE ORGANIZATION SLUGS FROM BUSINESS NAMES
-- Makes slugs human-readable instead of random UUIDs
-- ============================================
-- Purpose: Update all organization slugs to be based on their business names
-- This makes URLs more readable and brand-friendly:
-- BEFORE: https://chayo.onelink.me/SB63?deep_link_value=org-933c3a9698f64d8ea1b6ef7fc36b42ee
-- AFTER:  https://chayo.onelink.me/SB63?deep_link_value=barberia-lopez

-- Function to slugify text (handles accents, special chars, spaces)
CREATE OR REPLACE FUNCTION slugify_text(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- First, trim and lowercase
  result := lower(trim(text_input));
  
  -- Remove accents using unaccent extension
  result := unaccent(result);
  
  -- Remove all special characters except spaces and hyphens
  result := regexp_replace(result, '[^a-z0-9\s-]', '', 'g');
  
  -- Replace multiple spaces with single hyphen
  result := regexp_replace(result, '\s+', '-', 'g');
  
  -- Replace multiple hyphens with single hyphen
  result := regexp_replace(result, '-+', '-', 'g');
  
  -- Remove leading/trailing hyphens
  result := regexp_replace(result, '^-+|-+$', '', 'g');
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update all organizations to have slugs based on their names
DO $$
DECLARE
  org_record RECORD;
  new_slug TEXT;
  counter INTEGER;
BEGIN
  -- Loop through all organizations
  FOR org_record IN 
    SELECT id, name, slug 
    FROM organizations
    WHERE name IS NOT NULL AND name != ''
    ORDER BY created_at ASC
  LOOP
    -- Generate base slug from organization name
    new_slug := slugify_text(org_record.name);
    
    -- Skip if slug is empty after slugification
    IF new_slug IS NULL OR new_slug = '' THEN
      RAISE NOTICE 'Skipping organization % - empty slug after processing', org_record.name;
      CONTINUE;
    END IF;
    
    -- Check if this slug already exists
    counter := 0;
    WHILE EXISTS (
      SELECT 1 FROM organizations 
      WHERE slug = new_slug 
      AND id != org_record.id
    ) LOOP
      counter := counter + 1;
      new_slug := slugify_text(org_record.name) || '-' || counter::TEXT;
      
      -- Safety check to prevent infinite loops
      IF counter > 100 THEN
        RAISE NOTICE 'Too many duplicates for %, keeping original slug', org_record.name;
        EXIT;
      END IF;
    END LOOP;
    
    -- Only update if slug is different
    IF org_record.slug != new_slug THEN
      -- Update the organization slug
      UPDATE organizations
      SET slug = new_slug,
          updated_at = NOW()
      WHERE id = org_record.id;
      
      RAISE NOTICE 'Updated organization "%" slug: % -> %', org_record.name, org_record.slug, new_slug;
    ELSE
      RAISE NOTICE 'Skipping organization "%" - slug already correct: %', org_record.name, org_record.slug;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Completed slug regeneration for all organizations';
END $$;

-- Add comment to document the change
COMMENT ON COLUMN organizations.slug IS 'Human-readable slug generated from organization name, used in deep links and URLs';

-- Show summary of changes
DO $$
DECLARE
  total_orgs INTEGER;
  readable_slugs INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_orgs FROM organizations;
  SELECT COUNT(*) INTO readable_slugs FROM organizations WHERE slug ~ '^[a-z0-9-]+$' AND slug NOT LIKE '%-%-%-%';
  
  RAISE NOTICE '=== SLUG REGENERATION SUMMARY ===';
  RAISE NOTICE 'Total organizations: %', total_orgs;
  RAISE NOTICE 'Readable slugs: %', readable_slugs;
  RAISE NOTICE 'Success rate: %%%', ROUND((readable_slugs::DECIMAL / NULLIF(total_orgs, 0)) * 100, 2);
END $$;

