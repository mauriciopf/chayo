import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUserOrganization } from '@/lib/supabase/server'
import { chunkText } from '@/lib/utils/text'
import { EmbeddingService } from '@/lib/services/embeddingService'

export const runtime = 'nodejs' // must be nodejs for file processing

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Get user and organization context
    const { supabase } = createClient(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const org = await getUserOrganization(supabase, user.id)
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

    // Create embedding service with server-side client
    const embeddingService = new EmbeddingService(supabase)
    
    // Generate and store embeddings
    const results = await embeddingService.storeConversationEmbeddings(org.id, segments)

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