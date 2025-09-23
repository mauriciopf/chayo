-- Simple storage permissions fix for product uploads
-- Only creates new permissive policies without touching existing ones

-- Create permissive policy for authenticated users if it doesn't exist
DO $$ 
BEGIN
    -- Try to create policy, ignore if it already exists
    BEGIN
        CREATE POLICY "Allow authenticated uploads" ON storage.objects
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, ignore
    END;
    
    BEGIN
        CREATE POLICY "Allow authenticated reads" ON storage.objects
        FOR SELECT USING (auth.role() = 'authenticated');
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, ignore
    END;
    
    BEGIN
        CREATE POLICY "Allow service role all access" ON storage.objects
        FOR ALL USING (auth.role() = 'service_role');
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists, ignore
    END;
END $$;

-- Ensure buckets exist and are properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[];
