import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

// GET: Public access to active FAQs for client chat (by organization slug)
export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const supabase = getSupabaseServerClient()
    const orgSlug = params.orgSlug
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('search')

    // First get the organization by slug
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', orgSlug)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (searchQuery) {
      // Search specific FAQ items
      const { data: searchResults, error: searchError } = await supabase
        .rpc('search_faq_items', {
          org_id: org.id,
          search_query: searchQuery
        })

      if (searchError) {
        console.error('Error searching FAQs:', searchError)
        return NextResponse.json({ error: 'Failed to search FAQs' }, { status: 500 })
      }

      return NextResponse.json({ 
        faq_items: searchResults || [],
        search_query: searchQuery
      })
    } else {
      // Get all active FAQs for the organization
      const { data: faqs, error } = await supabase
        .from('faqs_tool')
        .select(`
          id,
          name,
          description,
          faq_items,
          updated_at
        `)
        .eq('organization_id', org.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching FAQs:', error)
        return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 })
      }

      return NextResponse.json({ 
        faqs: faqs || [],
        organization: { slug: orgSlug }
      })
    }

  } catch (error) {
    console.error('Public FAQ GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}