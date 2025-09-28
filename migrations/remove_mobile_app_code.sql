-- Remove mobile_app_code implementation completely
-- This fixes the OTP authentication error by removing references to the non-existent column

-- Update the create_default_organization function to NOT use mobile_app_code
CREATE OR REPLACE FUNCTION public.create_default_organization()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create the organization WITHOUT mobile_app_code
  INSERT INTO public.organizations (name, slug, owner_id)
  VALUES (
    'My Organization',
    'org-' || REPLACE(NEW.id::text, '-', ''),
    NEW.id
  )
  RETURNING id INTO new_org_id;
  
  -- Add the user as an active owner in team_members
  INSERT INTO public.team_members (organization_id, user_id, role, status)
  VALUES (new_org_id, NEW.id, 'owner', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the mobile app code generation function if it exists
DROP FUNCTION IF EXISTS public.generate_unique_mobile_app_code();

-- Drop the mobile_app_code column if it exists (this will also drop the index)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'mobile_app_code'
    ) THEN
        -- Drop the index first
        DROP INDEX IF EXISTS idx_organizations_mobile_app_code;
        
        -- Drop the column
        ALTER TABLE organizations DROP COLUMN mobile_app_code;
        
        RAISE NOTICE 'Removed mobile_app_code column and related index';
    ELSE
        RAISE NOTICE 'mobile_app_code column does not exist, nothing to remove';
    END IF;
END $$;

-- Ensure proper permissions for the updated function
GRANT EXECUTE ON FUNCTION public.create_default_organization() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_default_organization() TO service_role;
