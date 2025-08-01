import { getSupabaseServerClient } from '@/lib/shared/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse the request body
    const body = await request.json()
    const { name, greeting, tone, goals, system_prompt } = body

    // Validate required fields
    if (!name || !greeting) {
      return NextResponse.json(
        { error: 'Name and greeting are required' },
        { status: 400 }
      )
    }

    // Filter out empty goals
    const filteredGoals = goals?.filter((goal: string) => goal.trim() !== '') || []

    // Get user's organization
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    let organizationId = null
    if (membership && !membershipError) {
      organizationId = membership.organization_id
    }

    // Note: If no organization exists, it will be created by the dashboard on login
    // The agent will be updated later via the setup API when organization is created

    // Insert the agent into the database
    const { data: agent, error: insertError } = await supabase
      .from('agents')
      .insert({
        user_id: user.id,
        name: name.trim(),
        greeting: greeting.trim(),
        tone: tone || 'professional',
        goals: filteredGoals,
        system_prompt: system_prompt?.trim() || '',
        paused: false,
        organization_id: organizationId
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create agent' },
        { status: 500 }
      )
    }

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user's agents
    const { data: agents, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Database error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      )
    }

    return NextResponse.json({ agents }, { status: 200 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
