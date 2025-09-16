-- Migration: Add Marketplace Features to Organizations
-- Purpose: Transform app into business marketplace with categories and discovery
-- Date: 2024-12-XX

-- Create business categories enum first (can be expanded later)
DO $$ BEGIN
    CREATE TYPE business_category AS ENUM (
        'general',
        'healthcare',
        'dental',
        'legal',
        'automotive',
        'beauty',
        'fitness',
        'restaurant',
        'retail',
        'professional_services',
        'home_services',
        'education',
        'finance',
        'real_estate',
        'technology',
        'consulting',
        'entertainment',
        'travel',
        'nonprofit',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add marketplace fields to organizations table (with proper enum type)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS category business_category DEFAULT 'general'::business_category,
ADD COLUMN IF NOT EXISTS representative_image_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Set default categories for existing businesses (you can customize these)
UPDATE organizations 
SET category = 'healthcare' 
WHERE category = 'general' AND (
    LOWER(name) LIKE '%doctor%' OR 
    LOWER(name) LIKE '%clinic%' OR 
    LOWER(name) LIKE '%medical%' OR
    LOWER(name) LIKE '%health%'
);

UPDATE organizations 
SET category = 'dental' 
WHERE category = 'general' AND (
    LOWER(name) LIKE '%dental%' OR 
    LOWER(name) LIKE '%dentist%'
);

UPDATE organizations 
SET category = 'legal' 
WHERE category = 'general' AND (
    LOWER(name) LIKE '%law%' OR 
    LOWER(name) LIKE '%legal%' OR 
    LOWER(name) LIKE '%attorney%' OR
    LOWER(name) LIKE '%lawyer%'
);

-- Add indexes for marketplace queries
CREATE INDEX IF NOT EXISTS idx_organizations_category ON organizations(category);
CREATE INDEX IF NOT EXISTS idx_organizations_featured ON organizations(featured);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(active);
CREATE INDEX IF NOT EXISTS idx_organizations_rating ON organizations(rating DESC);
CREATE INDEX IF NOT EXISTS idx_organizations_name_search ON organizations USING gin(to_tsvector('english', name));

-- Function to search businesses
CREATE OR REPLACE FUNCTION search_businesses(
    search_query TEXT DEFAULT '',
    category_filter business_category DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    category business_category,
    representative_image_url TEXT,
    description TEXT,
    rating DECIMAL(3,2),
    review_count INTEGER,
    address TEXT,
    phone TEXT,
    featured BOOLEAN,
    mobile_app_code TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.slug,
        o.category,
        o.logo_url,
        o.description,
        o.rating,
        o.review_count,
        o.address,
        o.phone,
        o.featured,
        o.mobile_app_code
    FROM organizations o
    WHERE 
        o.active = true
        AND (category_filter IS NULL OR o.category = category_filter)
        AND (
            search_query = '' OR
            to_tsvector('english', o.name) @@ plainto_tsquery('english', search_query) OR
            LOWER(o.name) LIKE LOWER('%' || search_query || '%') OR
            LOWER(o.description) LIKE LOWER('%' || search_query || '%')
        )
    ORDER BY 
        o.featured DESC,
        o.rating DESC,
        o.review_count DESC,
        o.name ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get featured businesses
CREATE OR REPLACE FUNCTION get_featured_businesses(limit_count INTEGER DEFAULT 6)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    category business_category,
    representative_image_url TEXT,
    description TEXT,
    rating DECIMAL(3,2),
    review_count INTEGER,
    mobile_app_code TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.slug,
        o.category,
        o.logo_url,
        o.description,
        o.rating,
        o.review_count,
        o.mobile_app_code
    FROM organizations o
    WHERE o.active = true AND o.featured = true
    ORDER BY o.rating DESC, o.review_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get businesses by category
CREATE OR REPLACE FUNCTION get_businesses_by_category(
    category_name business_category,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    representative_image_url TEXT,
    description TEXT,
    rating DECIMAL(3,2),
    review_count INTEGER,
    mobile_app_code TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.slug,
        o.logo_url,
        o.description,
        o.rating,
        o.review_count,
        o.mobile_app_code
    FROM organizations o
    WHERE o.active = true AND o.category = category_name
    ORDER BY o.rating DESC, o.review_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_businesses TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_featured_businesses TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_businesses_by_category TO anon, authenticated;
