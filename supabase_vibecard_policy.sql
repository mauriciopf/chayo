-- Create permissive RLS policy for vibecard-images bucket
-- Run this in Supabase SQL Editor

-- Create policy to allow all operations on vibecard-images bucket
CREATE POLICY "Allow all operations on vibecard-images bucket"
ON storage.objects
FOR ALL
USING (bucket_id = 'vibecard-images')
WITH CHECK (bucket_id = 'vibecard-images');

-- Verify the policy was created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%vibecard%';

-- Also verify bucket settings
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'vibecard-images';
