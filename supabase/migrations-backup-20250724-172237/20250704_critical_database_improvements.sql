-- Critical Database Improvements Migration
-- Based on architectural assessment findings
-- Priority: IMMEDIATE

-- 1. Add Missing Performance-Critical Indexes
-- These are causing N+1 query issues and slow performance

-- Index for efficient message retrieval by conversation
CREATE INDEX IF NOT EXISTS idx_messages_conv_created 
ON messages(conversation_id, created_at DESC);

-- Index for multi-tenant conversation queries
CREATE INDEX IF NOT EXISTS idx_conversations_org_status 
ON conversations(organization_id, status);

-- Index for vector similarity searches (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vector_documents') THEN
        CREATE INDEX IF NOT EXISTS idx_vector_documents_embedding 
        ON vector_documents USING ivfflat (embedding vector_cosine_ops);
    END IF;
END $$;

-- 2. Add Conversation Assignment Columns
-- Required for the disconnected assignment feature
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assignment_note TEXT,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON conversations(assigned_to);

-- 3. Create Activity Events Table
-- Replace mock activity feed with real events
CREATE TABLE IF NOT EXISTS activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    actor_id UUID REFERENCES auth.users(id),
    actor_name TEXT,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activity events
CREATE INDEX IF NOT EXISTS idx_activity_events_organization 
ON activity_events(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_events_resource 
ON activity_events(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_activity_events_actor 
ON activity_events(actor_id);

-- Enable RLS on activity events
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- RLS policy for activity events
CREATE POLICY "Users can view their organization's activities" ON activity_events
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- 4. Create API Keys Table
-- Required for API key management feature
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    rate_limit INTEGER DEFAULT 100,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Indexes for API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_organization ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- Enable RLS on API keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for API keys
CREATE POLICY "Users can view their organization's API keys" ON api_keys
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Admins can manage API keys" ON api_keys
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active' 
            AND role IN ('admin', 'owner')
        )
    );

-- 5. Create Webhooks Table
-- Required for webhook configuration
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    headers JSONB DEFAULT '{}',
    retry_config JSONB DEFAULT '{"max_attempts": 3, "delay_seconds": 60}',
    last_triggered_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_organization ON webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING gin(events);

-- Enable RLS on webhooks
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhooks
CREATE POLICY "Users can view their organization's webhooks" ON webhooks
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Admins can manage webhooks" ON webhooks
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active' 
            AND role IN ('admin', 'owner')
        )
    );

-- 6. Create Organization Settings Table
-- Required for security settings and other configurations
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, category)
);

-- Index for organization settings
CREATE INDEX IF NOT EXISTS idx_organization_settings_org_category 
ON organization_settings(organization_id, category);

-- Enable RLS on organization settings
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization settings
CREATE POLICY "Users can view their organization's settings" ON organization_settings
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Admins can manage settings" ON organization_settings
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active' 
            AND role IN ('admin', 'owner')
        )
    );

-- 7. Additional Performance Indexes
-- Fix N+1 query issues

-- Composite index for conversation message queries
CREATE INDEX IF NOT EXISTS idx_messages_conv_sender_created 
ON messages(conversation_id, sender_type, created_at DESC);

-- Index for organization-based queries
CREATE INDEX IF NOT EXISTS idx_conversations_org_updated 
ON conversations(organization_id, updated_at DESC);

-- 8. Create Updated_at Triggers

-- Generic trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
CREATE TRIGGER update_api_keys_updated_at 
    BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at 
    BEFORE UPDATE ON webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at 
    BEFORE UPDATE ON organization_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Create Team Members View
-- Simplify team member queries
CREATE OR REPLACE VIEW team_members AS
SELECT 
    om.id,
    om.user_id,
    om.organization_id,
    om.role,
    om.status,
    p.email,
    p.full_name,
    p.avatar_url,
    om.last_seen_at,
    om.permissions,
    om.created_at,
    om.updated_at,
    o.name as organization_name,
    o.slug as organization_slug
FROM organization_members om
JOIN profiles p ON p.user_id = om.user_id
JOIN organizations o ON o.id = om.organization_id
WHERE om.status = 'active';

-- Grant permissions on the view
GRANT SELECT ON team_members TO authenticated;

-- 10. Create function to log activity events
CREATE OR REPLACE FUNCTION log_activity_event(
    p_organization_id UUID,
    p_event_type TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_actor_id UUID;
    v_actor_name TEXT;
    v_event_id UUID;
BEGIN
    -- Get current user info
    v_actor_id := auth.uid();
    
    -- Get actor name from profiles
    SELECT full_name INTO v_actor_name
    FROM profiles
    WHERE user_id = v_actor_id;
    
    -- Insert activity event
    INSERT INTO activity_events (
        organization_id,
        event_type,
        resource_type,
        resource_id,
        actor_id,
        actor_name,
        description,
        metadata
    ) VALUES (
        p_organization_id,
        p_event_type,
        p_resource_type,
        p_resource_id,
        v_actor_id,
        v_actor_name,
        p_description,
        p_metadata
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Verify foreign key constraint for tickets
-- Ensure ticket integration works properly
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_conversations_ticket'
    ) THEN
        ALTER TABLE conversations 
        ADD CONSTRAINT fk_conversations_ticket 
        FOREIGN KEY (ticket_id) 
        REFERENCES tickets(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';