import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { embeddingService } from '@/lib/services/embeddingService'

// 🔍 GET - Get memory conflicts and analysis
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') // 'conflicts' or 'summary'
    const threshold = parseFloat(searchParams.get('threshold') || '0.85')

    // Get user from auth
    const { supabase } = createClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or unauthorized' },
        { status: 403 }
      )
    }

    // Only support summary action
    const summary = await embeddingService.getBusinessKnowledgeSummary(agentId)
    return NextResponse.json({
      success: true,
      data: {
        agentId,
        agentName: agent.name,
        summary
      }
    })

  } catch (error) {
    console.error('Error getting memory data:', error)
    return NextResponse.json(
      { error: 'Failed to get memory data' },
      { status: 500 }
    )
  }
}

// 🗑️ DELETE - Delete specific memory
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const { memoryId } = await request.json()

    if (!memoryId) {
      return NextResponse.json(
        { error: 'Memory ID is required' },
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

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or unauthorized' },
        { status: 403 }
      )
    }

    // Delete the specific memory
    const success = await embeddingService.deleteMemory(agentId, memoryId)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete memory' },
        { status: 500 }
      )
    }

    // Get updated summary
    const summary = await embeddingService.getBusinessKnowledgeSummary(agentId)

    return NextResponse.json({
      success: true,
      data: {
        agentId,
        agentName: agent.name,
        deletedMemoryId: memoryId,
        knowledgeSummary: summary
      }
    })

  } catch (error) {
    console.error('Error deleting memory:', error)
    return NextResponse.json(
      { error: 'Failed to delete memory' },
      { status: 500 }
    )
  }
} 