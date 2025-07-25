import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Authentication using server supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId, locale = 'en' } = await req.json()

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Verify user has access to this organization using the same logic as RLS policies
    const { data: userOrgs, error: orgError } = await supabase
      .rpc('get_user_organization_ids', { user_id: user.id })

    console.log('Business Info Fields API Debug:', {
      userId: user.id,
      organizationId,
      userOrgs,
      orgError,
      hasAccess: userOrgs?.includes(organizationId)
    })

    if (orgError || !userOrgs || !userOrgs.includes(organizationId)) {
      return NextResponse.json({ 
        error: 'Access denied to organization',
        debug: {
          userId: user.id,
          organizationId,
          userOrgs,
          orgError: orgError?.message
        }
      }, { status: 403 })
    }

    // Check if business_name is already answered or pending
    const { data: existingFields, error: checkError } = await supabase
      .from('business_info_fields')
      .select('field_name, is_answered')
      .eq('organization_id', organizationId)
      .in('field_name', ['business_name'])

    if (checkError) {
      console.error('Error checking existing business info fields:', checkError)
      return NextResponse.json({ error: 'Failed to check existing fields' }, { status: 500 })
    }

    // For new organizations, we don't create any questions here
    // Questions will be generated dynamically by the AI when the user starts chatting
    console.log('Organization ready for dynamic question generation')

    return NextResponse.json({ 
      success: true,
      message: 'Business info fields initialized successfully'
    })
  } catch (error) {
    console.error('Error in business info fields API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 