-- Essential Widget Features Migration
-- Only creates tables that don't exist and are essential for widget functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure messages table exists with proper schema
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'agent', 'system')),
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);

-- Widget welcome configuration table
CREATE TABLE IF NOT EXISTS widget_welcome_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    welcome_title TEXT DEFAULT 'Welcome! How can we help?',
    welcome_message TEXT DEFAULT 'Start a conversation or browse our help center.',
    show_branding BOOLEAN DEFAULT true,
    auto_greeting_enabled BOOLEAN DEFAULT false,
    auto_greeting_message TEXT DEFAULT 'Hi there! 👋 Need any help?',
    track_interactions BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Widget quick replies table
CREATE TABLE IF NOT EXISTS widget_quick_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    text TEXT NOT NULL,
    response TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQ categories table
CREATE TABLE IF NOT EXISTS faq_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#4F46E5',
    icon TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQ articles table
CREATE TABLE IF NOT EXISTS faq_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    category_id UUID REFERENCES faq_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for FAQ tables
CREATE INDEX IF NOT EXISTS idx_faq_categories_organization_id ON faq_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_faq_articles_organization_id ON faq_articles(organization_id);
CREATE INDEX IF NOT EXISTS idx_faq_articles_category_id ON faq_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_faq_articles_tags ON faq_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_faq_articles_keywords ON faq_articles USING GIN(keywords);

-- Business hours table
CREATE TABLE IF NOT EXISTS business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT false,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, day_of_week)
);

-- Typing indicators table (essential for real-time features)
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'agent')),
    is_typing BOOLEAN DEFAULT false,
    content TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Create indexes for typing indicators
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_updated_at ON typing_indicators(updated_at);

-- Enable RLS on all tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_welcome_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies (allow all for now)
DO $$ 
BEGIN
    -- Messages policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'messages_select_policy') THEN
        CREATE POLICY "messages_select_policy" ON messages FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'messages_insert_policy') THEN
        CREATE POLICY "messages_insert_policy" ON messages FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'messages_update_policy') THEN
        CREATE POLICY "messages_update_policy" ON messages FOR UPDATE USING (true);
    END IF;

    -- Widget welcome config policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'widget_welcome_config' AND policyname = 'widget_welcome_select_policy') THEN
        CREATE POLICY "widget_welcome_select_policy" ON widget_welcome_config FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'widget_welcome_config' AND policyname = 'widget_welcome_insert_policy') THEN
        CREATE POLICY "widget_welcome_insert_policy" ON widget_welcome_config FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'widget_welcome_config' AND policyname = 'widget_welcome_update_policy') THEN
        CREATE POLICY "widget_welcome_update_policy" ON widget_welcome_config FOR UPDATE USING (true);
    END IF;

    -- Quick replies policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'widget_quick_replies' AND policyname = 'quick_replies_select_policy') THEN
        CREATE POLICY "quick_replies_select_policy" ON widget_quick_replies FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'widget_quick_replies' AND policyname = 'quick_replies_insert_policy') THEN
        CREATE POLICY "quick_replies_insert_policy" ON widget_quick_replies FOR INSERT WITH CHECK (true);
    END IF;

    -- FAQ policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faq_categories' AND policyname = 'faq_categories_select_policy') THEN
        CREATE POLICY "faq_categories_select_policy" ON faq_categories FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faq_articles' AND policyname = 'faq_articles_select_policy') THEN
        CREATE POLICY "faq_articles_select_policy" ON faq_articles FOR SELECT USING (true);
    END IF;

    -- Business hours policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_hours' AND policyname = 'business_hours_select_policy') THEN
        CREATE POLICY "business_hours_select_policy" ON business_hours FOR SELECT USING (true);
    END IF;

    -- Typing indicators policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'typing_indicators' AND policyname = 'typing_indicators_select_policy') THEN
        CREATE POLICY "typing_indicators_select_policy" ON typing_indicators FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'typing_indicators' AND policyname = 'typing_indicators_insert_policy') THEN
        CREATE POLICY "typing_indicators_insert_policy" ON typing_indicators FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'typing_indicators' AND policyname = 'typing_indicators_update_policy') THEN
        CREATE POLICY "typing_indicators_update_policy" ON typing_indicators FOR UPDATE USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'typing_indicators' AND policyname = 'typing_indicators_delete_policy') THEN
        CREATE POLICY "typing_indicators_delete_policy" ON typing_indicators FOR DELETE USING (true);
    END IF;
END $$;

-- Create FAQ search function
CREATE OR REPLACE FUNCTION search_faq_articles(
    p_organization_id UUID,
    p_query TEXT DEFAULT '',
    p_category_id UUID DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    summary TEXT,
    category_name TEXT,
    category_color TEXT,
    tags TEXT[],
    keywords TEXT[],
    view_count INTEGER,
    helpful_count INTEGER,
    not_helpful_count INTEGER,
    relevance_score FLOAT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.content,
        a.summary,
        c.name as category_name,
        c.color as category_color,
        a.tags,
        a.keywords,
        a.view_count,
        a.helpful_count,
        a.not_helpful_count,
        CASE 
            WHEN p_query = '' THEN 1.0
            ELSE ts_rank(
                to_tsvector('english', a.title || ' ' || a.content || ' ' || array_to_string(a.keywords, ' ')),
                plainto_tsquery('english', p_query)
            )
        END as relevance_score
    FROM faq_articles a
    LEFT JOIN faq_categories c ON a.category_id = c.id
    WHERE a.organization_id = p_organization_id
        AND a.is_published = true
        AND (p_category_id IS NULL OR a.category_id = p_category_id)
        AND (p_tags IS NULL OR a.tags && p_tags)
        AND (
            p_query = '' OR
            to_tsvector('english', a.title || ' ' || a.content || ' ' || array_to_string(a.keywords, ' ')) 
            @@ plainto_tsquery('english', p_query)
        )
    ORDER BY relevance_score DESC, a.view_count DESC
    LIMIT p_limit;
END;
$$;

-- Insert default data
INSERT INTO widget_welcome_config (organization_id, welcome_title, welcome_message)
VALUES ('b5e80170-004c-4e82-a88c-3e2166b169dd', 'Welcome to Campfire! 🔥', 'How can we help you today?')
ON CONFLICT DO NOTHING;

INSERT INTO faq_categories (organization_id, name, description, color, order_index)
VALUES 
    ('b5e80170-004c-4e82-a88c-3e2166b169dd', 'Getting Started', 'Basic questions about our service', '#10B981', 1),
    ('b5e80170-004c-4e82-a88c-3e2166b169dd', 'Account & Billing', 'Questions about accounts and payments', '#3B82F6', 2),
    ('b5e80170-004c-4e82-a88c-3e2166b169dd', 'Technical Support', 'Technical issues and troubleshooting', '#EF4444', 3)
ON CONFLICT DO NOTHING;

INSERT INTO widget_quick_replies (organization_id, text, response, order_index)
VALUES 
    ('b5e80170-004c-4e82-a88c-3e2166b169dd', 'I need help with my account', 'I can help you with account-related questions. What specific issue are you experiencing?', 1),
    ('b5e80170-004c-4e82-a88c-3e2166b169dd', 'How do I get started?', 'Great question! Let me guide you through the setup process.', 2),
    ('b5e80170-004c-4e82-a88c-3e2166b169dd', 'I have a technical issue', 'I''m here to help with technical problems. Can you describe what''s happening?', 3)
ON CONFLICT DO NOTHING;
