import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getUserOrganizations } from '@/lib/services/organization/UserOrganizationManager'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = params.id
    const documentId = params.documentId

    // Verify organization access
    const orgs = await getUserOrganizations(user.id)
    const organization = orgs.find(org => org.id === organizationId)
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get document to verify it exists and belongs to this organization
    const { data: document, error: docError } = await supabase
      .from('agent_document_tool')
      .select('*')
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete file from storage
    const filesToDelete = [document.file_path]
    if (document.signed_file_path) {
      filesToDelete.push(document.signed_file_path)
    }

    const { error: storageError } = await supabase.storage
      .from('agent-documents')
      .remove(filesToDelete)

    if (storageError) {
      console.warn('Warning: Could not delete files from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete document record from database
    const { error: deleteError } = await supabase
      .from('agent_document_tool')
      .delete()
      .eq('id', documentId)
      .eq('organization_id', organizationId)

    if (deleteError) {
      throw new Error(`Failed to delete document: ${deleteError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })

  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve a specific document's details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = params.id
    const documentId = params.documentId

    // Verify organization access
    const orgs = await getUserOrganizations(user.id)
    const organization = orgs.find(org => org.id === organizationId)
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get document details
    const { data: document, error } = await supabase
      .from('agent_document_tool')
      .select('*')
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .single()

    if (error || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Add signing URL to document
    const documentWithUrl = {
      ...document,
      signing_url: `/en/sign-document/${document.id}`
    }

    return NextResponse.json({
      document: documentWithUrl
    })

  } catch (error) {
    console.error('Get document error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}