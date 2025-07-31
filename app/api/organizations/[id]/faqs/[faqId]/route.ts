import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// GET: Fetch a specific FAQ tool
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; faqId: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const { id: orgId, faqId } = params

    const { data: faq, error } = await supabase
      .from('faqs_tool')
      .select('*')
      .eq('id', faqId)
      .eq('organization_id', orgId)
      .single()

    if (error || !faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 })
    }

    return NextResponse.json({ faq })

  } catch (error) {
    console.error('FAQ GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update a specific FAQ tool
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; faqId: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const { id: orgId, faqId } = params
    const body = await request.json()

    const { name, description, faq_items, is_active } = body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (faq_items !== undefined) updateData.faq_items = faq_items
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: faq, error } = await supabase
      .from('faqs_tool')
      .update(updateData)
      .eq('id', faqId)
      .eq('organization_id', orgId)
      .select()
      .single()

    if (error) {
      console.error('Error updating FAQ:', error)
      return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 })
    }

    if (!faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 })
    }

    return NextResponse.json({ faq })

  } catch (error) {
    console.error('FAQ PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete a specific FAQ tool
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; faqId: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const { id: orgId, faqId } = params

    const { error } = await supabase
      .from('faqs_tool')
      .delete()
      .eq('id', faqId)
      .eq('organization_id', orgId)

    if (error) {
      console.error('Error deleting FAQ:', error)
      return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 })
    }

    return NextResponse.json({ message: 'FAQ deleted successfully' })

  } catch (error) {
    console.error('FAQ DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}