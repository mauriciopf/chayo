import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    // If slug is provided, fetch organization by slug (public endpoint)
    if (slug) {
      const { data: organizations, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug, created_at')
        .eq('slug', slug)
        .limit(1)

      if (orgError) {
        console.error('Error fetching organization by slug:', orgError)
        return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
      }

      return NextResponse.json({ organizations })
    }

    // Otherwise, get user's organizations (authenticated endpoint)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organizations and team members
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select(`
        *,
        team_members(
          id,
          user_id,
          role,
          status,
          joined_at
        )
      `)
      .order('created_at', { ascending: false })

    if (orgError) {
      console.error('Error fetching organizations:', orgError)
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
    }

    return NextResponse.json({ organizations })
  } catch (error) {
    console.error('Error in organizations API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, slug } = await req.json()

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        owner_id: user.id
      })
      .select()
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Add user as owner in team_members
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        organization_id: organization.id,
        user_id: user.id,
        role: 'owner',
        status: 'active'
      })

    if (memberError) {
      console.error('Error adding team member:', memberError)
      // Clean up organization if team member creation fails
      await supabase.from('organizations').delete().eq('id', organization.id)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    return NextResponse.json({ organization })
  } catch (error) {
    console.error('Error in organizations API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
