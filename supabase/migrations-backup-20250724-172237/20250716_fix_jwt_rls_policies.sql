-- Fix RLS policies to use JWT claims consistently
-- This migration ensures all policies use auth.jwt() ->> 'organization_id' for better performance

-- Drop existing inconsistent policies
DROP POLICY IF EXISTS "Users can view conversations in their organization" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations in their organization" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations in their organization" ON conversations;
DROP POLICY IF EXISTS "conversations_org_isolation" ON conversations;
DROP POLICY IF EXISTS "conversations_policy" ON conversations;
DROP POLICY IF EXISTS "tenant_isolation_conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view messages in their organization conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in their organization conversations" ON messages;
DROP POLICY IF EXISTS "messages_conversation_access" ON messages;
DROP POLICY IF EXISTS "messages_policy" ON messages;
DROP POLICY IF EXISTS "tenant_isolation_messages" ON messages;

-- Create unified JWT-based policies for conversations
CREATE POLICY "conversations_jwt_org_isolation" ON conversations
FOR ALL USING (
    -- Use JWT claim for authenticated users (most efficient)
    (auth.role() = 'authenticated' AND organization_id = (auth.jwt() ->> 'organization_id')::uuid)
    OR
    -- Service role can access everything
    (auth.role() = 'service_role')
    OR
    -- Anonymous widget access (for widget conversations)
    (auth.role() = 'anon' AND organization_id = (auth.jwt() ->> 'organization_id')::uuid)
)
WITH CHECK (
    -- Same check for inserts/updates
    (auth.role() = 'authenticated' AND organization_id = (auth.jwt() ->> 'organization_id')::uuid)
    OR
    (auth.role() = 'service_role')
    OR
    (auth.role() = 'anon' AND organization_id = (auth.jwt() ->> 'organization_id')::uuid)
);

-- Create unified JWT-based policies for messages
CREATE POLICY "messages_jwt_org_isolation" ON messages
FOR ALL USING (
    -- Use JWT claim for authenticated users (most efficient)
    (auth.role() = 'authenticated' AND organization_id = (auth.jwt() ->> 'organization_id')::uuid)
    OR
    -- Service role can access everything
    (auth.role() = 'service_role')
    OR
    -- Anonymous widget access (for widget messages)
    (auth.role() = 'anon' AND organization_id = (auth.jwt() ->> 'organization_id')::uuid)
)
WITH CHECK (
    -- Same check for inserts/updates
    (auth.role() = 'authenticated' AND organization_id = (auth.jwt() ->> 'organization_id')::uuid)
    OR
    (auth.role() = 'service_role')
    OR
    (auth.role() = 'anon' AND organization_id = (auth.jwt() ->> 'organization_id')::uuid)
);

-- Update organization_members policies to use JWT claims
DROP POLICY IF EXISTS "org_members_isolation" ON organization_members;
CREATE POLICY "org_members_jwt_isolation" ON organization_members
FOR ALL USING (
    (auth.role() = 'authenticated' AND organization_id = (auth.jwt() ->> 'organization_id')::uuid)
    OR
    (auth.role() = 'service_role')
    OR
    -- Users can see their own membership records
    (auth.role() = 'authenticated' AND user_id = auth.uid())
);

-- Add comment explaining the policy approach
COMMENT ON POLICY "conversations_jwt_org_isolation" ON conversations IS 
'Uses JWT organization_id claim for efficient tenant isolation. Supports authenticated users, service role, and anonymous widget access.';

COMMENT ON POLICY "messages_jwt_org_isolation" ON messages IS 
'Uses JWT organization_id claim for efficient tenant isolation. Supports authenticated users, service role, and anonymous widget access.';

-- Ensure RLS is enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
