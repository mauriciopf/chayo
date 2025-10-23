-- Add function to allow users to delete their own account
-- This will be called from the mobile app

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the current authenticated user's ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Delete customers (CASCADE will handle related data)
    DELETE FROM customers
    WHERE supabase_user_id = v_user_id;
    
    -- Delete team memberships
    DELETE FROM team_members
    WHERE user_id = v_user_id;
    
    -- Delete the auth user (this will cascade to auth.users)
    DELETE FROM auth.users
    WHERE id = v_user_id;
    
    -- Success
    RAISE NOTICE 'User account % deleted successfully', v_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

-- Add comment
COMMENT ON FUNCTION delete_user_account() IS 'Allows an authenticated user to delete their own account. Related data is deleted via CASCADE constraints.';


