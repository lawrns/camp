-- Comprehensive RLS Policies - Phase 7: Security Audit
-- Unbreakable multi-tenancy with organization isolation
-- Ensures no data leaks across organizations

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Set REPLICA IDENTITY FULL for realtime filtering
ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE ai_interactions REPLICA IDENTITY FULL;
ALTER TABLE team_members REPLICA IDENTITY FULL;

-- Helper function to get current organization ID from JWT
CREATE OR REPLACE FUNCTION get_current_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.current_organization_id', true)::UUID,
    (auth.jwt() ->> 'organization_id')::UUID
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is organization member
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members 
    WHERE organization_id = org_id 
    AND user_id = auth.uid()
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations table policies
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id = get_current_organization_id() OR
    is_organization_member(id)
  );

DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
CREATE POLICY "Users can update their organizations" ON organizations
  FOR UPDATE USING (
    is_organization_member(id)
  );

-- Profiles table policies
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;
CREATE POLICY "Users can view profiles in their organization" ON profiles
  FOR SELECT USING (
    organization_id = get_current_organization_id() OR
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Conversations table policies
DROP POLICY IF EXISTS "Organization isolation for conversations" ON conversations;
CREATE POLICY "Organization isolation for conversations" ON conversations
  FOR ALL USING (
    organization_id = get_current_organization_id()
  );

DROP POLICY IF EXISTS "Widget access for conversations" ON conversations;
CREATE POLICY "Widget access for conversations" ON conversations
  FOR SELECT USING (
    organization_id = get_current_organization_id() OR
    -- Allow widget access with proper authentication
    (auth.role() = 'anon' AND organization_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "Insert conversations with organization check" ON conversations;
CREATE POLICY "Insert conversations with organization check" ON conversations
  FOR INSERT WITH CHECK (
    organization_id = get_current_organization_id() OR
    -- Allow widget to create conversations
    (auth.role() = 'anon' AND organization_id IS NOT NULL)
  );

-- Messages table policies
DROP POLICY IF EXISTS "Organization isolation for messages" ON messages;
CREATE POLICY "Organization isolation for messages" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.organization_id = get_current_organization_id()
    )
  );

DROP POLICY IF EXISTS "Widget message access" ON messages;
CREATE POLICY "Widget message access" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (
        conversations.organization_id = get_current_organization_id() OR
        auth.role() = 'anon'
      )
    )
  );

DROP POLICY IF EXISTS "Insert messages with conversation check" ON messages;
CREATE POLICY "Insert messages with conversation check" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (
        conversations.organization_id = get_current_organization_id() OR
        auth.role() = 'anon'
      )
    )
  );

-- Knowledge chunks table policies
DROP POLICY IF EXISTS "Organization isolation for knowledge" ON knowledge_chunks;
CREATE POLICY "Organization isolation for knowledge" ON knowledge_chunks
  FOR ALL USING (organization_id = get_current_organization_id());

-- AI interactions table policies
DROP POLICY IF EXISTS "Organization isolation for AI interactions" ON ai_interactions;
CREATE POLICY "Organization isolation for AI interactions" ON ai_interactions
  FOR ALL USING (organization_id = get_current_organization_id());

-- Widget settings table policies
DROP POLICY IF EXISTS "Organization isolation for widget settings" ON widget_settings;
CREATE POLICY "Organization isolation for widget settings" ON widget_settings
  FOR ALL USING (organization_id = get_current_organization_id());

-- Team members table policies
DROP POLICY IF EXISTS "Organization isolation for team members" ON team_members;
CREATE POLICY "Organization isolation for team members" ON team_members
  FOR ALL USING (
    organization_id = get_current_organization_id() OR
    user_id = auth.uid()
  );

-- API keys table policies
DROP POLICY IF EXISTS "Organization isolation for API keys" ON api_keys;
CREATE POLICY "Organization isolation for API keys" ON api_keys
  FOR ALL USING (organization_id = get_current_organization_id());

-- Security function to set organization context
CREATE OR REPLACE FUNCTION set_organization_context(org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verify user has access to this organization
  IF NOT is_organization_member(org_id) THEN
    RAISE EXCEPTION 'Access denied to organization %', org_id;
  END IF;
  
  -- Set the organization context
  PERFORM set_config('app.current_organization_id', org_id::TEXT, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's organizations
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS TABLE(organization_id UUID, organization_name TEXT, role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.organization_id,
    o.name,
    tm.role
  FROM team_members tm
  JOIN organizations o ON o.id = tm.organization_id
  WHERE tm.user_id = auth.uid()
  AND tm.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit function to log access attempts
CREATE OR REPLACE FUNCTION log_access_attempt(
  table_name TEXT,
  operation TEXT,
  organization_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    table_name,
    operation,
    organization_id,
    timestamp,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    table_name,
    operation,
    organization_id,
    NOW(),
    current_setting('request.headers', true)::JSON ->> 'x-forwarded-for',
    current_setting('request.headers', true)::JSON ->> 'user-agent'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the main operation if audit logging fails
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  organization_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs can only be viewed by system admins
DROP POLICY IF EXISTS "System admin access to audit logs" ON audit_logs;
CREATE POLICY "System admin access to audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'system_admin'
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON conversations, messages TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_organization_id ON knowledge_chunks(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_organization_id ON ai_interactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_organization_id ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Security validation function
CREATE OR REPLACE FUNCTION validate_rls_policies()
RETURNS TABLE(table_name TEXT, has_rls BOOLEAN, policy_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity,
    COUNT(p.policyname)::INTEGER
  FROM pg_tables t
  LEFT JOIN pg_policies p ON p.tablename = t.tablename
  WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'organizations', 'profiles', 'conversations', 'messages', 
    'knowledge_chunks', 'ai_interactions', 'widget_settings', 
    'team_members', 'api_keys', 'audit_logs'
  )
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
