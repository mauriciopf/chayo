import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

// GET: Fetch a specific intake form for public viewing (clients)
export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const formId = params.formId

    // Fetch the form with organization details
    const { data: form, error } = await supabase
      .from('intake_forms')
      .select(`
        id,
        name,
        description,
        fields,
        formio_definition,
        is_active,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq('id', formId)
      .single()

    if (error || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (!form.is_active) {
      return NextResponse.json({ 
        error: 'This form is no longer accepting responses',
        form: {
          id: form.id,
          name: form.name,
          is_active: false
        }
      }, { status: 400 })
    }

    // Extract organization data (handle both array and object cases)
    const organization = Array.isArray(form.organizations) ? form.organizations[0] : form.organizations

    // Return form data for public consumption (no sensitive org data)
    return NextResponse.json({ 
      form: {
        id: form.id,
        name: form.name,
        description: form.description,
        fields: form.fields, // Legacy field, empty for Form.io forms
        formio_definition: form.formio_definition,
        organization: {
          name: organization?.name,
          slug: organization?.slug
        }
      }
    })

  } catch (error) {
    console.error('Public form GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}