import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

// POST: Submit a response to an intake form (public endpoint for clients)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string  }> }
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { formId: formId } = await params;
    const { responses, clientName, clientEmail, anonymousUserId } = await request.json()

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json({ error: 'Responses object is required' }, { status: 400 })
    }

    // Fetch the form to validate it exists and is active
    const { data: form, error: formError } = await supabase
      .from('intake_forms')
      .select('id, organization_id, name, fields, is_active')
      .eq('id', formId)
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (!form.is_active) {
      return NextResponse.json({ error: 'This form is no longer accepting responses' }, { status: 400 })
    }

    // Validate that all required fields have responses
    const fields = form.fields as any[]
    const requiredFields = fields.filter(field => field.required)
    
    for (const field of requiredFields) {
      if (!responses[field.name] || (typeof responses[field.name] === 'string' && responses[field.name].trim() === '')) {
        return NextResponse.json({ 
          error: `Required field "${field.label}" is missing or empty` 
        }, { status: 400 })
      }
    }

    // Check if this anonymous user has already submitted this form (to prevent duplicates)
    if (anonymousUserId) {
      const { data: existingResponse, error: checkError } = await supabase
        .from('intake_form_responses')
        .select('id')
        .eq('form_id', formId)
        .eq('anonymous_user_id', anonymousUserId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error checking existing response:', checkError)
      }

      if (existingResponse) {
        return NextResponse.json({ 
          error: 'You have already submitted this form' 
        }, { status: 409 })
      }
    }

    // Insert the form response
    const { data: response, error } = await supabase
      .from('intake_form_responses')
      .insert({
        form_id: formId,
        organization_id: form.organization_id,
        client_name: clientName?.trim() || null,
        client_email: clientEmail?.trim() || null,
        responses: responses,
        anonymous_user_id: anonymousUserId || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error submitting form response:', error)
      return NextResponse.json({ error: 'Failed to submit form response' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Form submitted successfully',
      response_id: response.id
    }, { status: 201 })

  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}