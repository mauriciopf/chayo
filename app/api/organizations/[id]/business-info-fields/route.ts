import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = params.id
    const { supabase } = createClient(request)
    
    // Get user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get business info fields from business_constraints_view (organization level)
    const { data: viewData, error: viewError } = await supabase
      .from('business_constraints_view')
      .select('business_constraints')
      .eq('organization_id', organizationId)
      .single()

    if (viewError) {
      console.error('Error fetching business constraints:', viewError)
      return NextResponse.json({ error: 'Failed to fetch business info' }, { status: 500 })
    }

    // Extract answered business info fields from constraints
    const businessConstraints = viewData?.business_constraints || {}
    const fields = Object.entries(businessConstraints)
      .filter(([key, value]) => 
        // Filter out system fields and only include actual business info
        !['name', 'tone', 'industry', 'goals', 'values', 'policies', 'custom_rules', 
          'whatsapp_trial_mentioned', 'business_info_gathered', 'greeting', 'contact_info'].includes(key) &&
        value !== undefined && value !== null && value !== ''
      )
      .map(([fieldName, fieldValue]) => ({
        field_name: fieldName,
        field_value: fieldValue,
        is_answered: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

    return NextResponse.json({
      success: true,
      data: {
        organizationId,
        fields: fields || [],
        totalFields: fields?.length || 0
      }
    })

  } catch (error) {
    console.error('Error in organization business info fields API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 