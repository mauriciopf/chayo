-- Add client insights table for customer request analysis
-- This is separate from conversation_embeddings (business RAG)

CREATE TABLE IF NOT EXISTS client_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Conversation data
  conversation_text TEXT NOT NULL,
  intent TEXT NOT NULL CHECK (intent IN ('booking', 'pricing', 'support', 'complaint', 'other')),
  
  -- Simple metadata
  conversation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  conversation_hour INTEGER CHECK (conversation_hour >= 0 AND conversation_hour <= 23),
  
  -- System metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE client_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see insights for their organizations
CREATE POLICY "Users can view their own client insights" ON client_insights
  FOR SELECT USING (
    organization_id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
  );

CREATE POLICY "Users can insert their own client insights" ON client_insights
  FOR INSERT WITH CHECK (
    organization_id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_insights_organization_date 
  ON client_insights(organization_id, conversation_date);
CREATE INDEX IF NOT EXISTS idx_client_insights_intent 
  ON client_insights(organization_id, intent);
CREATE INDEX IF NOT EXISTS idx_client_insights_created_at 
  ON client_insights(created_at);

-- Grant permissions
GRANT ALL ON client_insights TO authenticated;

-- Create trigger for updated_at
CREATE TRIGGER update_client_insights_updated_at 
  BEFORE UPDATE ON client_insights 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE client_insights IS 'Stores simplified analysis of customer requests for business intelligence';
COMMENT ON COLUMN client_insights.intent IS 'What the customer is asking for: booking, pricing, support, complaint, other';