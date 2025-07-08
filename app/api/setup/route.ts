import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { supabase } = createClient(req)
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
      return NextResponse.json({ 
        error: 'Database tables not found',
        message: 'Please run the database migration script first',
        migrationInstructions: `
1. Go to your Supabase Dashboard (https://supabase.com/dashboard)
2. Navigate to SQL Editor
3. Copy and paste the migration script from: migrations/add_team_management.sql
4. Run the script
5. Refresh this page
        `
      }, { status: 400 })
    }

    // Check if user already has an organization
    const { data: existingMembership, error: membershipError } = await supabase
      .from('team_members')
      .select('organization_id, organizations(*)')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .eq('status', 'active')
      .single()

    if (existingMembership && !membershipError) {
      return NextResponse.json({ 
        success: true,
        organization: existingMembership.organizations,
        message: 'Organization already exists'
      })
    }

    // Create organization for user
    const emailPrefix = user.email?.split('@')[0] || 'user'
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const slug = `${emailPrefix.replace(/[^a-zA-Z0-9]/g, '')}-${randomSuffix}`
    const name = `${emailPrefix}'s Organization`

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

    // Update any existing agents to belong to this organization
    const { error: updateAgentsError } = await supabase
      .from('agents')
      .update({ organization_id: organization.id })
      .eq('user_id', user.id)
      .is('organization_id', null)

    if (updateAgentsError) {
      console.error('Error updating agents:', updateAgentsError)
    }

    return NextResponse.json({ 
      success: true,
      organization,
      message: 'Organization created successfully'
    })
  } catch (error) {
    console.error('Error in setup API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
