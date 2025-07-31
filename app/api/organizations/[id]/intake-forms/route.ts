import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// GET: Fetch all intake forms for an organization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const organizationId = params.id

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a member of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch intake forms for the organization
    const { data: forms, error } = await supabase
      .from('intake_forms')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching intake forms:', error)
      return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 })
    }

    return NextResponse.json({ forms })

  } catch (error) {
    console.error('Intake forms GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create a new intake form
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const organizationId = params.id
    const { name, description, fields } = await request.json()

    if (!name || !fields || !Array.isArray(fields)) {
      return NextResponse.json({ error: 'Missing required fields: name, fields' }, { status: 400 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a member of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validate fields structure
    for (const field of fields) {
      if (!field.id || !field.name || !field.label || !field.type) {
        return NextResponse.json({ 
          error: 'Invalid field structure. Each field must have id, name, label, and type' 
        }, { status: 400 })
      }
    }

    // Create the intake form
    const { data: form, error } = await supabase
      .from('intake_forms')
      .insert({
        organization_id: organizationId,
        name: name.trim(),
        description: description?.trim() || null,
        fields: fields,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating intake form:', error)
      return NextResponse.json({ error: 'Failed to create form' }, { status: 500 })
    }

    return NextResponse.json({ form }, { status: 201 })

  } catch (error) {
    console.error('Intake forms POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}