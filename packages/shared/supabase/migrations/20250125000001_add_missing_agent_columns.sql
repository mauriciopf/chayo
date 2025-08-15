-- Add missing columns to agents table for client chat functionality
-- This migration adds columns that exist in production_setup.sql but are missing from the current cloud schema

-- Add missing columns to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS greeting TEXT,
ADD COLUMN IF NOT EXISTS tone TEXT,
ADD COLUMN IF NOT EXISTS goals TEXT[],
ADD COLUMN IF NOT EXISTS paused BOOLEAN DEFAULT FALSE;

-- Update existing agents with default values if they have null values
UPDATE agents 
SET 
  greeting = COALESCE(greeting, 'Hello! How can I help you today?'),
  tone = COALESCE(tone, 'professional'),
  goals = COALESCE(goals, ARRAY['Provide helpful customer service']::TEXT[]),
  paused = COALESCE(paused, FALSE)
WHERE greeting IS NULL OR tone IS NULL OR goals IS NULL OR paused IS NULL;

-- Add NOT NULL constraints after setting default values (except for optional fields)
ALTER TABLE agents 
ALTER COLUMN greeting SET NOT NULL,
ALTER COLUMN paused SET NOT NULL;

-- Note: tone and goals remain nullable as they are optional fields 