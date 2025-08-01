import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from "@/lib/shared/supabase/server"
import { generateSlugFromName } from '@/lib/shared/utils/text'

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    // Authentication using server supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if organizations table exists, if not, return setup instructions
    const { error: tableCheckError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      console.log('Organizations table not found, migration needed:', tableCheckError.message)
      return NextResponse.json({ 
        error: 'Database migration required',
        message: 'Please run the database migration script to enable team management',
        migrationRequired: true,
        migrationInstructions: `
To enable team management, please run the migration script:

1. Go to your Supabase Dashboard (https://supabase.com/dashboard)
2. Navigate to SQL Editor
3. Copy and paste the migration script from: migrations/add_team_management.sql
4. Run the script
5. Refresh this page

The migration script will:
- Create the necessary database tables
- Set up proper security policies
- Automatically create an organization for your account
- Preserve all existing data
        `
      }, { status: 400 })
    }

    // Check if user already has an organization (check both owner and member roles)
    const { data: existingMembership, error: membershipError } = await supabase
      .from('team_members')
      .select(`
        organization_id, 
        organizations!inner (
          id,
          name,
          slug,
          owner_id,
          plan_name,
          created_at,
          team_members (
            id,
            user_id,
            role,
            status,
            joined_at
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })
      .limit(1)
      .single()

    if (existingMembership && !membershipError) {
      return NextResponse.json({ 
        success: true,
        organization: existingMembership.organizations,
        message: 'Organization already exists',
        wasCreated: false
      })
    }

    // Create organization for user with retry logic for race conditions
    const emailPrefix = user.email?.split('@')[0] || 'user'
    const name = `${emailPrefix}'s Organization`
    const slug = generateSlugFromName(name)

    // Try to create organization, but handle race conditions
    let organization = null
    let orgError = null
    
    try {
      const { data: org, error: createError } = await supabase
        .from('organizations')
        .insert({
          name,
          slug,
          owner_id: user.id
        })
        .select()
        .single()
      
      organization = org
      orgError = createError
    } catch (error) {
      orgError = error
    }

    // If organization creation failed, check if another request already created one
    if (orgError) {
      console.log('Organization creation failed, checking for existing organization:', orgError)
      
      // Check again if organization was created by another concurrent request
      const { data: existingMembership2, error: membershipError2 } = await supabase
        .from('team_members')
        .select(`
          organization_id, 
          organizations!inner (
            id,
            name,
            slug,
            owner_id,
            plan_name,
            created_at,
            team_members (
              id,
              user_id,
              role,
              status,
              joined_at
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: true })
        .limit(1)
        .single()

      if (existingMembership2 && !membershipError2) {
        return NextResponse.json({ 
          success: true,
          organization: existingMembership2.organizations,
          message: 'Organization already exists',
          wasCreated: false
        })
      }
      
      // If still no organization found, return error
      console.error('Error creating organization:', orgError)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Add user as owner in team_members with race condition handling
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
      
      // Check if member already exists (race condition)
      const { data: existingMember, error: checkError } = await supabase
        .from('team_members')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
      
      if (!existingMember || checkError) {
        // Clean up organization if team member creation fails and no existing member
        await supabase.from('organizations').delete().eq('id', organization.id)
        return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
      }
      // If member exists, continue (race condition resolved)
    }

    // Update any existing agents to belong to this organization
    const { error: updateAgentsError } = await supabase
      .from('agents')
      .update({ organization_id: organization.id })
      .eq('user_id', user.id)
      .is('organization_id', null)

    if (updateAgentsError) {
      console.error('Error updating agents:', updateAgentsError)
    }

    // Fetch the complete organization with team members
    const { data: completeOrg, error: fetchError } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        owner_id,
        plan_name,
        created_at,
        team_members (
          id,
          user_id,
          role,
          status,
          joined_at
        )
      `)
      .eq('id', organization.id)
      .single()

    if (fetchError) {
      console.error('Error fetching complete organization:', fetchError)
      // Return the basic organization if fetching complete data fails
      return NextResponse.json({ 
        success: true,
        organization,
        message: 'Organization created successfully',
        wasCreated: true
      })
    }

    return NextResponse.json({ 
      success: true,
      organization: completeOrg,
      message: 'Organization created successfully',
      wasCreated: true
    })
  } catch (error) {
    console.error('Error in setup API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
