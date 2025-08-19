import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

// GET: List all FAQ tools for an organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { id: orgId } = await params;

    const { data: faqs, error } = await supabase
      .from('faqs_tool')
      .select('*')
      .eq('organization_id', orgId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching FAQs:', error)
      return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 })
    }

    return NextResponse.json({ faqs })

  } catch (error) {
    console.error('FAQ GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create a new FAQ tool
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
) {
  try {
    const supabase = await getSupabaseServerClient();
    const { id: orgId } = await params;
    const body = await request.json()

    const { name, description, faq_items } = body

    if (!name) {
      return NextResponse.json({ error: 'FAQ name is required' }, { status: 400 })
    }

    const { data: faq, error } = await supabase
      .from('faqs_tool')
      .insert({
        organization_id: orgId,
        name,
        description: description || '',
        faq_items: faq_items || [], // Array of Q&A objects
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating FAQ:', error)
      return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 })
    }

    return NextResponse.json({ faq }, { status: 201 })

  } catch (error) {
    console.error('FAQ POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}