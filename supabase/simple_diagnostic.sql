-- Simple diagnostic script to check what's wrong
-- Run each section separately to see where the issue is

-- 1. Check if tables exist and have data
SELECT 'organizations' as table_name, count(*) as row_count FROM organizations
UNION ALL
SELECT 'team_members' as table_name, count(*) as row_count FROM team_members
UNION ALL
SELECT 'user_subscriptions' as table_name, count(*) as row_count FROM user_subscriptions
UNION ALL
SELECT 'agents' as table_name, count(*) as row_count FROM agents;

-- 2. Check your specific user data
SELECT 
    'Your organizations:' as info,
    id,
    name,
    slug,
    owner_id
FROM organizations 
WHERE owner_id = '0de5d55b-c525-4f72-8e01-18c22d7ca0ef';

-- 3. Check your team memberships
SELECT 
    'Your team memberships:' as info,
    id,
    organization_id,
    user_id,
    role,
    status
FROM team_members 
WHERE user_id = '0de5d55b-c525-4f72-8e01-18c22d7ca0ef';

-- 4. Check your agents
SELECT 
    'Your agents:' as info,
    id,
    name,
    user_id,
    organization_id
FROM agents 
WHERE user_id = '0de5d55b-c525-4f72-8e01-18c22d7ca0ef';

-- 5. Test the exact failing query (simplified)
SELECT 
    tm.organization_id,
    tm.role,
    o.id,
    o.name,
    o.slug,
    o.owner_id,
    o.created_at
FROM team_members tm
INNER JOIN organizations o ON tm.organization_id = o.id
WHERE tm.user_id = '0de5d55b-c525-4f72-8e01-18c22d7ca0ef'
  AND tm.status = 'active'
ORDER BY tm.joined_at ASC
LIMIT 1;
