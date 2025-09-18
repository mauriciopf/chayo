-- Comprehensive fix for customer support database issues

-- 1. Add customer_support to agent_tools table constraint
ALTER TABLE agent_tools DROP CONSTRAINT IF EXISTS agent_tools_tool_type_check;
ALTER TABLE agent_tools ADD CONSTRAINT agent_tools_tool_type_check 
    CHECK (tool_type IN ('appointments', 'documents', 'payments', 'intake_forms', 'faqs', 'mobile-branding', 'products', 'customer_support'));

-- 2. Fix ambiguous column references in get_customer_support_conversations function
CREATE OR REPLACE FUNCTION get_customer_support_conversations(
    org_id UUID,
    user_id UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    customer_id UUID,
    customer_email TEXT,
    customer_name TEXT,
    subject TEXT,
    status TEXT,
    priority TEXT,
    assigned_to UUID,
    tags TEXT[],
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ,
    last_customer_message_at TIMESTAMPTZ,
    last_agent_message_at TIMESTAMPTZ,
    unread_count BIGINT,
    last_message_content TEXT,
    last_message_sender_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.organization_id,
        c.customer_id,
        c.customer_email,
        c.customer_name,
        c.subject,
        c.status,
        c.priority,
        c.assigned_to,
        c.tags,
        c.created_at,
        c.updated_at,
        c.last_message_at,
        c.last_customer_message_at,
        c.last_agent_message_at,
        COALESCE(unread.unread_count, 0) as unread_count,
        last_msg.content as last_message_content,
        last_msg.sender_type as last_message_sender_type
    FROM customer_support_conversations c
    LEFT JOIN (
        SELECT 
            m.conversation_id,  -- Fixed: Qualified with table alias
            COUNT(*) as unread_count
        FROM customer_support_messages m
        LEFT JOIN customer_support_read_receipts r ON (
            r.conversation_id = m.conversation_id 
            AND r.user_id = get_customer_support_conversations.user_id  -- Fixed: Qualified with function name
        )
        WHERE r.last_read_message_id IS NULL 
           OR m.created_at > r.last_read_at
        GROUP BY m.conversation_id  -- Fixed: Qualified with table alias
    ) unread ON unread.conversation_id = c.id
    LEFT JOIN (
        SELECT DISTINCT ON (conversation_id)
            conversation_id,
            content,
            sender_type
        FROM customer_support_messages
        ORDER BY conversation_id, customer_support_messages.created_at DESC
    ) last_msg ON last_msg.conversation_id = c.id
    WHERE c.organization_id = org_id
    ORDER BY c.last_message_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
