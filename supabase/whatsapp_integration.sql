-- Add WhatsApp channel integration tables and columns

-- Add columns to agent_channels table if they don't exist
ALTER TABLE agent_channels 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS number_flow TEXT DEFAULT 'existing' CHECK (number_flow IN ('new', 'existing')),
ADD COLUMN IF NOT EXISTS twilio_messaging_service_sid TEXT,
ADD COLUMN IF NOT EXISTS twilio_phone_number_sid TEXT,
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_verification',
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS credentials JSONB DEFAULT '{}'::jsonb;

-- Create messages table for storing chat history
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES agent_channels(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  from_number TEXT,
  to_number TEXT,
  twilio_message_sid TEXT UNIQUE,
  parent_message_id UUID REFERENCES messages(id),
  status TEXT DEFAULT 'sent',
  error_code TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_agent_id ON messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_twilio_sid ON messages(twilio_message_sid);

-- Create index for agent_channels lookups
CREATE INDEX IF NOT EXISTS idx_agent_channels_phone ON agent_channels(phone_number, channel_type);
CREATE INDEX IF NOT EXISTS idx_agent_channels_user_id ON agent_channels(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT WITH CHECK (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- Add RLS policy for agent_channels user_id
CREATE POLICY "Users can view their own agent channels" ON agent_channels
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own agent channels" ON agent_channels
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own agent channels" ON agent_channels
  FOR UPDATE USING (user_id = auth.uid());

-- Update existing agent_channels records to have user_id
UPDATE agent_channels 
SET user_id = agents.user_id 
FROM agents 
WHERE agent_channels.agent_id = agents.id 
AND agent_channels.user_id IS NULL;
