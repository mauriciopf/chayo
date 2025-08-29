-- Quick fix: Ensure generate_unique_mobile_app_code function is accessible to trigger
-- This addresses the "function does not exist" error even though it exists in Supabase

-- Make sure the function is in the public schema and has proper permissions
CREATE OR REPLACE FUNCTION public.generate_unique_mobile_app_code()
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
            SELECT 1 FROM public.organizations 
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger function to explicitly reference the public schema
CREATE OR REPLACE FUNCTION public.create_default_organization()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  new_mobile_code VARCHAR(6);
BEGIN
  -- Generate unique mobile app code with explicit schema reference
  new_mobile_code := public.generate_unique_mobile_app_code();
  
  -- Create the organization with mobile_app_code
  INSERT INTO public.organizations (name, slug, owner_id, mobile_app_code)
  VALUES (
    'My Organization',
    'org-' || REPLACE(NEW.id::text, '-', ''),
    NEW.id,
    new_mobile_code
  )
  RETURNING id INTO new_org_id;
  
  -- Add the user as an active owner in team_members
  INSERT INTO public.team_members (organization_id, user_id, role, status)
  VALUES (new_org_id, NEW.id, 'owner', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION public.generate_unique_mobile_app_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_unique_mobile_app_code() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_default_organization() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_default_organization() TO service_role;
