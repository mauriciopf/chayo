-- Add website scraping state to organizations table
-- This tracks whether we've offered/completed website scraping for each organization

ALTER TABLE organizations 
ADD COLUMN website_scraping_state TEXT CHECK (website_scraping_state IN ('offered', 'completed', 'skipped')) DEFAULT NULL;

-- Add index for performance
CREATE INDEX idx_organizations_website_scraping_state ON organizations(website_scraping_state);

-- Add comment for documentation
COMMENT ON COLUMN organizations.website_scraping_state IS 'Tracks website scraping flow state: offered, completed, skipped';