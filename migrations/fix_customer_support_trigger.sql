-- Migration: Fix customer support conversation timestamp trigger
-- The trigger was trying to reference OLD.last_customer_message_at which doesn't exist
-- because OLD refers to the message record, not the conversation record

-- Drop and recreate the trigger function with proper logic
CREATE OR REPLACE FUNCTION update_customer_support_conversation_timestamp()
RETURNS TRIGGER AS $$
DECLARE
    current_last_customer_msg TIMESTAMPTZ;
    current_last_agent_msg TIMESTAMPTZ;
BEGIN
    -- Get current values from the conversation
    SELECT last_customer_message_at, last_agent_message_at
    INTO current_last_customer_msg, current_last_agent_msg
    FROM customer_support_conversations
    WHERE id = NEW.conversation_id;
    
    -- Update the conversation with new timestamp
    UPDATE customer_support_conversations 
    SET 
        updated_at = NOW(),
        last_message_at = NOW(),
        last_customer_message_at = CASE 
            WHEN NEW.sender_type = 'customer' THEN NOW() 
            ELSE current_last_customer_msg
        END,
        last_agent_message_at = CASE 
            WHEN NEW.sender_type = 'agent' THEN NOW() 
            ELSE current_last_agent_msg
        END
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
