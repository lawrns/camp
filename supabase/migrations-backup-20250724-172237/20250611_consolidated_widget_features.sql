-- Consolidated Widget Features Migration
-- This migration adds essential tables and features for the widget system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

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

-- Enable RLS on all tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_welcome_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
CREATE POLICY "messages_select_policy" ON messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
CREATE POLICY "messages_insert_policy" ON messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "messages_update_policy" ON messages;
CREATE POLICY "messages_update_policy" ON messages FOR UPDATE USING (true);

-- RLS Policies for widget_welcome_config
DROP POLICY IF EXISTS "widget_welcome_select_policy" ON widget_welcome_config;
CREATE POLICY "widget_welcome_select_policy" ON widget_welcome_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "widget_welcome_insert_policy" ON widget_welcome_config;
CREATE POLICY "widget_welcome_insert_policy" ON widget_welcome_config FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "widget_welcome_update_policy" ON widget_welcome_config;
CREATE POLICY "widget_welcome_update_policy" ON widget_welcome_config FOR UPDATE USING (true);

-- RLS Policies for widget_quick_replies
DROP POLICY IF EXISTS "quick_replies_select_policy" ON widget_quick_replies;
CREATE POLICY "quick_replies_select_policy" ON widget_quick_replies FOR SELECT USING (true);

DROP POLICY IF EXISTS "quick_replies_insert_policy" ON widget_quick_replies;
CREATE POLICY "quick_replies_insert_policy" ON widget_quick_replies FOR INSERT WITH CHECK (true);

-- RLS Policies for FAQ tables
DROP POLICY IF EXISTS "faq_categories_select_policy" ON faq_categories;
CREATE POLICY "faq_categories_select_policy" ON faq_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "faq_articles_select_policy" ON faq_articles;
CREATE POLICY "faq_articles_select_policy" ON faq_articles FOR SELECT USING (true);

DROP POLICY IF EXISTS "business_hours_select_policy" ON business_hours;
CREATE POLICY "business_hours_select_policy" ON business_hours FOR SELECT USING (true);

-- Enable realtime for essential tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

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

-- Insert default FAQ categories and articles for testing
INSERT INTO faq_categories (organization_id, name, description, color, order_index)
VALUES 
    ('b5e80170-004c-4e82-a88c-3e2166b169dd', 'Getting Started', 'Basic questions about our service', '#10B981', 1),
    ('b5e80170-004c-4e82-a88c-3e2166b169dd', 'Account & Billing', 'Questions about accounts and payments', '#3B82F6', 2),
    ('b5e80170-004c-4e82-a88c-3e2166b169dd', 'Technical Support', 'Technical issues and troubleshooting', '#EF4444', 3)
ON CONFLICT DO NOTHING;

-- Insert sample FAQ articles
INSERT INTO faq_articles (organization_id, category_id, title, content, summary, tags, keywords)
SELECT 
    'b5e80170-004c-4e82-a88c-3e2166b169dd',
    c.id,
    'How do I get started?',
    'Getting started is easy! Simply sign up for an account and follow our onboarding guide.',
    'Quick guide to getting started with our platform',
    ARRAY['getting-started', 'onboarding'],
    ARRAY['start', 'begin', 'setup', 'account']
FROM faq_categories c 
WHERE c.name = 'Getting Started' AND c.organization_id = 'b5e80170-004c-4e82-a88c-3e2166b169dd'
ON CONFLICT DO NOTHING;

-- Insert default widget welcome config
INSERT INTO widget_welcome_config (organization_id, welcome_title, welcome_message)
VALUES ('b5e80170-004c-4e82-a88c-3e2166b169dd', 'Welcome to Campfire! 🔥', 'How can we help you today?')
ON CONFLICT DO NOTHING;

-- Insert default quick replies
INSERT INTO widget_quick_replies (organization_id, text, response, order_index)
VALUES 
    ('b5e80170-004c-4e82-a88c-3e2166b169dd', 'I need help with my account', 'I can help you with account-related questions. What specific issue are you experiencing?', 1),
    ('b5e80170-004c-4e82-a88c-3e2166b169dd', 'How do I get started?', 'Great question! Let me guide you through the setup process.', 2),
    ('b5e80170-004c-4e82-a88c-3e2166b169dd', 'I have a technical issue', 'I''m here to help with technical problems. Can you describe what''s happening?', 3)
ON CONFLICT DO NOTHING;
