import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const documentId = params.documentId

    // Get document metadata with organization info (no auth required for signing)
    const { data: document, error } = await supabase
      .from('agent_document_tool')
      .select(`
        *,
        organizations!inner(id, slug)
      `)
      .eq('id', documentId)
      .eq('status', 'active') // Documents are always active for multiple signatures
      .single()

    if (error || !document) {
      return NextResponse.json(
        { error: 'Document not found or not available for signing' }, 
        { status: 404 }
      )
    }

    // Return document metadata (exclude sensitive info)
    return NextResponse.json({
      document: {
        id: document.id,
        file_name: document.file_name,
        file_size: document.file_size,
        status: document.status,
        organization_id: document.organization_id,
        organization_slug: document.organizations?.slug
      }
    })

  } catch (error) {
    console.error('Get document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}