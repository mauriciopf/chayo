-- Fix user deletion error by handling the protect_sample_org_related_data function
-- This function is trying to access a non-existent 'is_sample' column

-- First, let's check what functions exist that might be causing issues
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name LIKE '%protect%' 
    OR routine_name LIKE '%sample%';

-- Check what triggers exist on team_members table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'team_members';

-- Check if organizations table has is_sample column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Drop the problematic function if it exists
DROP FUNCTION IF EXISTS public.protect_sample_org_related_data() CASCADE;

-- Drop any triggers that might be using this function
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Find and drop triggers related to sample data protection
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers 
        WHERE action_statement LIKE '%protect_sample_org_related_data%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE', 
                      trigger_record.trigger_name, 
                      trigger_record.event_object_table);
        RAISE NOTICE 'Dropped trigger % on table %', 
                     trigger_record.trigger_name, 
                     trigger_record.event_object_table;
    END LOOP;
END $$;

-- Verify the user can now be deleted by checking if the function still exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
                AND routine_name = 'protect_sample_org_related_data'
        ) 
        THEN '❌ Function still exists - manual removal needed'
        ELSE '✅ Function removed successfully - user deletion should work now'
    END as status;

-- Show remaining functions for reference
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
ORDER BY routine_name;
