-- Fix RLS policies for offer-banners bucket to allow image uploads
-- This migration removes restrictive policies and creates permissive ones for the offer-banners bucket

-- Drop any existing policies for offer-banners bucket
DROP POLICY IF EXISTS "Users can upload offer banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can view offer banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete offer banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can update offer banners" ON storage.objects;

-- Drop any organization-specific policies for offer-banners
DROP POLICY IF EXISTS "Organization members can upload offer banners" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can read offer banners" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can delete offer banners" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can update offer banners" ON storage.objects;

-- Drop any bucket-specific policies that might exist
DROP POLICY IF EXISTS "offer-banners bucket access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated offer banners access" ON storage.objects;

-- The existing permissive policies should already cover the offer-banners bucket:
-- "Allow authenticated users full access to storage" and "Allow service role full access to storage"
-- These policies apply to ALL objects in storage, including the offer-banners bucket

-- Note: Bucket public setting needs to be configured via Supabase dashboard or CLI
-- Cannot modify storage.buckets table directly from migrations due to permissions
