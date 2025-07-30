import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const organizationId = params.id

    // Get active agent tools (public endpoint - no auth required for client chat)
    const { data, error } = await supabase
      .rpc('get_organization_agent_tools', {
        org_id: organizationId
      })

    if (error) {
      console.error('Error fetching active agent tools:', error)
      return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 })
    }

    // Filter to only return enabled tools
    const activeTools = {}
    if (data) {
      Object.keys(data).forEach(key => {
        if (data[key] === true) {
          activeTools[key] = true
        }
      })
    }

    return NextResponse.json(activeTools)
  } catch (error) {
    console.error('Active agent tools GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}