import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { embeddingService } from '@/lib/services/embeddingService'
import { organizationSystemPromptService } from '@/lib/services/systemPrompt/OrganizationSystemPromptService'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const { conversations, format = 'json', updateSystemPrompt = true } = await request.json()

    if (!conversations || !Array.isArray(conversations)) {
      return NextResponse.json(
        { error: 'Conversations array is required' },
        { status: 400 }
      )
    }

    // Get user from auth
    const { supabase } = createClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify agent belongs to user and get organization_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, organization_id')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or unauthorized' },
        { status: 403 }
      )
    }

    // Process and store conversations
    const results = await embeddingService.processBusinessConversations(
      agent.organization_id,
      conversations,
      format
    )

    // Update system prompt if requested
    if (updateSystemPrompt) {
      // await organizationSystemPromptService.updateAgentSystemPrompt(agentId)
    }

    // Get updated knowledge summary
    const summary = await embeddingService.getBusinessKnowledgeSummary(agent.organization_id)

    return NextResponse.json({
      success: true,
      data: {
        processedSegments: results.length,
        agentId,
        agentName: agent.name,
        knowledgeSummary: summary
      }
    })

  } catch (error) {
    console.error('Error processing conversations:', error)
    return NextResponse.json(
      { error: 'Failed to process conversations' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get user from auth
    const { supabase } = createClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify agent belongs to user and get organization_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, organization_id')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or unauthorized' },
        { status: 403 }
      )
    }

    let results = []
    
    if (query) {
      // Search for similar conversations
      // Generate embedding for the query string
      const { generateEmbeddings } = await import('@/lib/services/embedding/EmbeddingGenerator')
      const queryEmbedding = (await generateEmbeddings([{ text: query, type: 'conversation', metadata: {} }]))[0]
      results = await embeddingService.searchSimilarConversations(
        agent.organization_id,
        queryEmbedding,
        0.7,
        limit
      )
    } else {
      // Get recent conversations
      const { data, error } = await supabase
        .from('conversation_embeddings')
        .select('*')
        .eq('organization_id', agent.organization_id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error('Failed to fetch conversations')
      }

      results = data || []
    }

    // Get knowledge summary
    const summary = await embeddingService.getBusinessKnowledgeSummary(agent.organization_id)

    return NextResponse.json({
      success: true,
      data: {
        conversations: results,
        agentId,
        agentName: agent.name,
        knowledgeSummary: summary,
        totalResults: results.length
      }
    })

  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id

    // Get user from auth
    const { supabase } = createClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify agent belongs to user and get organization_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, organization_id')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or unauthorized' },
        { status: 403 }
      )
    }

    // Delete all embeddings for this organization
    await embeddingService.deleteOrganizationEmbeddings(agent.organization_id)

    return NextResponse.json({
      success: true,
      message: `All conversation embeddings deleted for agent ${agent.name}`
    })

  } catch (error) {
    console.error('Error deleting conversations:', error)
    return NextResponse.json(
      { error: 'Failed to delete conversations' },
      { status: 500 }
    )
  }
}

// 🔄 PATCH - Update memory with conflict resolution
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const { 
      memoryUpdate, 
      conflictStrategy = 'auto' 
    } = await request.json()

    if (!memoryUpdate || !memoryUpdate.text) {
      return NextResponse.json(
        { error: 'Memory update with text is required' },
        { status: 400 }
      )
    }

    // Get user from auth
    const { supabase } = createClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify agent belongs to user and get organization_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, organization_id')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or unauthorized' },
        { status: 403 }
      )
    }

    // Update memory with conflict resolution
    const result = await embeddingService.updateMemory(
      agent.organization_id,
      memoryUpdate,
      conflictStrategy
    )

    // Get updated knowledge summary
    const summary = await embeddingService.getBusinessKnowledgeSummary(agent.organization_id)

    return NextResponse.json({
      success: result.success,
      data: {
        ...result,
        agentId,
        agentName: agent.name,
        knowledgeSummary: summary
      }
    })

  } catch (error) {
    console.error('Error updating memory:', error)
    return NextResponse.json(
      { error: 'Failed to update memory' },
      { status: 500 }
    )
  }
} 