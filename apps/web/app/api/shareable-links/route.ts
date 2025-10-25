import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/shared/supabase/server'

// GET /api/shareable-links - Get link for specific content or all links for an organization
export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    
    const contentType = searchParams.get('contentType')
    const contentId = searchParams.get('contentId')
    const organizationId = searchParams.get('organizationId')

    // Get specific link
    if (contentType && contentId) {
      const { data: link, error } = await supabase
        .from('shareable_links')
        .select('*')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching link:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ link: link || null })
    }

    // Get all links for organization (for Hub de Enlaces)
    if (organizationId) {
      const { data: links, error } = await supabase
        .from('v_shareable_links_with_content')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching links:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ links: links || [] })
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/shareable-links - Create or update a shareable link
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()
    
    const { organizationId, contentType, contentId, contentName } = body

    if (!organizationId || !contentType || !contentId || !contentName) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, contentType, contentId, contentName' },
        { status: 400 }
      )
    }

    // Call the upsert function
    const { data, error } = await supabase.rpc('upsert_shareable_link', {
      p_organization_id: organizationId,
      p_content_type: contentType,
      p_content_id: contentId,
      p_content_name: contentName
    })

    if (error) {
      console.error('Error upserting link:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch the created/updated link
    const { data: link, error: fetchError } = await supabase
      .from('shareable_links')
      .select('*')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .single()

    if (fetchError) {
      console.error('Error fetching created link:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json({ link, full_url: data })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/shareable-links - Increment click count
export async function PATCH(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()
    
    const { linkId } = body

    if (!linkId) {
      return NextResponse.json({ error: 'Missing linkId' }, { status: 400 })
    }

    // Increment clicks
    const { error } = await supabase.rpc('increment_link_clicks', {
      p_link_id: linkId
    })

    if (error) {
      console.error('Error incrementing clicks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/shareable-links - Deactivate a link
export async function DELETE(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    
    const linkId = searchParams.get('linkId')

    if (!linkId) {
      return NextResponse.json({ error: 'Missing linkId' }, { status: 400 })
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('shareable_links')
      .update({ is_active: false })
      .eq('id', linkId)

    if (error) {
      console.error('Error deleting link:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

