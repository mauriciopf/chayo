-- Migration: Disable RLS for vibe_cards table
-- This removes row-level security restrictions that are preventing vibe card storage

-- Drop all existing RLS policies for vibe_cards
DROP POLICY IF EXISTS "Users can view their own vibe cards" ON vibe_cards;
DROP POLICY IF EXISTS "Users can insert their own vibe cards" ON vibe_cards;
DROP POLICY IF EXISTS "Users can update their own vibe cards" ON vibe_cards;
DROP POLICY IF EXISTS "Users can delete their own vibe cards" ON vibe_cards;

-- Disable RLS completely for vibe_cards table
ALTER TABLE vibe_cards DISABLE ROW LEVEL SECURITY;

-- Add comment explaining the change
COMMENT ON TABLE vibe_cards IS 'Vibe cards table with RLS disabled - access control handled at application level';
