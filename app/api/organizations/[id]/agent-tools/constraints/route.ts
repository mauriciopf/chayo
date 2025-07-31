import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { AgentToolConstraintsService } from '@/lib/services/agentToolConstraints'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const organizationId = params.id
    const { searchParams } = new URL(request.url)
    const toolType = searchParams.get('toolType')

    if (!toolType) {
      return NextResponse.json({ error: 'Tool type required' }, { status: 400 })
    }

    // Validate tool type
    const validToolTypes = ['appointments', 'documents', 'payments', 'intake_forms', 'faqs']
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