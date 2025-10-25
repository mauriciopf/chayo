-- ============================================
-- CENTRALIZED SHAREABLE LINKS TABLE
-- Better approach for link management & analytics
-- ============================================

-- Ensure unaccent extension is available for slug generation
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Drop old columns (if migration already ran)
ALTER TABLE products_list_tool DROP COLUMN IF EXISTS shareable_link;
ALTER TABLE intake_forms DROP COLUMN IF EXISTS shareable_link;
ALTER TABLE agent_document_tool DROP COLUMN IF EXISTS shareable_link;

-- Create content type enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type_enum') THEN
    CREATE TYPE content_type_enum AS ENUM (
      'product',
      'form',
      'document',
      'reservation',
      'payment',
      'chat',
      'support'
    );
  END IF;
END $$;

-- Create centralized shareable links table
CREATE TABLE IF NOT EXISTS shareable_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Polymorphic reference to content
  content_type content_type_enum NOT NULL,
  content_id UUID NOT NULL,
  
  -- Link details
  slug TEXT NOT NULL,
  full_url TEXT NOT NULL,
  short_code TEXT UNIQUE, -- For future short URLs (e.g., chayo.ai/abc123)
  
  -- Analytics
  clicks INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one link per content item
  UNIQUE(content_type, content_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shareable_links_organization ON shareable_links(organization_id);
CREATE INDEX IF NOT EXISTS idx_shareable_links_content ON shareable_links(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_shareable_links_slug ON shareable_links(slug);
CREATE INDEX IF NOT EXISTS idx_shareable_links_short_code ON shareable_links(short_code) WHERE short_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shareable_links_active ON shareable_links(is_active) WHERE is_active = TRUE;

-- Disable RLS (no policies needed)
ALTER TABLE shareable_links DISABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate slug from text
CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        unaccent(text_input),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Generate full AppsFlyer OneLink
CREATE OR REPLACE FUNCTION generate_onelink(
  org_slug TEXT,
  content_type_val TEXT,
  content_slug TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN 'https://chayo.onelink.me/SB63?deep_link_value=' || org_slug || 
         '&deep_link_sub1=' || content_type_val ||
         CASE 
           WHEN content_slug IS NOT NULL AND content_slug != '' 
           THEN '&deep_link_sub2=' || content_slug
           ELSE ''
         END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Generate or update shareable link
CREATE OR REPLACE FUNCTION upsert_shareable_link(
  p_organization_id UUID,
  p_content_type content_type_enum,
  p_content_id UUID,
  p_content_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_org_slug TEXT;
  v_content_slug TEXT;
  v_full_url TEXT;
  v_link_id UUID;
BEGIN
  -- Get organization slug
  SELECT slug INTO v_org_slug
  FROM organizations
  WHERE id = p_organization_id;
  
  IF v_org_slug IS NULL THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;
  
  -- Generate content slug
  v_content_slug := generate_slug(p_content_name);
  
  -- Generate full URL
  v_full_url := generate_onelink(v_org_slug, p_content_type::TEXT, v_content_slug);
  
  -- Upsert shareable link
  INSERT INTO shareable_links (
    organization_id,
    content_type,
    content_id,
    slug,
    full_url
  ) VALUES (
    p_organization_id,
    p_content_type,
    p_content_id,
    v_content_slug,
    v_full_url
  )
  ON CONFLICT (content_type, content_id)
  DO UPDATE SET
    slug = EXCLUDED.slug,
    full_url = EXCLUDED.full_url,
    updated_at = NOW()
  RETURNING id INTO v_link_id;
  
  RETURN v_full_url;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUTO-GENERATION TRIGGERS
-- ============================================

-- Trigger function for products
CREATE OR REPLACE FUNCTION auto_generate_product_link()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM upsert_shareable_link(
    NEW.organization_id,
    'product'::content_type_enum,
    NEW.id,
    NEW.name
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for forms
CREATE OR REPLACE FUNCTION auto_generate_form_link()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM upsert_shareable_link(
    NEW.organization_id,
    'form'::content_type_enum,
    NEW.id,
    NEW.name
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for documents
CREATE OR REPLACE FUNCTION auto_generate_document_link()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM upsert_shareable_link(
    NEW.organization_id,
    'document'::content_type_enum,
    NEW.id,
    NEW.file_name
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old triggers if they exist
DROP TRIGGER IF EXISTS trigger_auto_generate_product_link ON products_list_tool;
DROP TRIGGER IF EXISTS trigger_auto_generate_form_link ON intake_forms;
DROP TRIGGER IF EXISTS trigger_auto_generate_document_link ON agent_document_tool;

-- Create new triggers (only fire on INSERT or UPDATE of name/file_name)
CREATE TRIGGER trigger_auto_generate_product_link
  AFTER INSERT OR UPDATE OF name ON products_list_tool
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_product_link();

CREATE TRIGGER trigger_auto_generate_form_link
  AFTER INSERT OR UPDATE OF name ON intake_forms
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_form_link();

CREATE TRIGGER trigger_auto_generate_document_link
  AFTER INSERT OR UPDATE OF file_name ON agent_document_tool
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_document_link();

-- ============================================
-- BACKFILL EXISTING CONTENT
-- ============================================

-- Backfill products
INSERT INTO shareable_links (organization_id, content_type, content_id, slug, full_url)
SELECT 
  p.organization_id,
  'product'::content_type_enum,
  p.id,
  generate_slug(p.name),
  generate_onelink(
    (SELECT slug FROM organizations WHERE id = p.organization_id),
    'product',
    generate_slug(p.name)
  )
FROM products_list_tool p
ON CONFLICT (content_type, content_id) DO NOTHING;

-- Backfill forms
INSERT INTO shareable_links (organization_id, content_type, content_id, slug, full_url)
SELECT 
  f.organization_id,
  'form'::content_type_enum,
  f.id,
  generate_slug(f.name),
  generate_onelink(
    (SELECT slug FROM organizations WHERE id = f.organization_id),
    'form',
    generate_slug(f.name)
  )
FROM intake_forms f
ON CONFLICT (content_type, content_id) DO NOTHING;

-- Backfill documents
INSERT INTO shareable_links (organization_id, content_type, content_id, slug, full_url)
SELECT 
  d.organization_id,
  'document'::content_type_enum,
  d.id,
  generate_slug(d.file_name),
  generate_onelink(
    (SELECT slug FROM organizations WHERE id = d.organization_id),
    'document',
    generate_slug(d.file_name)
  )
FROM agent_document_tool d
ON CONFLICT (content_type, content_id) DO NOTHING;

-- ============================================
-- ANALYTICS HELPER VIEWS
-- ============================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS v_shareable_links_with_content;

-- View: All links with content details
CREATE VIEW v_shareable_links_with_content AS
SELECT 
  sl.id,
  sl.organization_id,
  o.name as organization_name,
  o.slug as organization_slug,
  sl.content_type,
  sl.content_id,
  sl.slug,
  sl.full_url,
  sl.clicks,
  sl.last_clicked_at,
  sl.is_active,
  sl.expires_at,
  sl.created_at,
  -- Content details (polymorphic)
  CASE sl.content_type
    WHEN 'product' THEN (SELECT name FROM products_list_tool WHERE id = sl.content_id)
    WHEN 'form' THEN (SELECT name FROM intake_forms WHERE id = sl.content_id)
    WHEN 'document' THEN (SELECT file_name FROM agent_document_tool WHERE id = sl.content_id)
    ELSE NULL
  END as content_name,
  CASE sl.content_type
    WHEN 'product' THEN (SELECT description FROM products_list_tool WHERE id = sl.content_id)
    WHEN 'form' THEN (SELECT description FROM intake_forms WHERE id = sl.content_id)
    ELSE NULL
  END as content_description
FROM shareable_links sl
JOIN organizations o ON sl.organization_id = o.id
WHERE sl.is_active = TRUE;

-- Function to increment click count
CREATE OR REPLACE FUNCTION increment_link_clicks(p_link_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE shareable_links
  SET 
    clicks = clicks + 1,
    last_clicked_at = NOW()
  WHERE id = p_link_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE shareable_links IS 'Centralized table for all shareable deep links across content types';
COMMENT ON COLUMN shareable_links.content_type IS 'Type of content (product, form, document, etc.)';
COMMENT ON COLUMN shareable_links.content_id IS 'UUID of the actual content record';
COMMENT ON COLUMN shareable_links.slug IS 'Human-readable slug for the content';
COMMENT ON COLUMN shareable_links.full_url IS 'Complete AppsFlyer OneLink URL';
COMMENT ON COLUMN shareable_links.clicks IS 'Number of times this link has been clicked';
COMMENT ON COLUMN shareable_links.short_code IS 'Optional short code for branded short URLs';
COMMENT ON FUNCTION upsert_shareable_link(UUID, content_type_enum, UUID, TEXT) IS 'Generate or update a shareable link for any content type';
COMMENT ON FUNCTION increment_link_clicks(UUID) IS 'Increment click count and update last_clicked_at timestamp';

