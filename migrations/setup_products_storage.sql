-- Setup Supabase Storage for Products Images
-- Run this after creating the 'product-images' bucket in Supabase Dashboard

-- Note: No RLS policies needed - access control is handled at the API level
-- The bucket should be set to public for image display

-- Create index for better performance on bucket queries (optional)
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id 
ON storage.objects (bucket_id) WHERE bucket_id = 'product-images';
