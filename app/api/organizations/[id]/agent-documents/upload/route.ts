import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getUserOrganizations } from '@/lib/services/organization/UserOrganizationManager'

// Function to create SignatureAPI ceremony directly from file
async function createSignatureApiCeremony(file: File, organizationName: string, businessOwnerEmail: string) {
  const apiKey = process.env.SIGNATURE_API_KEY
  const baseUrl = process.env.SIGNATURE_API_URL || 'https://api.signatureapi.com'

  if (!apiKey) {
    throw new Error('SignatureAPI API key is required. Please add SIGNATURE_API_KEY to your .env.local file.')
  }

  try {
    // 1. Create envelope
    const envelopeResponse = await fetch(`${baseUrl}/envelopes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `${organizationName} - ${file.name}`,
        description: `Document signing for ${organizationName}`
      })
    })

    if (!envelopeResponse.ok) {
      throw new Error(`Failed to create envelope: ${envelopeResponse.statusText}`)
    }

    const envelope = await envelopeResponse.json()
    const envelopeId = envelope.id

    // 2. Upload file directly to SignatureAPI
    const fileFormData = new FormData()
    fileFormData.append('file', file)

    const fileResponse = await fetch(`${baseUrl}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: fileFormData
    })

    if (!fileResponse.ok) {
      throw new Error(`Failed to upload file: ${fileResponse.statusText}`)
    }

    const fileData = await fileResponse.json()
    const fileId = fileData.id

    // 3. Add document to envelope
    const documentResponse = await fetch(`${baseUrl}/envelopes/${envelopeId}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_id: fileId,
        name: file.name
      })
    })

    if (!documentResponse.ok) {
      throw new Error(`Failed to add document: ${documentResponse.statusText}`)
    }

    // 4. Create ceremony for guest/anonymous signing 
    // Most e-signature platforms support guest signing where the client enters their details
    const ceremonyResponse = await fetch(`${baseUrl}/envelopes/${envelopeId}/ceremony`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embedded: true,
        guest_signing: true, // Enable guest signing mode
        collect_signer_info: true, // Client will provide their own name/email
        require_name: true,
        require_email: true
      })
    })

    if (!ceremonyResponse.ok) {
      throw new Error(`Failed to create ceremony: ${ceremonyResponse.statusText}`)
    }

    const ceremony = await ceremonyResponse.json()

    return {
      envelope_id: envelopeId,
      ceremony_url: ceremony.url,
      file_id: fileId
    }

  } catch (error) {
    console.error('SignatureAPI error:', error)
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

    // LIMIT: Delete existing ceremonies for this organization (one document per account)
    const { error: deleteError } = await supabase
      .from('agent_document_tool')
      .delete()
      .eq('organization_id', organizationId)

    if (deleteError) {
      console.warn('Warning: Could not delete existing ceremonies:', deleteError)
      // Continue anyway - don't block new upload
    }

    // Create SignatureAPI ceremony directly
    const ceremonyData = await createSignatureApiCeremony(
      file,
      organization.name || 'Business',
      businessOwnerEmail
    )

    // Store ceremony metadata in our database
    // Note: recipient_name and recipient_email will be populated via webhook when client signs
    const { data: ceremony, error: dbError } = await supabase
      .from('agent_document_tool')
      .insert({
        organization_id: organizationId,
        envelope_id: ceremonyData.envelope_id,
        ceremony_url: ceremonyData.ceremony_url,
        document_name: file.name,
        status: 'pending',
        business_owner_email: businessOwnerEmail,
        created_by: user.id
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to save ceremony metadata' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      ceremony: ceremony,
      ceremony_url: ceremonyData.ceremony_url,
      message: 'Document ceremony created successfully'
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    // Get agent document ceremonies for the organization
    const { data: ceremonies, error } = await supabase
      .from('agent_document_tool')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching ceremonies:', error)
      return NextResponse.json({ error: 'Failed to fetch ceremonies' }, { status: 500 })
    }

    return NextResponse.json({ documents: ceremonies })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}