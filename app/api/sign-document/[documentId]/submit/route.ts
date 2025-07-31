import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const documentId = params.documentId

    // Get document metadata
    const { data: document, error: docError } = await supabase
      .from('agent_document_tool')
      .select('*')
      .eq('id', documentId)
      .eq('status', 'pending') // Only allow signing of pending documents
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found or already signed' }, 
        { status: 404 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const signedPdf = formData.get('signedPdf') as File
    const signerName = formData.get('signerName') as string
    const signerEmail = formData.get('signerEmail') as string

    if (!signedPdf || !signerName || !signerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Upload signed PDF to storage
    const timestamp = Date.now()
    const signedFileName = `signed-${timestamp}-${document.file_name}`
    const signedFilePath = `agent-documents/${document.organization_id}/signed/${signedFileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('agent-documents')
      .upload(signedFilePath, signedPdf, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Failed to upload signed PDF: ${uploadError.message}`)
    }

    // Update document status with signature information
    const { error: updateError } = await supabase
      .from('agent_document_tool')
      .update({
        status: 'signed',
        recipient_name: signerName,
        recipient_email: signerEmail,
        signed_at: new Date().toISOString(),
        signed_file_path: uploadData.path,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (updateError) {
      // Clean up uploaded file if database update fails
      await supabase.storage
        .from('agent-documents')
        .remove([uploadData.path])
      
      throw new Error(`Failed to update document status: ${updateError.message}`)
    }

    // TODO: Send email notification to business owner
    // Could call the notification service here
    console.log(`Document ${documentId} signed by ${signerName} (${signerEmail})`)
    console.log(`Business owner notification email: ${document.business_owner_email}`)

    return NextResponse.json({
      success: true,
      message: 'Document signed successfully',
      document: {
        id: documentId,
        status: 'signed',
        signer_name: signerName,
        signer_email: signerEmail,
        signed_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Submit signature error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}