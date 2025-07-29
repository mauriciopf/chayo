-- Clean up business_info_fields table
-- This script removes duplicate questions and fixes data inconsistencies

-- 1. First, let's see what we have
SELECT 
  id,
  field_name,
  question_template,
  is_answered,
  stage,
  created_at
FROM business_info_fields 
WHERE organization_id = '983e19f6-883f-4bfa-b1d7-d581b06538ce'
ORDER BY created_at;

-- 2. Remove questions that contain "STATUS: setup_complete" but are marked as unanswered
DELETE FROM business_info_fields 
WHERE organization_id = '983e19f6-883f-4bfa-b1d7-d581b06538ce'
AND question_template LIKE '%STATUS: setup_complete%'
AND is_answered = false;

-- 3. Remove duplicate questions that start with "Let's begin"
-- Keep only the first one created
DELETE FROM business_info_fields 
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY 
               CASE 
                 WHEN question_template LIKE 'Let''s begin%' THEN 'lets_begin'
                 WHEN question_template LIKE 'What is your business name%' THEN 'business_name'
                 ELSE question_template
               END
             ORDER BY created_at
           ) as rn
    FROM business_info_fields 
    WHERE organization_id = '983e19f6-883f-4bfa-b1d7-d581b06538ce'
    AND question_template LIKE 'Let''s begin%'
  ) t
  WHERE t.rn > 1
);

-- 4. Mark all remaining questions as answered since setup is completed
UPDATE business_info_fields 
SET is_answered = true
WHERE organization_id = '983e19f6-883f-4bfa-b1d7-d581b06538ce'
AND is_answered = false;

-- 5. Update stages to reflect completion
UPDATE business_info_fields 
SET stage = 'stage_1'
WHERE organization_id = '983e19f6-883f-4bfa-b1d7-d581b06538ce'
AND stage IS NULL;

-- 6. Show the cleaned up data
SELECT 
  id,
  field_name,
  LEFT(question_template, 100) as question_preview,
  is_answered,
  stage,
  created_at
FROM business_info_fields 
WHERE organization_id = '983e19f6-883f-4bfa-b1d7-d581b06538ce'
ORDER BY created_at; 