import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'
import { getUserOrganizations } from '@/lib/features/organizations/services/organization/UserOrganizationManager'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = (formData as any).get('file') as File
    const organizationId = (formData as any).get('organizationId') as string
    const folder = (formData as any).get('folder') as string || 'products'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Verify user has access to this organization
    const orgs = await getUserOrganizations(user.id)
    const hasAccess = orgs.some(org => org.id === organizationId)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${organizationId}/${folder}/${timestamp}-${sanitizedName}`

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      console.error('Upload error details:', JSON.stringify(uploadError, null, 2))
      console.error('File details:', { name: file.name, size: file.size, type: file.type })
      console.error('Upload path:', fileName)
      return NextResponse.json({ 
        error: 'Failed to upload image', 
        details: uploadError.message || 'Unknown upload error',
        uploadError: uploadError
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      filePath: fileName
    })

  } catch (error) {
    console.error('Product image upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

