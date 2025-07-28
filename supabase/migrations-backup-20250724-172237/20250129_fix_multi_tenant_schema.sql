-- Migration: Fix Multi-Tenant Schema for Production
-- Date: 2025-01-29
-- Description: Comprehensive fixes for proper tenant isolation and organization management

-- 1. Fix organization_members foreign key constraints
ALTER TABLE organization_members 
DROP CONSTRAINT IF EXISTS fk_organization_members_org;

ALTER TABLE organization_members 
ADD CONSTRAINT fk_organization_members_org 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE organization_members 
DROP CONSTRAINT IF EXISTS fk_organization_members_user;

ALTER TABLE organization_members 
ADD CONSTRAINT fk_organization_members_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Add missing organization_id to messages table
ALTER TABLE conversation_messages 
ADD COLUMN IF NOT EXISTS organization_id uuid;

-- Update existing messages with organization_id from conversations
UPDATE conversation_messages cm
SET organization_id = c.organization_id
FROM conversations c
WHERE cm.conversation_id = c.id
AND cm.organization_id IS NULL;

-- Add foreign key constraint
ALTER TABLE conversation_messages 
ADD CONSTRAINT fk_messages_org 
FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Make organization_id NOT NULL after backfill
ALTER TABLE conversation_messages 
ALTER COLUMN organization_id SET NOT NULL;

-- 3. Create organization context helper functions
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid AS $$
BEGIN
  -- First check if organization_id is set in the current transaction
  IF current_setting('app.current_organization_id', true) IS NOT NULL THEN
    RETURN current_setting('app.current_organization_id', true)::uuid;
  END IF;
  
  -- Otherwise get from organization_members
  RETURN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND status = 'active' 
    ORDER BY created_at DESC 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to organization
CREATE OR REPLACE FUNCTION has_organization_access(p_organization_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM organization_members 
    WHERE organization_id = p_organization_id 
    AND user_id = auth.uid() 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role in organization
CREATE OR REPLACE FUNCTION get_user_organization_role(p_organization_id uuid DEFAULT NULL)
RETURNS text AS $$
DECLARE
  v_org_id uuid;
BEGIN
  v_org_id := COALESCE(p_organization_id, get_user_organization_id());
  
  RETURN (
    SELECT role 
    FROM organization_members 
    WHERE organization_id = v_org_id 
    AND user_id = auth.uid() 
    AND status = 'active'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix RLS policies for proper tenant isolation

-- Conversations table
DROP POLICY IF EXISTS "Users can view their organization conversations" ON conversations;
CREATE POLICY "tenant_isolation_conversations" ON conversations
FOR ALL USING (
  organization_id = get_user_organization_id() 
  OR has_organization_access(organization_id)
);

-- Messages table
DROP POLICY IF EXISTS "Organization members can view messages" ON conversation_messages;
CREATE POLICY "tenant_isolation_messages" ON conversation_messages
FOR ALL USING (
  organization_id = get_user_organization_id() 
  OR has_organization_access(organization_id)
);

-- Files table
DROP POLICY IF EXISTS "Users can view their organization files" ON files;
CREATE POLICY "tenant_isolation_files" ON files
FOR ALL USING (
  organization_id = get_user_organization_id() 
  OR has_organization_access(organization_id)
);

-- Knowledge documents
DROP POLICY IF EXISTS "Users can view organization knowledge" ON knowledge_documents;
CREATE POLICY "tenant_isolation_knowledge" ON knowledge_documents
FOR ALL USING (
  organization_id = get_user_organization_id() 
  OR has_organization_access(organization_id)
);

-- Tickets table
DROP POLICY IF EXISTS "Users can view organization tickets" ON tickets;
CREATE POLICY "tenant_isolation_tickets" ON tickets
FOR ALL USING (
  organization_id = get_user_organization_id() 
  OR has_organization_access(organization_id)
);

-- 5. Create organization setup function
CREATE OR REPLACE FUNCTION create_organization_with_defaults(
  p_name text,
  p_owner_id uuid
) RETURNS uuid AS $$
DECLARE
  v_org_id uuid;
  v_mailbox_id integer;
  v_slug text;
BEGIN
  -- Generate unique slug
  v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  
  -- Ensure slug is unique
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = v_slug) LOOP
    v_slug := v_slug || '-' || substr(md5(random()::text), 1, 4);
  END LOOP;
  
  -- Create organization
  INSERT INTO organizations (name, slug, created_by_user_id)
  VALUES (p_name, v_slug, p_owner_id)
  RETURNING id INTO v_org_id;
  
  -- Add owner as admin
  INSERT INTO organization_members (
    organization_id, 
    user_id, 
    role, 
    status,
    created_at,
    updated_at
  )
  VALUES (
    v_org_id, 
    p_owner_id, 
    'owner', 
    'active',
    NOW(),
    NOW()
  );
  
  -- Create default mailbox
  INSERT INTO mailboxes (
    name, 
    email,
    clerk_organization_id,
    created_at,
    updated_at
  )
  VALUES (
    p_name || ' Support',
    v_slug || '@support.campfire.app',
    v_org_id::text,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_mailbox_id;
  
  -- Update member with mailbox
  UPDATE organization_members 
  SET mailbox_id = v_mailbox_id
  WHERE organization_id = v_org_id AND user_id = p_owner_id;
  
  -- Create default RAG profile
  INSERT INTO rag_profiles (
    organization_id,
    name,
    is_default,
    model,
    temperature,
    prompt_template,
    created_at,
    updated_at
  )
  VALUES (
    v_org_id,
    'Default Assistant',
    true,
    'gpt-4-turbo-preview',
    0.7,
    'You are a helpful customer support assistant for ' || p_name || '.',
    NOW(),
    NOW()
  );
  
  -- Initialize organization settings
  INSERT INTO widget_settings (
    organization_id,
    theme_color,
    welcome_message,
    enabled,
    created_at,
    updated_at
  )
  VALUES (
    v_org_id,
    '#6366F1',
    'Hi! How can we help you today?',
    true,
    NOW(),
    NOW()
  );
  
  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add organization_id to auth.users metadata
CREATE OR REPLACE FUNCTION update_user_metadata()
RETURNS trigger AS $$
BEGIN
  -- When a user joins an organization, update their metadata
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('organization_id', NEW.organization_id)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_user_metadata_trigger ON organization_members;
CREATE TRIGGER update_user_metadata_trigger
AFTER INSERT OR UPDATE ON organization_members
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION update_user_metadata();

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_org_status 
ON conversations(organization_id, status) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_org_created 
ON conversation_messages(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_org_members_user_status 
ON organization_members(user_id, status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_org_members_org_status 
ON organization_members(organization_id, status) 
WHERE status = 'active';

-- 8. Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- Update profiles with organization_id from organization_members
UPDATE profiles p
SET organization_id = om.organization_id
FROM organization_members om
WHERE p.user_id = om.user_id
AND om.status = 'active'
AND p.organization_id IS NULL;

-- 9. Create function to switch user's active organization
CREATE OR REPLACE FUNCTION switch_active_organization(p_organization_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Verify user has access to this organization
  IF NOT has_organization_access(p_organization_id) THEN
    RAISE EXCEPTION 'Access denied to organization';
  END IF;
  
  -- Update user's metadata
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('organization_id', p_organization_id)
  WHERE id = auth.uid();
  
  -- Get organization details
  SELECT jsonb_build_object(
    'organization_id', o.id,
    'organization_name', o.name,
    'role', om.role
  ) INTO v_result
  FROM organizations o
  JOIN organization_members om ON om.organization_id = o.id
  WHERE o.id = p_organization_id
  AND om.user_id = auth.uid()
  AND om.status = 'active';
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Add organization columns if missing
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE agent_threads ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE campfire_messages ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE campfire_channels ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE email_threads ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;