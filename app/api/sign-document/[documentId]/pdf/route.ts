import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const documentId = params.documentId

    // Get document metadata
    const { data: document, error: docError } = await supabase
      .from('agent_document_tool')
      .select('file_path, file_name, status')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' }, 
        { status: 404 }
      )
    }

    // Only allow access to pending documents for signing
    if (document.status !== 'pending') {
      return NextResponse.json(
        { error: 'Document is not available for signing' }, 
        { status: 403 }
      )
    }

    // Download file from Supabase storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from('agent-documents')
      .download(document.file_path)

    if (storageError || !fileData) {
      return NextResponse.json(
        { error: 'Failed to load PDF file' }, 
        { status: 404 }
      )
    }

    // Return PDF file
    return new NextResponse(fileData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.file_name}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

  } catch (error) {
    console.error('PDF download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}