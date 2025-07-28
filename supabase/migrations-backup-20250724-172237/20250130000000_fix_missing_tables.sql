-- Fix Missing Tables for Campfire Platform
-- This script adds all missing tables identified in the schema check

-- 1. Create ai_sessions table (CRITICAL for AI functionality)
CREATE TABLE IF NOT EXISTS ai_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id text NOT NULL,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
    model_used text DEFAULT 'gpt-4-turbo',
    total_tokens integer DEFAULT 0,
    prompt_tokens integer DEFAULT 0,
    completion_tokens integer DEFAULT 0,
    persona text DEFAULT 'friendly',
    context jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    ended_at timestamptz,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_ai_sessions_conversation ON ai_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_organization ON ai_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_status ON ai_sessions(status);

-- 2. Create ai_usage_events table (for token tracking)
CREATE TABLE IF NOT EXISTS ai_usage_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id text,
    session_id uuid REFERENCES ai_sessions(id) ON DELETE SET NULL,
    event_type text NOT NULL,
    token_count integer DEFAULT 0,
    model_used text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_organization ON ai_usage_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_events(created_at);

-- 3. Create campfire_handoffs table
CREATE TABLE IF NOT EXISTS campfire_handoffs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id text NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    from_type text NOT NULL CHECK (from_type IN ('ai', 'human', 'rag')),
    to_type text NOT NULL CHECK (to_type IN ('ai', 'human', 'rag')),
    reason text,
    confidence_score numeric(3,2),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_handoffs_conversation ON campfire_handoffs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_created ON campfire_handoffs(created_at);

-- 4. Create campfire_handoff_logs table
CREATE TABLE IF NOT EXISTS campfire_handoff_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    handoff_id uuid REFERENCES campfire_handoffs(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    details jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- 5. Create rag_profiles table
CREATE TABLE IF NOT EXISTS rag_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    persona text DEFAULT 'professional',
    temperature numeric(3,2) DEFAULT 0.7,
    max_tokens integer DEFAULT 500,
    confidence_threshold numeric(3,2) DEFAULT 0.7,
    escalation_threshold numeric(3,2) DEFAULT 0.4,
    model text DEFAULT 'gpt-4-turbo',
    prompt_template text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rag_profiles_org ON rag_profiles(organization_id);

-- 6. Create knowledge_documents table (if missing)
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text,
    source_url text,
    metadata jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 7. Create knowledge_chunks table (for RAG)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content text NOT NULL,
    embedding vector(1536),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- 8. Create applied_migrations table (for tracking)
CREATE TABLE IF NOT EXISTS applied_migrations (
    id SERIAL PRIMARY KEY,
    filename text UNIQUE NOT NULL,
    applied_at timestamptz DEFAULT now(),
    checksum text,
    success boolean DEFAULT true,
    error_message text
);

-- 9. Create message_delivery_status table
CREATE TABLE IF NOT EXISTS message_delivery_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id text REFERENCES messages(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'sent',
    delivered_at timestamptz,
    read_at timestamptz,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 10. Create widget_file_attachments table
CREATE TABLE IF NOT EXISTS widget_file_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id text REFERENCES messages(id) ON DELETE CASCADE,
    conversation_id text REFERENCES conversations(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    filename text NOT NULL,
    file_type text,
    file_size integer,
    url text NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- 11. Create widget_read_receipts table
CREATE TABLE IF NOT EXISTS widget_read_receipts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id text REFERENCES messages(id) ON DELETE CASCADE,
    conversation_id text REFERENCES conversations(id) ON DELETE CASCADE,
    user_id text,
    read_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- 12. Add missing columns to existing tables
-- Add to conversations if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'conversations'
                   AND column_name = 'rag_enabled') THEN
        ALTER TABLE conversations ADD COLUMN rag_enabled boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'conversations'
                   AND column_name = 'escalated') THEN
        ALTER TABLE conversations ADD COLUMN escalated boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'conversations'
                   AND column_name = 'escalation_reason') THEN
        ALTER TABLE conversations ADD COLUMN escalation_reason text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'conversations'
                   AND column_name = 'escalation_urgency') THEN
        ALTER TABLE conversations ADD COLUMN escalation_urgency text;
    END IF;
END $$;

-- Add to messages if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'messages'
                   AND column_name = 'ai_generated') THEN
        ALTER TABLE messages ADD COLUMN ai_generated boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'messages'
                   AND column_name = 'widget_session_id') THEN
        ALTER TABLE messages ADD COLUMN widget_session_id text;
    END IF;
END $$;

-- Add to organizations if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'organizations'
                   AND column_name = 'subscription_tier') THEN
        ALTER TABLE organizations ADD COLUMN subscription_tier text DEFAULT 'free';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'organizations'
                   AND column_name = 'ai_enabled') THEN
        ALTER TABLE organizations ADD COLUMN ai_enabled boolean DEFAULT true;
    END IF;
END $$;

-- 13. Create RLS policies for new tables
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campfire_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_profiles ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view their org's AI sessions" ON ai_sessions
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Service role full access to AI sessions" ON ai_sessions
    USING (auth.jwt()->>'role' = 'service_role');

-- Record this migration
INSERT INTO applied_migrations (filename, success)
VALUES ('20250130000000_fix_missing_tables.sql', true);
