-- Fix agent_channels table foreign key relationship
-- The error indicates that there's no relationship between agent_channels and agents tables

-- 1. First, let's check the current structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('agent_channels', 'agents')
ORDER BY table_name, ordinal_position;

-- 2. Check if there are any existing records that might be causing issues
SELECT * FROM agent_channels LIMIT 5;
SELECT * FROM agents LIMIT 5;

-- 3. Add the missing foreign key constraint if it doesn't exist
-- First, check if the constraint already exists
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'agent_channels'
  AND ccu.table_name = 'agents';

-- 4. If the foreign key doesn't exist, add it
-- (This will only work if the agent_id column exists and references valid agent IDs)
-- ALTER TABLE agent_channels 
-- ADD CONSTRAINT fk_agent_channels_agent_id 
-- FOREIGN KEY (agent_id) REFERENCES agents(id);

-- 5. Alternative: If the relationship is not needed, we can remove the agent_id column
-- or make it nullable and not enforce the foreign key
-- ALTER TABLE agent_channels ALTER COLUMN agent_id DROP NOT NULL; 