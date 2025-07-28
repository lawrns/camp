-- WebSocket v2 Database Bridge Schema
-- This schema supports the WebSocketV2Service for event persistence and querying

-- Main events table for WebSocket v2 system
CREATE TABLE IF NOT EXISTS websocket_v2_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('message', 'typing', 'handover', 'presence', 'system')),
    conversation_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    user_id UUID,
    
    -- Event payload (JSONB for efficient querying)
    payload JSONB NOT NULL DEFAULT '{}',
    
    -- Metadata
    channel_name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'retrying')),
    
    -- Indexing
    CONSTRAINT fk_websocket_v2_events_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_websocket_v2_events_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_websocket_v2_events_conversation_timestamp 
    ON websocket_v2_events(conversation_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_websocket_v2_events_organization_timestamp 
    ON websocket_v2_events(organization_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_websocket_v2_events_type_status 
    ON websocket_v2_events(event_type, status);

CREATE INDEX IF NOT EXISTS idx_websocket_v2_events_pending 
    ON websocket_v2_events(timestamp) WHERE status = 'pending';

-- Connection tracking table for WebSocket clients
CREATE TABLE IF NOT EXISTS websocket_v2_connections (
    connection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID,
    conversation_id UUID,
    
    -- Connection metadata
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'idle', 'disconnected')),
    
    CONSTRAINT fk_websocket_v2_connections_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_websocket_v2_connections_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Index for connection cleanup
CREATE INDEX IF NOT EXISTS idx_websocket_v2_connections_activity 
    ON websocket_v2_connections(last_activity) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_websocket_v2_connections_conversation 
    ON websocket_v2_connections(conversation_id, status);

-- RLS Policies for security
ALTER TABLE websocket_v2_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE websocket_v2_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policy for events - users can only see events from their organization
CREATE POLICY websocket_v2_events_org_policy ON websocket_v2_events
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy for connections - users can only see connections from their organization
CREATE POLICY websocket_v2_connections_org_policy ON websocket_v2_connections
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Function to clean up old events (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_websocket_v2_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM websocket_v2_events 
    WHERE timestamp < NOW() - INTERVAL '30 days'
    AND status = 'processed';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up stale connections (inactive for more than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_websocket_v2_connections()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE websocket_v2_connections 
    SET status = 'disconnected'
    WHERE last_activity < NOW() - INTERVAL '1 hour'
    AND status = 'active';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last_activity on connection updates
CREATE OR REPLACE FUNCTION update_websocket_connection_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER websocket_v2_connections_activity_trigger
    BEFORE UPDATE ON websocket_v2_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_websocket_connection_activity();

-- Real-time publication for WebSocket v2 events
ALTER PUBLICATION supabase_realtime ADD TABLE websocket_v2_events;
ALTER PUBLICATION supabase_realtime ADD TABLE websocket_v2_connections;

-- Grant necessary permissions for service role
GRANT ALL ON websocket_v2_events TO service_role;
GRANT ALL ON websocket_v2_connections TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_websocket_v2_events() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_websocket_v2_connections() TO service_role;