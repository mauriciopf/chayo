import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params;
  try {
    const supabase = await getSupabaseServerClient();


    // Get active agent tools using the database function
    const { data, error } = await supabase
      .rpc('get_organization_agent_tools', {
        org_id: organizationId
      })

    if (error) {
      console.error('Error fetching active agent tools:', error)
      return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 })
    }

    // Filter to only return enabled tools
    const activeTools: Record<string, boolean> = {}
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