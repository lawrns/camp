-- Core Tables Creation - Must run before all other migrations
-- This creates the fundamental tables that other migrations depend on

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizations table (foundation for multi-tenancy)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles table (user profiles)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    organization_id UUID REFERENCES organizations(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Organization members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'agent', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

-- 4. Mailboxes table (for organizing conversations)
CREATE TABLE IF NOT EXISTS mailboxes (
    id SERIAL PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    widget_hmac_secret TEXT,
    gmail_support_email_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, slug)
);

-- 5. Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    mailbox_id INTEGER REFERENCES mailboxes(id),
    
    -- Conversation properties
    subject TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived', 'pending')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Assignment
    assignee_type TEXT DEFAULT 'human',
    assignee_id TEXT,
    assigned_agent_id UUID,
    
    -- Customer information
    customer JSONB DEFAULT '{}',
    customer_id UUID,
    customer_email TEXT,
    customer_name TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    rag_enabled BOOLEAN DEFAULT false,
    ticket_id TEXT,
    assignedtoai BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_message_at TIMESTAMPTZ
);

-- 6. Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Message content and metadata
    content TEXT NOT NULL,
    sender_id TEXT,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'agent', 'system', 'ai_assistant', 'tool')),
    sender_name TEXT,
    sender_email TEXT,
    
    -- Message properties
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'ai_response', 'handover')),
    content_type TEXT DEFAULT 'text',
    status TEXT DEFAULT 'sent',
    
    -- Flags
    is_internal BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    
    -- AI-related fields
    confidence_score FLOAT,
    escalation_required BOOLEAN DEFAULT false,
    ai_metadata JSONB DEFAULT '{}',
    assignedtoai BOOLEAN DEFAULT false,
    
    -- Metadata and timestamps
    metadata JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Agent availability table (will be created by dedicated migration)
-- Skipping to avoid conflicts with 20250101000000_create_agent_availability.sql

-- 8. AI processing logs table
CREATE TABLE IF NOT EXISTS ai_processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    event_type TEXT DEFAULT 'message_processing',
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);

CREATE INDEX IF NOT EXISTS idx_org_members_organization_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_org ON organization_members(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(status);

CREATE INDEX IF NOT EXISTS idx_mailboxes_organization_id ON mailboxes(organization_id);
CREATE INDEX IF NOT EXISTS idx_mailboxes_slug ON mailboxes(organization_id, slug);

CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assignee_id ON conversations(assignee_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assignedtoai ON conversations(assignedtoai) WHERE assignedtoai = true;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_assignedtoai ON messages(assignedtoai) WHERE assignedtoai = true;

-- Agent availability indexes will be created by dedicated migration

CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_conversation_id ON ai_processing_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_status ON ai_processing_logs(status);

-- Create a view to help Supabase understand the relationships
CREATE OR REPLACE VIEW user_organization_info AS
SELECT
    p.user_id,
    p.email,
    p.full_name,
    p.organization_id,
    o.name as organization_name,
    o.slug as organization_slug,
    om.role,
    om.status,
    om.created_at as membership_created_at
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN organization_members om ON p.user_id = om.user_id AND p.organization_id = om.organization_id;

-- Grant permissions on the view
GRANT SELECT ON user_organization_info TO authenticated;
GRANT SELECT ON user_organization_info TO anon;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
