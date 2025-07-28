-- =====================================================
-- ULTIMATE WIDGET ENHANCEMENTS MIGRATION
-- Adds advanced features for the sophisticated chat widget
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- AGENT QUEUE MANAGEMENT
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    visitor_id UUID,
    visitor_name VARCHAR(255),
    
    -- Queue Management
    queue_position INTEGER NOT NULL,
    estimated_wait_time INTEGER DEFAULT 0, -- seconds
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Assignment Details
    preferred_agent_id UUID,
    assigned_agent_id UUID,
    assignment_reason TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT agent_queue_conversation_unique UNIQUE (conversation_id),
    CONSTRAINT agent_queue_position_positive CHECK (queue_position > 0)
);

-- Indexes for agent queue
CREATE INDEX idx_agent_queue_organization ON agent_queue(organization_id);
CREATE INDEX idx_agent_queue_position ON agent_queue(queue_position);
CREATE INDEX idx_agent_queue_priority ON agent_queue(priority);
CREATE INDEX idx_agent_queue_created_at ON agent_queue(created_at);

-- =====================================================
-- AGENT AVAILABILITY & WORKLOAD
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_availability (
    agent_id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    
    -- Status Management
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'away', 'offline')),
    status_message TEXT,
    
    -- Workload Management
    max_concurrent_chats INTEGER DEFAULT 5 CHECK (max_concurrent_chats > 0),
    current_chat_count INTEGER DEFAULT 0 CHECK (current_chat_count >= 0),
    
    -- Assignment Rules
    auto_assign BOOLEAN DEFAULT true,
    skills JSONB DEFAULT '[]', -- Array of skill tags
    priority_score INTEGER DEFAULT 100, -- Higher = more preferred
    
    -- Performance Metrics
    avg_response_time INTEGER DEFAULT 0, -- seconds
    satisfaction_score DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 5.0
    total_conversations INTEGER DEFAULT 0,
    
    -- Availability Schedule
    working_hours JSONB DEFAULT '{}', -- { "monday": { "start": "09:00", "end": "17:00" }, ... }
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Timestamps
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT agent_availability_workload_check CHECK (current_chat_count <= max_concurrent_chats)
);

-- Indexes for agent availability
CREATE INDEX idx_agent_availability_organization ON agent_availability(organization_id);
CREATE INDEX idx_agent_availability_status ON agent_availability(status);
CREATE INDEX idx_agent_availability_auto_assign ON agent_availability(auto_assign);
CREATE INDEX idx_agent_availability_last_active ON agent_availability(last_active);

-- =====================================================
-- ENHANCED TYPING INDICATORS WITH LIVE PREVIEW
-- =====================================================
-- Extend existing typing_indicators table
ALTER TABLE typing_indicators 
ADD COLUMN IF NOT EXISTS live_content TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS cursor_position INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS typing_speed INTEGER DEFAULT 0; -- characters per minute

-- Update typing indicators index
CREATE INDEX IF NOT EXISTS idx_typing_indicators_live_content ON typing_indicators(conversation_id, user_id) WHERE live_content IS NOT NULL AND live_content != '';

-- =====================================================
-- KNOWLEDGE BASE INTEGRATION
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    
    -- Content
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    
    -- Categorization
    category VARCHAR(100),
    tags TEXT[],
    keywords TEXT[],
    
    -- Search & AI
    embedding vector(1536), -- OpenAI embedding
    search_vector tsvector,
    
    -- Metadata
    author_id UUID,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    language VARCHAR(10) DEFAULT 'en',
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0.0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for knowledge articles
CREATE INDEX idx_knowledge_articles_organization ON knowledge_articles(organization_id);
CREATE INDEX idx_knowledge_articles_category ON knowledge_articles(category);
CREATE INDEX idx_knowledge_articles_status ON knowledge_articles(status);
CREATE INDEX idx_knowledge_articles_search_vector ON knowledge_articles USING gin(search_vector);
CREATE INDEX idx_knowledge_articles_tags ON knowledge_articles USING gin(tags);

-- =====================================================
-- FAQ SYSTEM
-- =====================================================
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    
    -- Content
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    
    -- Categorization
    category VARCHAR(100),
    tags TEXT[],
    
    -- Display
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for FAQs
CREATE INDEX idx_faqs_organization ON faqs(organization_id);
CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_status ON faqs(status);
CREATE INDEX idx_faqs_display_order ON faqs(display_order);
CREATE INDEX idx_faqs_featured ON faqs(is_featured);

-- =====================================================
-- WIDGET ANALYTICS
-- =====================================================
CREATE TABLE IF NOT EXISTS widget_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    conversation_id UUID,
    
    -- Event Details
    event_type VARCHAR(50) NOT NULL, -- 'widget_open', 'message_sent', 'faq_viewed', etc.
    event_data JSONB DEFAULT '{}',
    
    -- User Context
    visitor_id UUID,
    session_id VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    
    -- Performance Metrics
    load_time INTEGER, -- milliseconds
    response_time INTEGER, -- milliseconds
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for widget analytics
CREATE INDEX idx_widget_analytics_organization ON widget_analytics(organization_id);
CREATE INDEX idx_widget_analytics_event_type ON widget_analytics(event_type);
CREATE INDEX idx_widget_analytics_conversation ON widget_analytics(conversation_id);
CREATE INDEX idx_widget_analytics_created_at ON widget_analytics(created_at);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update queue positions
CREATE OR REPLACE FUNCTION update_queue_positions()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate queue positions when items are added/removed
    WITH numbered_queue AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY priority DESC, created_at ASC) as new_position
        FROM agent_queue
        WHERE completed_at IS NULL
    )
    UPDATE agent_queue 
    SET queue_position = numbered_queue.new_position,
        updated_at = NOW()
    FROM numbered_queue
    WHERE agent_queue.id = numbered_queue.id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for queue position updates
DROP TRIGGER IF EXISTS trigger_update_queue_positions ON agent_queue;
CREATE TRIGGER trigger_update_queue_positions
    AFTER INSERT OR DELETE OR UPDATE ON agent_queue
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_queue_positions();

-- Function to update agent workload
CREATE OR REPLACE FUNCTION update_agent_workload()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current chat count when conversations are assigned/completed
    IF TG_OP = 'INSERT' AND NEW.assigned_agent_id IS NOT NULL THEN
        UPDATE agent_availability 
        SET current_chat_count = current_chat_count + 1,
            updated_at = NOW()
        WHERE agent_id = NEW.assigned_agent_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.assigned_agent_id IS DISTINCT FROM NEW.assigned_agent_id THEN
        -- Remove from old agent
        IF OLD.assigned_agent_id IS NOT NULL THEN
            UPDATE agent_availability 
            SET current_chat_count = GREATEST(current_chat_count - 1, 0),
                updated_at = NOW()
            WHERE agent_id = OLD.assigned_agent_id;
        END IF;
        -- Add to new agent
        IF NEW.assigned_agent_id IS NOT NULL THEN
            UPDATE agent_availability 
            SET current_chat_count = current_chat_count + 1,
                updated_at = NOW()
            WHERE agent_id = NEW.assigned_agent_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.assigned_agent_id IS NOT NULL THEN
        UPDATE agent_availability 
        SET current_chat_count = GREATEST(current_chat_count - 1, 0),
            updated_at = NOW()
        WHERE agent_id = OLD.assigned_agent_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for agent workload updates
DROP TRIGGER IF EXISTS trigger_update_agent_workload ON agent_queue;
CREATE TRIGGER trigger_update_agent_workload
    AFTER INSERT OR UPDATE OR DELETE ON agent_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_workload();

-- Function to update search vectors for knowledge articles
CREATE OR REPLACE FUNCTION update_knowledge_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '') || ' ' || COALESCE(array_to_string(NEW.tags, ' '), ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for knowledge article search vectors
DROP TRIGGER IF EXISTS trigger_update_knowledge_search_vector ON knowledge_articles;
CREATE TRIGGER trigger_update_knowledge_search_vector
    BEFORE INSERT OR UPDATE ON knowledge_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_search_vector();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default agent availability for existing agents
INSERT INTO agent_availability (agent_id, organization_id, status, auto_assign)
SELECT DISTINCT 
    p.user_id,
    p.organization_id,
    'offline',
    true
FROM profiles p
WHERE p.role IN ('admin', 'agent')
ON CONFLICT (agent_id) DO NOTHING;

-- Create default FAQ categories
INSERT INTO faqs (organization_id, question, answer, category, is_featured, display_order)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'How can I get help?', 'You can start a conversation with our support team by clicking the chat button. We''re here to help!', 'General', true, 1),
    ('550e8400-e29b-41d4-a716-446655440000', 'What are your business hours?', 'Our support team is available 24/7 to assist you with any questions or concerns.', 'General', true, 2),
    ('550e8400-e29b-41d4-a716-446655440000', 'How quickly will I get a response?', 'We typically respond within minutes during business hours. For urgent issues, we''re available around the clock.', 'General', true, 3)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE agent_queue IS 'Manages the queue of conversations waiting for agent assignment';
COMMENT ON TABLE agent_availability IS 'Tracks agent availability, workload, and assignment preferences';
COMMENT ON TABLE knowledge_articles IS 'Stores knowledge base articles for self-service support';
COMMENT ON TABLE faqs IS 'Frequently asked questions for quick customer self-service';
COMMENT ON TABLE widget_analytics IS 'Analytics and performance tracking for widget interactions';
