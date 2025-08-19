import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

// PUT: Update an existing intake form
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; formId: string  }> }
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { id: organizationId } = await params;
    const { formId: formId } = await params;
    const { name, description, formio_definition } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 })
    }

    if (!formio_definition) {
      return NextResponse.json({ error: 'Missing required field: formio_definition' }, { status: 400 })
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

    // Update the intake form
    const { data: form, error } = await supabase
      .from('intake_forms')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        fields: [], // Empty array for form.io forms (legacy field)
        formio_definition: formio_definition,
        updated_at: new Date().toISOString()
      })
      .eq('id', formId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating intake form:', error)
      return NextResponse.json({ error: 'Failed to update form' }, { status: 500 })
    }

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json({ form })

  } catch (error) {
    console.error('Intake form PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: Update specific properties of a form (like is_active status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; formId: string  }> }
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { id: organizationId } = await params;
    const { formId: formId } = await params;
    const { is_active } = await request.json()

    if (typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 })
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

    // Update the form status
    const { data: form, error } = await supabase
      .from('intake_forms')
      .update({
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', formId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating intake form status:', error)
      return NextResponse.json({ error: 'Failed to update form status' }, { status: 500 })
    }

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json({ form })

  } catch (error) {
    console.error('Intake form PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete an intake form
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; formId: string  }> }
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { id: organizationId } = await params;
    const { formId: formId } = await params;

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

    // Delete the intake form (this will cascade delete responses due to foreign key)
    const { error } = await supabase
      .from('intake_forms')
      .delete()
      .eq('id', formId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting intake form:', error)
      return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Form deleted successfully' })

  } catch (error) {
    console.error('Intake form DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}