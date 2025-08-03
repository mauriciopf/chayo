import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'
import { SimpleClientInsightsService } from '@/lib/features/insights/services/SimpleClientInsightsService'

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = await req.json()

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Verify user has access to this organization
    const { data: organization } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single()

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get insights using server-side client
    const insightsService = new SimpleClientInsightsService(supabase)
    const summary = await insightsService.getWeeklySummary(organizationId)

    return NextResponse.json({ summary })

  } catch (error) {
    console.error('Client insights API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}