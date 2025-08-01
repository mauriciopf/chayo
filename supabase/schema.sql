-- Enable RLS (Row Level Security)
-- This file contains the database schema for Chayo AI Dashboard

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  system_prompt TEXT,
  business_constraints JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create conversation_embeddings table for AI knowledge
CREATE TABLE IF NOT EXISTS conversation_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_segment TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002 embedding dimension
  segment_type TEXT NOT NULL DEFAULT 'conversation', -- 'conversation', 'faq', 'knowledge', 'example'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_subscriptions table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'inactive',
  price_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create business_documents table for PDF uploads
CREATE TABLE IF NOT EXISTS business_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  storage_path TEXT NOT NULL,
  processed BOOLEAN DEFAULT false,
  embedding_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create organizations table for team management
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create team_members table for organization membership
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'pending', 'suspended'
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, user_id)
);

-- Create team_invitations table for pending invitations
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, email)
);

-- Enable Row Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for agents table
DROP POLICY IF EXISTS "Users can view their own agents" ON agents;
CREATE POLICY "Users can view their own agents" ON agents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own agents" ON agents;
CREATE POLICY "Users can insert their own agents" ON agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own agents" ON agents;
CREATE POLICY "Users can update their own agents" ON agents
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own agents" ON agents;
CREATE POLICY "Users can delete their own agents" ON agents
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for conversation_embeddings table
DROP POLICY IF EXISTS "Users can view their own conversation embeddings" ON conversation_embeddings;
CREATE POLICY "Users can view their own conversation embeddings" ON conversation_embeddings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can insert their own conversation embeddings" ON conversation_embeddings;
CREATE POLICY "Users can insert their own conversation embeddings" ON conversation_embeddings
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can update their own conversation embeddings" ON conversation_embeddings;
CREATE POLICY "Users can update their own conversation embeddings" ON conversation_embeddings
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can delete their own conversation embeddings" ON conversation_embeddings;
CREATE POLICY "Users can delete their own conversation embeddings" ON conversation_embeddings
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM team_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Create policies for user_subscriptions table
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for business_documents table
DROP POLICY IF EXISTS "Users can view their own business documents" ON business_documents;
CREATE POLICY "Users can view their own business documents" ON business_documents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own business documents" ON business_documents;
CREATE POLICY "Users can insert their own business documents" ON business_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own business documents" ON business_documents;
CREATE POLICY "Users can update their own business documents" ON business_documents
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own business documents" ON business_documents;
CREATE POLICY "Users can delete their own business documents" ON business_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for organizations table
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
  );

DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Organization owners can update their organizations" ON organizations;
CREATE POLICY "Organization owners can update their organizations" ON organizations
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Organization owners can delete their organizations" ON organizations;
CREATE POLICY "Organization owners can delete their organizations" ON organizations
  FOR DELETE USING (auth.uid() = owner_id);

-- Create policies for team_members table
DROP POLICY IF EXISTS "Team members can view members of their organizations" ON team_members;
CREATE POLICY "Team members can view members of their organizations" ON team_members
  FOR SELECT USING (
    organization_id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
  );

DROP POLICY IF EXISTS "Organization owners and admins can manage team members" ON team_members;
CREATE POLICY "Organization owners and admins can manage team members" ON team_members
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    ) OR
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- Create policies for team_invitations table
DROP POLICY IF EXISTS "Organization owners and admins can manage invitations" ON team_invitations;
CREATE POLICY "Organization owners and admins can manage invitations" ON team_invitations
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    ) OR
    organization_id IN (
      SELECT organization_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON team_invitations;
CREATE POLICY "Users can view invitations sent to their email" ON team_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS agents_user_id_idx ON agents(user_id);
CREATE INDEX IF NOT EXISTS agents_created_at_idx ON agents(created_at);
CREATE INDEX IF NOT EXISTS agents_organization_id_idx ON agents(organization_id);
CREATE INDEX IF NOT EXISTS conversation_embeddings_organization_id_idx ON conversation_embeddings(organization_id);
CREATE INDEX IF NOT EXISTS conversation_embeddings_segment_type_idx ON conversation_embeddings(segment_type);
CREATE INDEX IF NOT EXISTS conversation_embeddings_created_at_idx ON conversation_embeddings(created_at);
CREATE INDEX IF NOT EXISTS conversation_embeddings_vector_idx ON conversation_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_stripe_customer_id_idx ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS business_documents_organization_id_idx ON business_documents(organization_id);
CREATE INDEX IF NOT EXISTS business_documents_user_id_idx ON business_documents(user_id);
CREATE INDEX IF NOT EXISTS business_documents_created_at_idx ON business_documents(created_at);
CREATE INDEX IF NOT EXISTS business_documents_embedding_status_idx ON business_documents(embedding_status);
CREATE INDEX IF NOT EXISTS organizations_owner_id_idx ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS team_members_organization_id_idx ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members(user_id);
CREATE INDEX IF NOT EXISTS team_members_status_idx ON team_members(status);
CREATE INDEX IF NOT EXISTS team_invitations_organization_id_idx ON team_invitations(organization_id);
CREATE INDEX IF NOT EXISTS team_invitations_email_idx ON team_invitations(email);
CREATE INDEX IF NOT EXISTS team_invitations_token_idx ON team_invitations(token);
CREATE INDEX IF NOT EXISTS team_invitations_expires_at_idx ON team_invitations(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to create organization with team member in one transaction
-- This function bypasses RLS policies to avoid circular dependency issues
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  org_name TEXT,
  org_slug TEXT,
  owner_id UUID
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create the organization
  INSERT INTO organizations (name, slug, owner_id)
  VALUES (org_name, org_slug, owner_id)
  RETURNING id INTO new_org_id;
  
  -- Add the user as an active owner in team_members
  INSERT INTO team_members (organization_id, user_id, role, status)
  VALUES (new_org_id, owner_id, 'owner', 'active');
  
  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_organization_with_owner(TEXT, TEXT, UUID) TO authenticated;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at 
  BEFORE UPDATE ON agents 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversation_embeddings_updated_at ON conversation_embeddings;
CREATE TRIGGER update_conversation_embeddings_updated_at 
  BEFORE UPDATE ON conversation_embeddings 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON user_subscriptions 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_documents_updated_at ON business_documents;
CREATE TRIGGER update_business_documents_updated_at 
  BEFORE UPDATE ON business_documents 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at 
  BEFORE UPDATE ON team_members 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create function to generate invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically create default organization for new users
CREATE OR REPLACE FUNCTION create_default_organization()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create the organization
  INSERT INTO public.organizations (name, slug, owner_id)
  VALUES (
    'My Organization',
    'org-' || REPLACE(NEW.id::text, '-', ''),
    NEW.id
  )
  RETURNING id INTO new_org_id;
  
  -- Add the user as an active owner in team_members
  INSERT INTO public.team_members (organization_id, user_id, role, status)
  VALUES (new_org_id, NEW.id, 'owner', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to create default organization for new users
DROP TRIGGER IF EXISTS create_default_organization_trigger ON auth.users;
CREATE TRIGGER create_default_organization_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE create_default_organization();

-- Create vector similarity search function
DROP FUNCTION IF EXISTS search_similar_conversations(VECTOR, UUID, FLOAT, INT);
CREATE OR REPLACE FUNCTION search_similar_conversations(
  query_embedding VECTOR(1536),
  organization_id_param UUID,
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  conversation_segment TEXT,
  segment_type TEXT,
  metadata JSONB,
  distance FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id,
    ce.conversation_segment,
    ce.segment_type,
    ce.metadata,
    ce.embedding <=> query_embedding AS distance
  FROM conversation_embeddings ce
  WHERE ce.organization_id = organization_id_param
    AND ce.embedding IS NOT NULL
    AND ce.embedding <=> query_embedding < match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function to get business knowledge summary
DROP FUNCTION IF EXISTS get_business_knowledge_summary(UUID);
CREATE OR REPLACE FUNCTION get_business_knowledge_summary(organization_id_param UUID)
RETURNS TABLE (
  conversation_count BIGINT,
  faq_count BIGINT,
  knowledge_count BIGINT,
  example_count BIGINT,
  total_segments BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE segment_type = 'conversation') AS conversation_count,
    COUNT(*) FILTER (WHERE segment_type = 'faq') AS faq_count,
    COUNT(*) FILTER (WHERE segment_type = 'knowledge') AS knowledge_count,
    COUNT(*) FILTER (WHERE segment_type = 'example') AS example_count,
    COUNT(*) AS total_segments
  FROM conversation_embeddings
  WHERE organization_id = organization_id_param;
END;
$$;

-- Create business_info_fields table for dynamic business information gathering
CREATE TABLE IF NOT EXISTS business_info_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_value TEXT,
  field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'array', 'boolean', 'number')),
  is_answered BOOLEAN NOT NULL DEFAULT false,
  question_template TEXT NOT NULL,
  confidence DECIMAL(3,2),
  source TEXT CHECK (source IN ('conversation', 'document', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Ensure unique field names per organization
  UNIQUE(organization_id, field_name)
);

-- Enable RLS for business_info_fields
ALTER TABLE business_info_fields ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see business info fields for their organizations
DROP POLICY IF EXISTS "Users can view their own business info fields" ON business_info_fields;
CREATE POLICY "Users can view their own business info fields" ON business_info_fields
  FOR SELECT USING (
    organization_id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
  );

DROP POLICY IF EXISTS "Users can insert their own business info fields" ON business_info_fields;
CREATE POLICY "Users can insert their own business info fields" ON business_info_fields
  FOR INSERT WITH CHECK (
    organization_id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
  );

DROP POLICY IF EXISTS "Users can update their own business info fields" ON business_info_fields;
CREATE POLICY "Users can update their own business info fields" ON business_info_fields
  FOR UPDATE USING (
    organization_id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
  );

DROP POLICY IF EXISTS "Users can delete their own business info fields" ON business_info_fields;
CREATE POLICY "Users can delete their own business info fields" ON business_info_fields
  FOR DELETE USING (
    organization_id = ANY(public.get_user_organization_ids(auth.uid()::uuid))
  );

-- Helper function to get all organization IDs a user belongs to (owner or active member)
CREATE OR REPLACE FUNCTION public.get_user_organization_ids(user_id UUID)
RETURNS UUID[] AS $$
  SELECT array_agg(DISTINCT o.id)
  FROM organizations o
  LEFT JOIN team_members tm ON tm.organization_id = o.id
  WHERE o.owner_id = user_id OR (tm.user_id = user_id AND tm.status = 'active');
$$ LANGUAGE sql STABLE SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.get_user_organization_ids(uuid) TO authenticated;

-- Grant permissions
GRANT ALL ON agents TO authenticated;
GRANT ALL ON conversation_embeddings TO authenticated;
GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON business_documents TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON team_members TO authenticated;
GRANT ALL ON team_invitations TO authenticated;
GRANT ALL ON business_info_fields TO authenticated;

-- Add comments
COMMENT ON TABLE agents IS 'AI agents representing businesses with conversation-based knowledge';
COMMENT ON TABLE conversation_embeddings IS 'Stores embeddings of business conversations for AI knowledge retrieval';
COMMENT ON TABLE user_subscriptions IS 'User subscription and billing information';
COMMENT ON TABLE business_documents IS 'PDF documents uploaded for agent training';
COMMENT ON TABLE organizations IS 'Organizations for team management';
COMMENT ON TABLE team_members IS 'Organization membership and roles';
COMMENT ON TABLE team_invitations IS 'Pending team invitations';

COMMENT ON FUNCTION search_similar_conversations IS 'Search for similar conversation segments using vector distance';
COMMENT ON FUNCTION get_business_knowledge_summary IS 'Get summary statistics of business knowledge for an organization';

-- Create indexes for business_info_fields
CREATE INDEX IF NOT EXISTS idx_business_info_fields_organization_id ON business_info_fields(organization_id);
CREATE INDEX IF NOT EXISTS idx_business_info_fields_is_answered ON business_info_fields(is_answered);
CREATE INDEX IF NOT EXISTS idx_business_info_fields_created_at ON business_info_fields(created_at);

-- Create trigger for business_info_fields updated_at
DROP TRIGGER IF EXISTS update_business_info_fields_updated_at ON business_info_fields;
CREATE TRIGGER update_business_info_fields_updated_at 
  BEFORE UPDATE ON business_info_fields 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View: business_constraints_view
DROP VIEW IF EXISTS business_constraints_view;
CREATE OR REPLACE VIEW business_constraints_view AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    jsonb_build_object(
        'name', COALESCE(
            (SELECT field_value FROM business_info_fields 
             WHERE organization_id = o.id AND field_name = 'business_name' AND is_answered = true 
             LIMIT 1), 
            'Business AI Assistant'
        ),
        'tone', 'professional',
        'business_info_gathered', (
            SELECT COUNT(*) 
            FROM business_info_fields 
            WHERE organization_id = o.id AND is_answered = true
        ),
        'whatsapp_trial_mentioned', false
    ) || 
    COALESCE(
        jsonb_object_agg(
            bif.field_name, bif.field_value
        ) FILTER (WHERE bif.is_answered = true), 
        '{}'::jsonb
    ) as business_constraints
FROM organizations o
LEFT JOIN business_info_fields bif ON o.id = bif.organization_id
GROUP BY o.id, o.name;
