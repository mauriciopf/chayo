# Supabase Storage Setup for Products Images

This guide will help you set up Supabase Storage for product images in the Chayo platform.

## 1. Create Storage Bucket

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Enter the following details:
   - **Name**: `product-images`
   - **Public**: ✅ **Enabled** (so images can be displayed publicly)
   - **File size limit**: `5242880` (5MB in bytes)
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml`

### Option B: Using SQL (Alternative)

```sql
-- Create the product-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images', 
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
);
```

## 2. Optional: Performance Index

Optionally, you can run this SQL command in your Supabase SQL Editor for better performance:

```sql
-- Create index for better performance on bucket queries (optional)
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id 
ON storage.objects (bucket_id) WHERE bucket_id = 'product-images';
```

**Note**: No RLS (Row Level Security) policies are needed. Access control is handled at the API level in the `/api/products/upload` endpoint.

## 3. Verify Setup

After setting up the bucket and policies, you can verify everything works by:

1. **Testing Upload**: Try uploading a product image through the Products & Services tool
2. **Check Storage**: Go to Supabase Dashboard > Storage > product-images to see uploaded files
3. **Test Display**: Verify images display correctly in the products list

## 4. File Organization Structure

Images will be stored with the following structure:
```
product-images/
├── {organization-id-1}/
│   └── products/
│       ├── 1234567890-product1.jpg
│       ├── 1234567891-product2.png
│       └── ...
├── {organization-id-2}/
│   └── products/
│       ├── 1234567892-service1.jpg
│       └── ...
└── ...
```

## 5. Security Features

- ✅ **API-Level Access Control**: Upload endpoint verifies user authentication and organization membership
- ✅ **File Type Validation**: Only image files are allowed (validated at API level)
- ✅ **Size Limits**: Maximum 5MB per image (enforced at API level)
- ✅ **Public Access**: Images are publicly accessible via URL (needed for display)
- ✅ **Organization Isolation**: File paths include organization ID for logical separation

## 6. Troubleshooting

### Common Issues:

1. **"Upload failed" error**: 
   - Check if the bucket exists and is public
   - Check file size (must be < 5MB) and type (must be image)
   - Verify user is authenticated and member of the organization

2. **Images not displaying**:
   - Verify the bucket is set to public
   - Check if the public URL is correctly generated
   - Ensure the image file actually exists in storage

3. **Permission denied**:
   - Verify the user is a member of the organization
   - Ensure the user is authenticated
   - Check API endpoint logs for specific error details

### Debug Commands:

```sql
-- Check if bucket exists and is public
SELECT * FROM storage.buckets WHERE id = 'product-images';

-- View uploaded files
SELECT * FROM storage.objects WHERE bucket_id = 'product-images';

-- Check organization membership for a user
SELECT * FROM organization_members WHERE user_id = 'user-uuid-here';
```

## 7. Environment Variables

Make sure your Supabase environment variables are properly set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

Once you complete this setup, the Products & Services tool will be able to upload, store, and display product images seamlessly! 🎉
