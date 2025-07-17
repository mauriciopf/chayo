-- Script to remove business_info_history table from Supabase
-- This table is no longer needed since we're using conversation_embeddings for RAG
-- and business_constraints for storing business information

-- First, check if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_info_history') THEN
        RAISE NOTICE 'Table business_info_history exists, proceeding with removal...';
    ELSE
        RAISE NOTICE 'Table business_info_history does not exist, nothing to remove.';
        RETURN;
    END IF;
END $$;

-- Drop the table if it exists
DROP TABLE IF EXISTS business_info_history CASCADE;

-- Verify the table has been removed
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'business_info_history') THEN
        RAISE NOTICE 'Table business_info_history successfully removed.';
    ELSE
        RAISE NOTICE 'Failed to remove table business_info_history.';
    END IF;
END $$;

-- Optional: List remaining tables to verify cleanup
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%business%' 
OR table_name LIKE '%agent%' 
OR table_name LIKE '%conversation%'
ORDER BY table_name; 