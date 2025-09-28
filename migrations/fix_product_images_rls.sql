-- Fix RLS issues for product-images Supabase bucket
-- This removes restrictive RLS policies that prevent product image uploads

-- Drop any existing restrictive policies on the product-images bucket
DROP POLICY IF EXISTS "product_images_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_delete_policy" ON storage.objects;

-- Create a permissive policy for the product-images bucket
-- This allows all operations on files in the product-images bucket
CREATE POLICY "Allow all operations on product-images bucket" ON storage.objects
  FOR ALL USING (bucket_id = 'product-images');

-- Ensure the bucket exists and is properly configured
-- Note: Bucket creation and public settings must be done via Supabase dashboard or CLI
-- as direct modification of storage.buckets is not allowed in migrations

-- Success message
SELECT 'Fixed RLS policies for product-images bucket - uploads should work now!' as result;
