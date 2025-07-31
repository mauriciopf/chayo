import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const documentId = params.documentId

    // Get document metadata (documents are always active now, no status check)
    const { data: document, error: docError } = await supabase
      .from('agent_document_tool')
      .select('*')
      .eq('id', documentId)
      .eq('status', 'active') // Documents stay active for multiple signatures
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found or not available for signing' }, 
        { status: 404 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const signedPdf = formData.get('signedPdf') as File
    const signerName = formData.get('signerName') as string
    const signerEmail = formData.get('signerEmail') as string
    const anonymousUserId = formData.get('anonymousUserId') as string

    if (!signedPdf || !signerName || !signerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Double-check for duplicate signatures by name+email
    const { data: existingSignature } = await supabase
      .rpc('check_existing_signature', {
        p_document_id: documentId,
        p_signer_name: signerName.trim(),
        p_signer_email: signerEmail.trim()
      })

    if (existingSignature === true) {
      return NextResponse.json(
        { error: 'You have already signed this document with these credentials' },
        { status: 409 }
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

    // Create signature record (documents stay active for multiple signatures)
    const { data: signatureData, error: signatureError } = await supabase
      .from('document_signatures')
      .insert({
        document_id: documentId,
        organization_id: document.organization_id,
        anonymous_user_id: anonymousUserId || null,
        signer_name: signerName.trim(),
        signer_email: signerEmail.trim(),
        signed_file_path: uploadData.path,
        signed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (signatureError) {
      // Clean up uploaded file if signature creation fails
      await supabase.storage
        .from('agent-documents')
        .remove([uploadData.path])
      
      throw new Error(`Failed to create signature record: ${signatureError.message}`)
    }

    // TODO: Send email notification to business owner
    // Could call the notification service here
    console.log(`Document ${documentId} signed by ${signerName} (${signerEmail})`)
    console.log(`Business owner notification email: ${document.business_owner_email}`)

    return NextResponse.json({
      success: true,
      message: 'Document signed successfully',
      signature: {
        id: signatureData.id,
        document_id: documentId,
        signer_name: signerName,
        signer_email: signerEmail,
        signed_at: signatureData.signed_at,
        anonymous_user_id: anonymousUserId || null
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