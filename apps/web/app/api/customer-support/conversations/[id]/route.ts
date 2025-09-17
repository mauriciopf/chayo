import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/shared/supabase/server';

// GET: Get a specific conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await getSupabaseServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get conversation with access check
    const { data: conversation, error } = await supabase
      .from('customer_support_conversations')
      .select(`
        id,
        organization_id,
        customer_id,
        customer_email,
        customer_name,
        subject,
        status,
        priority,
        assigned_to,
        tags,
        created_at,
        updated_at,
        last_message_at
      `)
      .eq('id', conversationId)
      .single();

    if (error || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is organization member or the customer
    const isCustomer = conversation.customer_id === user.id;
    const { data: membership } = await supabase
      .from('team_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', conversation.organization_id)
      .eq('status', 'active')
      .single();

    if (!isCustomer && !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ conversation });

  } catch (error) {
    console.error('Customer support conversation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update conversation status, priority, or assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await getSupabaseServerClient();
    const body = await request.json();

    const { status, priority, assigned_to, tags } = body;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this conversation (organization members only)
    const { data: conversation } = await supabase
      .from('customer_support_conversations')
      .select('organization_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('team_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', conversation.organization_id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build update object
    const updates: any = { updated_at: new Date().toISOString() };
    
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;
    if (tags !== undefined) updates.tags = tags;

    // Update conversation
    const { data: updatedConversation, error: updateError } = await supabase
      .from('customer_support_conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
    }

    // Broadcast update to organization channel
    await supabase.channel(`org_${conversation.organization_id}_support`)
      .send({
        type: 'broadcast',
        event: 'conversation_updated',
        payload: {
          conversationId,
          updates: updatedConversation
        }
      });

    return NextResponse.json({ conversation: updatedConversation });

  } catch (error) {
    console.error('Customer support conversation update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
