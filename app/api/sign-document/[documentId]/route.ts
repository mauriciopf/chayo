import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const documentId = params.documentId

    // Get document metadata (no auth required for signing)
    const { data: document, error } = await supabase
      .from('agent_document_tool')
      .select('*')
      .eq('id', documentId)
      .eq('status', 'pending') // Only allow signing of pending documents
      .single()

    if (error || !document) {
      return NextResponse.json(
        { error: 'Document not found or already signed' }, 
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
        organization_id: document.organization_id
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