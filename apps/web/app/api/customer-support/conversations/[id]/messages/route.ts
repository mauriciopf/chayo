import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/shared/supabase/server';

// GET: Get messages for a specific conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const before = searchParams.get('before'); // For pagination

    // Verify user has access to this conversation
    const { data: conversation } = await supabase
      .from('customer_support_conversations')
      .select('id, organization_id, customer_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
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

    // Build query for messages
    let query = supabase
      .from('customer_support_messages')
      .select(`
        id,
        sender_id,
        sender_type,
        sender_name,
        sender_email,
        content,
        message_type,
        attachments,
        created_at,
        updated_at,
        reply_to_id
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // Apply pagination
    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query.limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Mark conversation as read for this user
    if (messages && messages.length > 0) {
      await supabase.rpc('mark_customer_support_conversation_read', {
        conversation_id: conversationId,
        user_id: user.id
      });
    }

    return NextResponse.json({
      messages: messages || [],
      pagination: {
        limit,
        offset,
        hasMore: messages && messages.length === limit
      }
    });

  } catch (error) {
    console.error('Customer support messages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Send a new message in a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await getSupabaseServerClient();
    const body = await request.json();

    const {
      content,
      messageType = 'text',
      attachments = [],
      replyToId
    } = body;

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this conversation
    const { data: conversation } = await supabase
      .from('customer_support_conversations')
      .select('id, organization_id, customer_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Determine sender type and verify access
    let senderType: 'customer' | 'agent';
    const isCustomer = conversation.customer_id === user.id;
    
    if (isCustomer) {
      senderType = 'customer';
    } else {
      // Check if user is organization member
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
      
      senderType = 'agent';
    }

    // Get user profile for sender info
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // Create message
    const { data: message, error: msgError } = await supabase
      .from('customer_support_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: senderType,
        sender_name: profile?.full_name || 'Unknown',
        sender_email: profile?.email || user.email,
        content: content.trim(),
        message_type: messageType,
        attachments,
        reply_to_id: replyToId
      })
      .select(`
        id,
        sender_id,
        sender_type,
        sender_name,
        sender_email,
        content,
        message_type,
        attachments,
        created_at,
        updated_at,
        reply_to_id
      `)
      .single();

    if (msgError) {
      console.error('Error creating message:', msgError);
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }

    // Broadcast message to conversation channel
    try {
      const channelName = `conversation_${conversationId}`;
      await supabase.channel(channelName)
        .send({
          type: 'broadcast',
          event: 'new_message',
          payload: message
        });

      // Also broadcast to organization channel for dashboard updates
      await supabase.channel(`org_${conversation.organization_id}_support`)
        .send({
          type: 'broadcast',
          event: 'conversation_updated',
          payload: {
            conversationId,
            lastMessage: message
          }
        });
    } catch (broadcastError) {
      console.warn('Failed to broadcast message:', broadcastError);
      // Don't fail the API call if broadcast fails
    }

    return NextResponse.json({ message });

  } catch (error) {
    console.error('Customer support message creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
