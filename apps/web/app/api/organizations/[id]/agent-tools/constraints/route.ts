import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'
import { AgentToolConstraintsService } from '@/lib/features/tools/shared/services/agentToolConstraints'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params;
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const toolType = searchParams.get('toolType')

    if (!toolType) {
      return NextResponse.json({ error: 'Tool type required' }, { status: 400 })
    }

    // Validate tool type
    const validToolTypes = ['appointments', 'documents', 'payments', 'intake_forms', 'faqs', 'mobile-branding', 'products']
    if (!validToolTypes.includes(toolType)) {
      return NextResponse.json({ error: 'Invalid tool type' }, { status: 400 })
    }

    // Check constraints for the specified tool
    const constraintResult = await AgentToolConstraintsService.checkToolConstraints(
      organizationId, 
      toolType, 
      supabase
    )


    return NextResponse.json(constraintResult)
  } catch (error) {
    console.error('Agent tools constraints GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}