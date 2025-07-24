import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BusinessInfoService } from '@/lib/services/businessInfoService'

export async function POST(req: NextRequest) {
  try {
    const { supabase } = createClient(req)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId, conversation = '' } = await req.json()

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Verify user has access to this organization
    const { data: userOrgs, error: orgError } = await supabase
      .rpc('get_user_organization_ids', { user_id: user.id })

    if (orgError || !userOrgs || !userOrgs.includes(organizationId)) {
      return NextResponse.json({ error: 'Access denied to organization' }, { status: 403 })
    }

    // Generate questions using the server-side BusinessInfoService
    const businessInfoService = new BusinessInfoService(supabase)
    const questions = await businessInfoService.generateBusinessQuestions(organizationId, conversation)

    return NextResponse.json({ 
      success: true,
      questions
    })
  } catch (error) {
    console.error('Error generating business questions:', error)
    return NextResponse.json({ 
      error: 'Failed to generate business questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 