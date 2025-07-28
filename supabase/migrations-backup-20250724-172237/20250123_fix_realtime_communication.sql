-- Fix Real-time Communication Issues
-- This migration addresses critical database schema issues preventing real-time communication

-- 1. Add Widget API Key Column to Organizations Table
-- The widget authentication expects a widget_api_key column that doesn't exist
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS widget_api_key TEXT;

-- Generate unique API keys for existing organizations
UPDATE organizations 
SET widget_api_key = encode(gen_random_bytes(32), 'hex')
WHERE widget_api_key IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_organizations_widget_api_key 
ON organizations(widget_api_key);

-- 2. Fix Messages Table Schema
-- Add missing columns that the widget expects
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'visitor' CHECK (sender_type IN ('visitor', 'agent', 'system', 'ai')),
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'attachment', 'system', 'ai')),
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS thread_id TEXT,
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id),
ADD COLUMN IF NOT EXISTS ai_sources JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS ai_confidence REAL,
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sending', 'sent', 'delivered', 'failed', 'read'));

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender 
ON messages(conversation_id, sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_thread 
ON messages(thread_id) WHERE thread_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_delivery_status 
ON messages(delivery_status) WHERE delivery_status != 'sent';

-- 3. Create Real-time Channel Tracking Table
-- To prevent channel subscription timeouts
CREATE TABLE IF NOT EXISTS realtime_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_name TEXT NOT NULL UNIQUE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL CHECK (channel_type IN ('messages', 'typing', 'presence', 'conversations')),
    resource_id TEXT NOT NULL,
    subscriber_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_realtime_channels_org_type 
ON realtime_channels(organization_id, channel_type);

CREATE INDEX IF NOT EXISTS idx_realtime_channels_activity 
ON realtime_channels(last_activity_at);

-- Function to auto-cleanup stale channels
CREATE OR REPLACE FUNCTION cleanup_stale_channels() RETURNS void AS $$
BEGIN
    DELETE FROM realtime_channels 
    WHERE last_activity_at < NOW() - INTERVAL '5 minutes' 
    AND subscriber_count = 0;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Message Queue Table for Retry Logic
-- To handle failed broadcasts and ensure message delivery
CREATE TABLE IF NOT EXISTS message_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    payload JSONB NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
    error_message TEXT,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_message_queue_status_scheduled 
ON message_queue(status, scheduled_at) 
WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_message_queue_org_status 
ON message_queue(organization_id, status);

-- 5. Add Development Mode Support
-- Insert test organization with widget API key for development
INSERT INTO organizations (id, name, slug, widget_api_key, metadata)
VALUES (
    'b5e80170-004c-4e82-a88c-3e2166b169dd',
    'Test Organization',
    'test-org',
    'dev-widget-key-test',
    '{"widget_enabled": true}'::jsonb
) ON CONFLICT (id) DO UPDATE 
SET widget_api_key = EXCLUDED.widget_api_key,
    metadata = EXCLUDED.metadata;

-- 6. Create function to track channel activity
CREATE OR REPLACE FUNCTION update_channel_activity(
    p_channel_name TEXT,
    p_organization_id UUID,
    p_channel_type TEXT,
    p_resource_id TEXT
) RETURNS void AS $$
BEGIN
    INSERT INTO realtime_channels (
        channel_name, 
        organization_id, 
        channel_type, 
        resource_id,
        subscriber_count,
        last_activity_at
    ) VALUES (
        p_channel_name,
        p_organization_id,
        p_channel_type,
        p_resource_id,
        1,
        NOW()
    ) ON CONFLICT (channel_name) DO UPDATE 
    SET last_activity_at = NOW(),
        subscriber_count = realtime_channels.subscriber_count + 1;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to queue messages for reliable delivery
CREATE OR REPLACE FUNCTION queue_realtime_message(
    p_organization_id UUID,
    p_channel_type TEXT,
    p_resource_id TEXT,
    p_event_name TEXT,
    p_payload JSONB,
    p_priority TEXT DEFAULT 'normal'
) RETURNS UUID AS $$
DECLARE
    queue_id UUID;
BEGIN
    INSERT INTO message_queue (
        organization_id,
        channel_type,
        resource_id,
        event_name,
        payload,
        priority
    ) VALUES (
        p_organization_id,
        p_channel_type,
        p_resource_id,
        p_event_name,
        p_payload,
        p_priority
    ) RETURNING id INTO queue_id;
    
    RETURN queue_id;
END;
$$ LANGUAGE plpgsql;
