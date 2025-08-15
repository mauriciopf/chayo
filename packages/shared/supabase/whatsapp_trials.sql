-- WhatsApp Trials Table
-- This table tracks trial users for WhatsApp channels with 3-day trials

CREATE TABLE whatsapp_trials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  twilio_number_sid TEXT NOT NULL UNIQUE,
  trial_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_end_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '3 days'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'released')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_whatsapp_trials_user_id ON whatsapp_trials(user_id);
CREATE INDEX idx_whatsapp_trials_status ON whatsapp_trials(status);
CREATE INDEX idx_whatsapp_trials_trial_end_date ON whatsapp_trials(trial_end_date);
CREATE INDEX idx_whatsapp_trials_twilio_sid ON whatsapp_trials(twilio_number_sid);

-- RLS policies
ALTER TABLE whatsapp_trials ENABLE ROW LEVEL SECURITY;

-- Users can only see their own trials
CREATE POLICY "Users can view their own trials" ON whatsapp_trials
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own trials
CREATE POLICY "Users can create their own trials" ON whatsapp_trials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own trials
CREATE POLICY "Users can update their own trials" ON whatsapp_trials
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_trials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_whatsapp_trials_updated_at
  BEFORE UPDATE ON whatsapp_trials
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_trials_updated_at();

-- Function to check and expire trials
CREATE OR REPLACE FUNCTION expire_whatsapp_trials()
RETURNS void AS $$
BEGIN
  UPDATE whatsapp_trials 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' 
    AND trial_end_date <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON whatsapp_trials TO authenticated;
GRANT EXECUTE ON FUNCTION expire_whatsapp_trials() TO authenticated;
