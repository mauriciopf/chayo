import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Get pending invitations for the organization
    const { data: invitations, error: invitationsError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('organization_id', organizationId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError)
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
    }

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Error in invitations API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId, email, role = 'member' } = await req.json()

    if (!organizationId || !email) {
      return NextResponse.json({ error: 'Organization ID and email are required' }, { status: 400 })
    }

    // Check if user has permission to invite members
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

    // Check if email is already a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('team_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id) // This won't work for checking by email
    
    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .insert({
        organization_id: organizationId,
        email,
        role,
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (invitationError) {
      console.error('Error creating invitation:', invitationError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    // TODO: Send invitation email
    // In a real app, you would send an email with the invitation link here
    // For now, we'll just return the invitation

    return NextResponse.json({ invitation })
  } catch (error) {
    console.error('Error in invitations API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Get invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 })
    }

    // Check if user email matches invitation email
    if (user.email !== invitation.email) {
      return NextResponse.json({ error: 'Email does not match invitation' }, { status: 400 })
    }

    // Check if user is already a member
    const { data: existingMember, error: memberError } = await supabase
      .from('team_members')
      .select('id')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    // Add user to team
    const { data: member, error: memberInsertError } = await supabase
      .from('team_members')
      .insert({
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role,
        status: 'active',
        invited_by: invitation.invited_by
      })
      .select()
      .single()

    if (memberInsertError) {
      console.error('Error adding team member:', memberInsertError)
      return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
    }

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Error in invitations API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const invitationId = searchParams.get('invitationId')

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 })
    }

    // Get invitation to check organization
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .select('organization_id')
      .eq('id', invitationId)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Check if user has permission to cancel invitations
    const { data: userMembership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !userMembership || !['owner', 'admin'].includes(userMembership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Delete invitation
    const { error: deleteError } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId)

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError)
      return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in invitations API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
