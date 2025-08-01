import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from "@/lib/shared/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    // Authentication using server supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Get team members for the organization
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select(`
        *
      `)
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: false })

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
    }

    // Get user details for each member (we'll fetch from auth.users via admin client)
    // For now, return the members without user details
    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error in team members API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    // Authentication using server supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId, userId, role = 'member' } = await req.json()

    if (!organizationId || !userId) {
      return NextResponse.json({ error: 'Organization ID and User ID are required' }, { status: 400 })
    }

    // Check if user has permission to add members
    const { data: userMembership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !userMembership || !['owner', 'admin'].includes(userMembership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Add team member
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role,
        status: 'active',
        invited_by: user.id
      })
      .select()
      .single()

    if (memberError) {
      console.error('Error adding team member:', memberError)
      return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 })
    }

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Error in team members API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    // Authentication using server supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { memberId, role, status } = await req.json()

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    // Get the member to check organization
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('organization_id')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Check if user has permission to update members
    const { data: userMembership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('organization_id', member.organization_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !userMembership || !['owner', 'admin'].includes(userMembership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Update team member
    const updateData: any = {}
    if (role) updateData.role = role
    if (status) updateData.status = status

    const { data: updatedMember, error: updateError } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', memberId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating team member:', updateError)
      return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
    }

    return NextResponse.json({ member: updatedMember })
  } catch (error) {
    console.error('Error in team members API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    // Authentication using server supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    // Get the member to check organization
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('organization_id, user_id')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Check if user has permission to remove members
    const { data: userMembership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('organization_id', member.organization_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !userMembership || !['owner', 'admin'].includes(userMembership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Don't allow removing the organization owner
    const { data: targetMember, error: targetError } = await supabase
      .from('team_members')
      .select('role')
      .eq('id', memberId)
      .single()

    if (targetError || targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove organization owner' }, { status: 400 })
    }

    // Remove team member
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      console.error('Error removing team member:', deleteError)
      return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in team members API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
