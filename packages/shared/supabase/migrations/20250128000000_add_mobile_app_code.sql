-- Add mobile_app_code column to organizations table
-- This will be a 6-digit code for easy mobile app entry

-- Add the column
ALTER TABLE organizations 
ADD COLUMN mobile_app_code VARCHAR(6) UNIQUE;

-- Create index for fast lookups
CREATE INDEX idx_organizations_mobile_app_code ON organizations(mobile_app_code);

-- Add comment explaining the column
COMMENT ON COLUMN organizations.mobile_app_code IS '6-digit code for mobile app access - easy for users to enter manually';

-- Function to generate a unique 6-digit mobile app code
CREATE OR REPLACE FUNCTION generate_unique_mobile_app_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    new_code VARCHAR(6);
    code_exists BOOLEAN;
    attempts INTEGER := 0;
    max_attempts INTEGER := 50;
BEGIN
    LOOP
        -- Generate random 6-digit code
        new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- Check if code already exists
        SELECT EXISTS(
            SELECT 1 FROM organizations 
            WHERE mobile_app_code = new_code
        ) INTO code_exists;
        
        -- If code doesn't exist, return it
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
        
        -- Increment attempts and check limit
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Could not generate unique mobile app code after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update existing organizations to have mobile app codes
UPDATE organizations 
SET mobile_app_code = generate_unique_mobile_app_code()
WHERE mobile_app_code IS NULL;

-- Make mobile_app_code NOT NULL since all existing orgs now have codes
ALTER TABLE organizations 
ALTER COLUMN mobile_app_code SET NOT NULL;
