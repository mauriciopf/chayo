import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getUserOrganizations } from '@/lib/services/organization/UserOrganizationManager'

// Function to upload PDF to Supabase storage
async function uploadPdfToStorage(file: File, organizationId: string, supabase: any) {
  try {
    // Generate unique file path
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const filePath = `agent-documents/${organizationId}/${fileName}`

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('agent-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`)
    }

    return {
      filePath: data.path,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    }

  } catch (error) {
    console.error('Storage upload error:', error)
    throw error
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = params.id
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Verify organization access
    const orgs = await getUserOrganizations(user.id)
    const organization = orgs.find(org => org.id === organizationId)
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Use current authenticated user's email for notifications
    const businessOwnerEmail = user.email
    if (!businessOwnerEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    // LIMIT: Delete existing documents for this organization (one document per account)
    const { error: deleteError } = await supabase
      .from('agent_document_tool')
      .delete()
      .eq('organization_id', organizationId)

    if (deleteError) {
      console.warn('Warning: Could not delete existing documents:', deleteError)
      // Continue anyway - don't block new upload
    }

    // Upload PDF to Supabase storage
    const uploadResult = await uploadPdfToStorage(file, organizationId, supabase)

    // Store document metadata in our database
    const { data: document, error: dbError } = await supabase
      .from('agent_document_tool')
      .insert({
        organization_id: organizationId,
        file_path: uploadResult.filePath,
        file_name: uploadResult.fileName,
        file_size: uploadResult.fileSize,
        mime_type: uploadResult.mimeType,
        status: 'pending',
        business_owner_email: businessOwnerEmail,
        created_by: user.id
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from('agent-documents')
        .remove([uploadResult.filePath])
      
      throw new Error(`Database error: ${dbError.message}`)
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        file_name: document.file_name,
        file_size: document.file_size,
        status: document.status,
        created_at: document.created_at,
        // Generate signing URL for client chat
        signing_url: `/en/sign-document/${document.id}`
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to list documents for an organization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = params.id

    // Verify organization access
    const orgs = await getUserOrganizations(user.id)
    const organization = orgs.find(org => org.id === organizationId)
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get documents for this organization
    const { data: documents, error } = await supabase
      .from('agent_document_tool')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    // Add signing URLs to documents
    const documentsWithUrls = documents.map(doc => ({
      ...doc,
      signing_url: `/en/sign-document/${doc.id}`
    }))

    return NextResponse.json({
      documents: documentsWithUrls
    })

  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}