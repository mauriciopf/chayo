import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'
import { AgentToolConstraintsService } from '@/lib/features/tools/shared/services/agentToolConstraints'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params;
  try {
    const supabase = getSupabaseServerClient()

    // Get agent tools using the database function
    const { data, error } = await supabase
      .rpc('get_organization_agent_tools', {
        org_id: organizationId
      })

    if (error) {
      console.error('Error fetching agent tools:', error)
      return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 })
    }

    return NextResponse.json(data || {
      appointments: false,
      documents: false,
      payments: false,
      intake_forms: false,
      faqs: false,
      'mobile-branding': false
    })
  } catch (error) {
    console.error('Agent tools GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params;
  try {
    const supabase = getSupabaseServerClient()
    const { toolType, enabled } = await request.json()

    // Validate tool type
    const validToolTypes = ['appointments', 'documents', 'payments', 'intake_forms', 'faqs', 'mobile-branding']
    if (!validToolTypes.includes(toolType)) {
      return NextResponse.json({ error: 'Invalid tool type' }, { status: 400 })
    }

    // Check constraints before enabling a tool
    if (enabled) {
      const constraintResult = await AgentToolConstraintsService.checkToolConstraints(
        organizationId, 
        toolType, 
        supabase
      )

      if (!constraintResult.canEnable) {
        return NextResponse.json({ 
          error: 'Configuration required',
          reason: constraintResult.reason,
          missingConfig: constraintResult.missingConfig
        }, { status: 422 })
      }
    }

    // Update agent tool setting using the database function
    const { error } = await supabase
      .rpc('upsert_organization_agent_tool', {
        org_id: organizationId,
        tool: toolType,
        is_enabled: enabled
      })

    if (error) {
      console.error('Error updating agent tool:', error)
      return NextResponse.json({ error: 'Failed to update tool' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Agent tools POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}