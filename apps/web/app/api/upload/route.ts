import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from "@/lib/shared/supabase/server"
import { getUserOrganizations } from '@/lib/features/organizations/services/organization/UserOrganizationManager'
import { chunkText } from '@/lib/shared/utils/text'
import { embeddingService } from '@/lib/shared/services/embeddingService'

export const runtime = 'nodejs' // must be nodejs for file processing

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Get user and organization context
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const orgs = await getUserOrganizations(user.id)
    const org = orgs[0]
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    // Find the agent for this organization
    const { data: agents, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('organization_id', org.id)
      .limit(1)
    if (agentError || !agents || agents.length === 0) {
      return NextResponse.json({ error: 'No agent found for organization' }, { status: 400 })
    }
    const agentId = agents[0].id

    // Read file content
    let text = ''
    if (file.type === 'application/pdf') {
      // PDF: use pdf-parse
      const buffer = Buffer.from(await file.arrayBuffer())
      const pdfParse = (await import('pdf-parse')).default
      const data = await pdfParse(buffer)
      text = data.text
    } else if (file.type === 'text/plain') {
      // TXT: read as text
      text = await file.text()
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // Chunk text
    const chunks = chunkText(text)
    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No text extracted from file' }, { status: 400 })
    }

    // Prepare segments for embedding
    const segments = chunks.map((chunk, index) => ({
      text: chunk,
      type: 'document' as const,
      metadata: {
        source: 'document_upload',
        file_name: file.name,
        chunk_index: index + 1,
        total_chunks: chunks.length,
        uploaded_by: user.email,
        uploaded_at: new Date().toISOString(),
        file_type: file.type,
        file_size: file.size
      }
    }))

    // Use singleton embeddingService with public method
    const conversationTexts = segments.map(segment => segment.text)
    await embeddingService.processBusinessConversations(org.id, conversationTexts)
    const results = segments // Return segments for count

    return NextResponse.json({
      message: 'File processed and embedded',
      file: file.name,
      chunks: chunks.length,
      embeddings: results.length
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'File upload or processing failed' }, { status: 500 })
  }
} 