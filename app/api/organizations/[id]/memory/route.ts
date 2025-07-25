import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/server'
import { embeddingService } from '@/lib/services/embeddingService'

// 🔍 GET - Get memory conflicts and analysis
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = params.id
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') // 'conflicts' or 'summary'
    const threshold = parseFloat(searchParams.get('threshold') || '0.85')

    // Get user from auth
    // Authentication using server supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has access to organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('organization_id, role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Organization access denied' },
        { status: 403 }
      )
    }

    // Get organization name
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get memory summary
    const summary = await embeddingService.getBusinessKnowledgeSummary(organizationId)
    return NextResponse.json({
      success: true,
      data: {
        organizationId,
        organizationName: organization.name,
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
    const organizationId = params.id
    const { memoryId } = await request.json()

    if (!memoryId) {
      return NextResponse.json(
        { error: 'Memory ID is required' },
        { status: 400 }
      )
    }

    // Get user from auth
    // Authentication using server supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has access to organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('organization_id, role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Organization access denied' },
        { status: 403 }
      )
    }

    // Get organization name
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Delete the specific memory
    const success = await embeddingService.deleteMemory(organizationId, memoryId)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete memory' },
        { status: 500 }
      )
    }

    // Get updated summary
    const summary = await embeddingService.getBusinessKnowledgeSummary(organizationId)

    return NextResponse.json({
      success: true,
      data: {
        organizationId,
        organizationName: organization.name,
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