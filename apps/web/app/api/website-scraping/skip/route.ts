import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await request.json()

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the organization belongs to the user
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .eq('owner_id', user.id)
      .single()

    if (orgError || !organization) {
      console.error('Organization access error:', orgError)
      return NextResponse.json(
        { error: 'Organization not found or access denied' },
        { status: 403 }
      )
    }

    console.log('🌐 [API] User chose to skip website scraping for organization:', organizationId)

    // Update organization state to 'skipped'
    await supabase
      .from('organizations')
      .update({ website_scraping_state: 'skipped' })
      .eq('id', organizationId)

    return NextResponse.json({
      success: true,
      message: 'Website scraping skipped. Continuing with standard onboarding.'
    })

  } catch (error) {
    console.error('❌ Website scraping skip API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}