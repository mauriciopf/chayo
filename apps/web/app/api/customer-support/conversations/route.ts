import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/shared/supabase/server';

// Type definition for customer support conversation from database function
interface CustomerSupportConversation {
  id: string;
  organization_id: string;
  customer_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  subject: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_customer_message_at: string | null;
  last_agent_message_at: string | null;
  unread_count: number;
  last_message_content: string | null;
  last_message_sender_type: 'customer' | 'agent' | 'system' | null;
}

// GET: List customer support conversations for an organization
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('team_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'No organization access' }, { status: 403 });
    }

    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    // Get conversations using the database function
    const { data: conversations, error } = await supabase
      .rpc('get_customer_support_conversations', {
        org_id: membership.organization_id,
        user_id: user.id,
        limit_count: limit,
        offset_count: offset
      });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Apply additional filters if specified
    let filteredConversations: CustomerSupportConversation[] = (conversations as CustomerSupportConversation[]) || [];
    
    if (status) {
      filteredConversations = filteredConversations.filter((conv: CustomerSupportConversation) => conv.status === status);
    }
    
    if (priority) {
      filteredConversations = filteredConversations.filter((conv: CustomerSupportConversation) => conv.priority === priority);
    }

    return NextResponse.json({
      conversations: filteredConversations,
      pagination: {
        limit,
        offset,
        total: filteredConversations.length
      }
    });

  } catch (error) {
    console.error('Customer support conversations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new customer support conversation
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const body = await request.json();

    const {
      organizationId,
      customerId,
      customerEmail,
      customerName,
      subject,
      initialMessage,
      priority = 'normal'
    } = body;

    // Validate required fields
    if (!organizationId || !subject || !initialMessage) {
      return NextResponse.json({ 
        error: 'Missing required fields: organizationId, subject, initialMessage' 
      }, { status: 400 });
    }

    // Validate customer info
    if (!customerId && !customerEmail) {
      return NextResponse.json({ 
        error: 'Either customerId or customerEmail is required' 
      }, { status: 400 });
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('customer_support_conversations')
      .insert({
        organization_id: organizationId,
        customer_id: customerId,
        customer_email: customerEmail,
        customer_name: customerName,
        subject,
        priority,
        status: 'open'
      })
      .select()
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // Create initial message
    const { data: message, error: msgError } = await supabase
      .from('customer_support_messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: customerId,
        sender_type: 'customer',
        sender_name: customerName,
        sender_email: customerEmail,
        content: initialMessage,
        message_type: 'text'
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error creating initial message:', msgError);
      return NextResponse.json({ error: 'Failed to create initial message' }, { status: 500 });
    }

    // Broadcast new conversation to organization channel
    try {
      await supabase.channel(`org_${organizationId}_support`)
        .send({
          type: 'broadcast',
          event: 'new_conversation',
          payload: {
            conversation,
            initialMessage: message
          }
        });
    } catch (broadcastError) {
      console.warn('Failed to broadcast new conversation:', broadcastError);
      // Don't fail the API call if broadcast fails
    }

    return NextResponse.json({
      conversation,
      initialMessage: message
    });

  } catch (error) {
    console.error('Customer support conversation creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
