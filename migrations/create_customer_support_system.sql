-- Customer Support System Database Schema
-- Implements realtime customer support with conversation management

BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customer Support Conversations Table
CREATE TABLE IF NOT EXISTS customer_support_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email TEXT,
    customer_name TEXT,
    subject TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    last_customer_message_at TIMESTAMPTZ,
    last_agent_message_at TIMESTAMPTZ,
    
    -- Indexes for performance
    CONSTRAINT valid_customer_info CHECK (
        customer_id IS NOT NULL OR customer_email IS NOT NULL
    )
);

-- Customer Support Messages Table
CREATE TABLE IF NOT EXISTS customer_support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES customer_support_conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system')),
    sender_name TEXT,
    sender_email TEXT,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'typing')),
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- For message threading/replies
    reply_to_id UUID REFERENCES customer_support_messages(id) ON DELETE SET NULL,
    
    -- For read receipts
    read_by JSONB DEFAULT '{}', -- {user_id: timestamp}
    
    -- Ensure we have sender info
    CONSTRAINT valid_sender_info CHECK (
        sender_id IS NOT NULL OR sender_email IS NOT NULL
    )
);

-- Customer Support Read Receipts (for tracking what each participant has read)
CREATE TABLE IF NOT EXISTS customer_support_read_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES customer_support_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT, -- For non-authenticated customers
    last_read_message_id UUID REFERENCES customer_support_messages(id) ON DELETE SET NULL,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicates
    UNIQUE(conversation_id, user_id, user_email),
    
    -- Ensure we have user identification
    CONSTRAINT valid_user_info CHECK (
        user_id IS NOT NULL OR user_email IS NOT NULL
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_support_conversations_org_id ON customer_support_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_support_conversations_customer_id ON customer_support_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_support_conversations_status ON customer_support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_customer_support_conversations_updated_at ON customer_support_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_support_conversations_last_message_at ON customer_support_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_support_messages_conversation_id ON customer_support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_customer_support_messages_created_at ON customer_support_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_support_messages_sender_id ON customer_support_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_customer_support_messages_sender_type ON customer_support_messages(sender_type);

CREATE INDEX IF NOT EXISTS idx_customer_support_read_receipts_conversation_id ON customer_support_read_receipts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_customer_support_read_receipts_user_id ON customer_support_read_receipts(user_id);

-- Triggers to update timestamps
CREATE OR REPLACE FUNCTION update_customer_support_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE customer_support_conversations 
    SET 
        updated_at = NOW(),
        last_message_at = NOW(),
        last_customer_message_at = CASE 
            WHEN NEW.sender_type = 'customer' THEN NOW() 
            ELSE OLD.last_customer_message_at 
        END,
        last_agent_message_at = CASE 
            WHEN NEW.sender_type = 'agent' THEN NOW() 
            ELSE OLD.last_agent_message_at 
        END
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on message insert
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON customer_support_messages;
CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT ON customer_support_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_support_conversation_timestamp();

-- Function to get conversation with unread count
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
            conversation_id,
            COUNT(*) as unread_count
        FROM customer_support_messages m
        LEFT JOIN customer_support_read_receipts r ON (
            r.conversation_id = m.conversation_id 
            AND r.user_id = get_customer_support_conversations.user_id
        )
        WHERE r.last_read_message_id IS NULL 
           OR m.created_at > r.last_read_at
        GROUP BY conversation_id
    ) unread ON unread.conversation_id = c.id
    LEFT JOIN (
        SELECT DISTINCT ON (conversation_id)
            conversation_id,
            content,
            sender_type
        FROM customer_support_messages
        ORDER BY conversation_id, created_at DESC
    ) last_msg ON last_msg.conversation_id = c.id
    WHERE c.organization_id = org_id
    ORDER BY c.last_message_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark conversation as read
CREATE OR REPLACE FUNCTION mark_customer_support_conversation_read(
    conversation_id UUID,
    user_id UUID,
    user_email TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    latest_message_id UUID;
BEGIN
    -- Get the latest message ID in this conversation
    SELECT id INTO latest_message_id
    FROM customer_support_messages
    WHERE customer_support_messages.conversation_id = mark_customer_support_conversation_read.conversation_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Upsert read receipt
    INSERT INTO customer_support_read_receipts (
        conversation_id, 
        user_id, 
        user_email, 
        last_read_message_id, 
        last_read_at
    )
    VALUES (
        mark_customer_support_conversation_read.conversation_id,
        mark_customer_support_conversation_read.user_id,
        mark_customer_support_conversation_read.user_email,
        latest_message_id,
        NOW()
    )
    ON CONFLICT (conversation_id, user_id, user_email) 
    DO UPDATE SET
        last_read_message_id = latest_message_id,
        last_read_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies
ALTER TABLE customer_support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_support_read_receipts ENABLE ROW LEVEL SECURITY;

-- Conversations: Organization members can see all, customers can see their own
CREATE POLICY "Organizations can manage their support conversations" ON customer_support_conversations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM team_members 
            WHERE user_id = auth.uid() 
            AND status = 'active'
        )
    );

CREATE POLICY "Customers can see their own conversations" ON customer_support_conversations
    FOR SELECT USING (customer_id = auth.uid());

-- Messages: Same pattern as conversations
CREATE POLICY "Organizations can manage their support messages" ON customer_support_messages
    FOR ALL USING (
        conversation_id IN (
            SELECT id 
            FROM customer_support_conversations 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM team_members 
                WHERE user_id = auth.uid() 
                AND status = 'active'
            )
        )
    );

CREATE POLICY "Customers can see messages in their conversations" ON customer_support_messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id 
            FROM customer_support_conversations 
            WHERE customer_id = auth.uid()
        )
    );

-- Read receipts: Users can manage their own read status
CREATE POLICY "Users can manage their own read receipts" ON customer_support_read_receipts
    FOR ALL USING (user_id = auth.uid());

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE customer_support_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE customer_support_messages;

COMMIT;

-- Verify tables were created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename LIKE 'customer_support_%'
ORDER BY tablename;
