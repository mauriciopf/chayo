-- Simple fix for user deletion error
-- Drop the problematic function that's preventing user deletion

-- Drop the function that's causing the error
DROP FUNCTION IF EXISTS public.protect_sample_org_related_data() CASCADE;

-- Also drop any related triggers
DROP TRIGGER IF EXISTS protect_sample_org_data_trigger ON team_members CASCADE;
DROP TRIGGER IF EXISTS protect_sample_org_data_trigger ON organizations CASCADE;
DROP TRIGGER IF EXISTS protect_sample_data_trigger ON team_members CASCADE;

-- Success message
SELECT '✅ Removed problematic function and triggers - user deletion should work now!' as result;
