import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const organizationId = params.id

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
      faqs: false
    })
  } catch (error) {
    console.error('Agent tools GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const organizationId = params.id
    const { toolType, enabled } = await request.json()

    // Validate tool type
    const validToolTypes = ['appointments', 'documents', 'payments', 'intake_forms', 'faqs']
    if (!validToolTypes.includes(toolType)) {
      return NextResponse.json({ error: 'Invalid tool type' }, { status: 400 })
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