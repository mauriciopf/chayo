-- Chayo Interview Tables Migration
-- This migration adds tables for Chayo to interview business owners and gather information

-- Create interview_sessions table
CREATE TABLE IF NOT EXISTS interview_sessions (
  id TEXT PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  current_question_index INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create interview_responses table
CREATE TABLE IF NOT EXISTS interview_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  category TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_agent_id ON interview_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interview_responses_session_id ON interview_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_responses_category ON interview_responses(category);

-- Enable Row Level Security
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for interview_sessions
CREATE POLICY "Users can view their own interview sessions" ON interview_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview sessions" ON interview_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview sessions" ON interview_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for interview_responses
CREATE POLICY "Users can view their own interview responses" ON interview_responses
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own interview responses" ON interview_responses
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON interview_sessions TO authenticated;
GRANT ALL ON interview_responses TO authenticated;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_interview_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for interview_sessions updated_at
CREATE TRIGGER update_interview_sessions_updated_at
  BEFORE UPDATE ON interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_interview_sessions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE interview_sessions IS 'Sessions where Chayo interviews business owners to gather information';
COMMENT ON TABLE interview_responses IS 'Responses from business owners during Chayo interviews';
COMMENT ON COLUMN interview_sessions.current_question_index IS 'Index of the current question being asked';
COMMENT ON COLUMN interview_responses.question_id IS 'ID of the predefined question being answered';
COMMENT ON COLUMN interview_responses.category IS 'Category of the question (business_basics, policies, etc.)'; 