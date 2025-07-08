-- Fix for Google OAuth signup database error
-- This script fixes the create_default_organization trigger to handle conflicts gracefully

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS create_default_organization_trigger ON auth.users;

-- Create an improved function that handles conflicts gracefully
CREATE OR REPLACE FUNCTION create_default_organization()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
    org_slug TEXT;
    existing_org_id UUID;
    counter INTEGER := 0;
    base_slug TEXT;
BEGIN
    -- Check if user already has an organization
    SELECT id INTO existing_org_id 
    FROM organizations 
    WHERE owner_id = NEW.id
    LIMIT 1;
    
    -- If user already has an organization, don't create another one
    IF existing_org_id IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Generate a base slug from email
    base_slug := regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g');
    
    -- If base_slug is empty, use 'user' as default
    IF base_slug = '' THEN
        base_slug := 'user';
    END IF;
    
    -- Generate unique slug with counter if needed
    org_slug := base_slug || '-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 8);
    
    -- Try to create organization with unique slug
    WHILE counter < 10 LOOP
        BEGIN
            INSERT INTO organizations (name, slug, owner_id)
            VALUES (
                COALESCE(split_part(NEW.email, '@', 1), 'User') || '''s Organization', 
                org_slug, 
                NEW.id
            )
            RETURNING id INTO org_id;
            
            -- If successful, break out of loop
            EXIT;
        EXCEPTION
            WHEN unique_violation THEN
                -- If slug exists, try with counter
                counter := counter + 1;
                org_slug := base_slug || '-' || counter::TEXT || '-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 8);
        END;
    END LOOP;
    
    -- Only create team member if organization was created successfully
    IF org_id IS NOT NULL THEN
        INSERT INTO team_members (organization_id, user_id, role, status)
        VALUES (org_id, NEW.id, 'owner', 'active')
        ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- If anything fails, just return NEW without creating organization
        -- This prevents the entire signup process from failing
        RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Recreate the trigger
CREATE TRIGGER create_default_organization_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE create_default_organization();

-- Also create a function to manually create organizations for existing users who might be missing one
CREATE OR REPLACE FUNCTION create_missing_organizations()
RETURNS INTEGER AS $$
DECLARE
    user_record RECORD;
    org_id UUID;
    org_slug TEXT;
    counter INTEGER := 0;
    base_slug TEXT;
    created_count INTEGER := 0;
BEGIN
    -- Loop through users without organizations
    FOR user_record IN
        SELECT u.id, u.email
        FROM auth.users u
        LEFT JOIN organizations o ON u.id = o.owner_id
        WHERE o.id IS NULL
    LOOP
        -- Generate slug
        base_slug := regexp_replace(split_part(user_record.email, '@', 1), '[^a-zA-Z0-9]', '', 'g');
        
        IF base_slug = '' THEN
            base_slug := 'user';
        END IF;
        
        org_slug := base_slug || '-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 8);
        counter := 0;
        
        -- Try to create organization
        WHILE counter < 10 LOOP
            BEGIN
                INSERT INTO organizations (name, slug, owner_id)
                VALUES (
                    COALESCE(split_part(user_record.email, '@', 1), 'User') || '''s Organization', 
                    org_slug, 
                    user_record.id
                )
                RETURNING id INTO org_id;
                
                -- Create team member
                INSERT INTO team_members (organization_id, user_id, role, status)
                VALUES (org_id, user_record.id, 'owner', 'active')
                ON CONFLICT (organization_id, user_id) DO NOTHING;
                
                created_count := created_count + 1;
                EXIT;
            EXCEPTION
                WHEN unique_violation THEN
                    counter := counter + 1;
                    org_slug := base_slug || '-' || counter::TEXT || '-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 8);
            END;
        END LOOP;
    END LOOP;
    
    RETURN created_count;
END;
$$ LANGUAGE 'plpgsql';

-- Run the function to create missing organizations for existing users
SELECT create_missing_organizations();
