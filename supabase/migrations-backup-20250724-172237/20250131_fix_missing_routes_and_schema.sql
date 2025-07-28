-- Fix missing routes and schema issues
-- This migration ensures all necessary database columns exist for the new dashboard pages

-- Ensure organizations table has settings column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'settings'
    ) THEN
        ALTER TABLE organizations ADD COLUMN settings JSONB DEFAULT '{}' NOT NULL;
    END IF;
END $$;

-- Ensure profiles table has necessary columns for team management
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'skills'
    ) THEN
        ALTER TABLE profiles ADD COLUMN skills TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'timezone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('message', 'mention', 'assignment', 'system', 'alert')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_settings JSONB DEFAULT '{"newMessages": true, "mentions": true, "assignments": true, "systemAlerts": false}',
    push_settings JSONB DEFAULT '{"newMessages": true, "mentions": true, "assignments": true, "systemAlerts": true}',
    in_app_settings JSONB DEFAULT '{"newMessages": true, "mentions": true, "assignments": true, "systemAlerts": true}',
    quiet_hours JSONB DEFAULT '{"enabled": false, "startTime": "22:00", "endTime": "08:00"}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Create ai_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    accuracy DECIMAL(5,2) DEFAULT 0,
    response_time DECIMAL(8,2) DEFAULT 0,
    handoff_rate DECIMAL(5,2) DEFAULT 0,
    satisfaction_score DECIMAL(3,2) DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,
    resolved_queries INTEGER DEFAULT 0,
    escalations INTEGER DEFAULT 0,
    learning_progress DECIMAL(5,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, date)
);

-- Create ai_insights table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('performance', 'optimization', 'training', 'alert')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    impact TEXT DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high')),
    action_required BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support_tickets table if it doesn't exist
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create help_articles table if it doesn't exist
CREATE TABLE IF NOT EXISTS help_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    type TEXT DEFAULT 'article' CHECK (type IN ('article', 'video', 'guide', 'tutorial')),
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration TEXT,
    url TEXT,
    helpful_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_organization_user ON notifications(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_metrics_organization_date ON ai_metrics(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_ai_insights_organization ON ai_insights(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(type);

CREATE INDEX IF NOT EXISTS idx_support_tickets_organization ON support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category);
CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles(published);

-- Enable RLS on new tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for notification_settings
CREATE POLICY "Users can manage their own notification settings" ON notification_settings
    FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for ai_metrics (organization members only)
CREATE POLICY "Organization members can view ai_metrics" ON ai_metrics
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for ai_insights (organization members only)
CREATE POLICY "Organization members can view ai_insights" ON ai_insights
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for support_tickets
CREATE POLICY "Users can view their own support tickets" ON support_tickets
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own support tickets" ON support_tickets
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own support tickets" ON support_tickets
    FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for help_articles (public read)
CREATE POLICY "Anyone can view published help articles" ON help_articles
    FOR SELECT USING (published = true);

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TICK-' || LPAD(nextval('ticket_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create sequence for ticket numbers if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'ticket_number_seq') THEN
        CREATE SEQUENCE ticket_number_seq START 1;
    END IF;
END $$;

-- Create trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_ticket_number ON support_tickets;
CREATE TRIGGER trigger_set_ticket_number
    BEFORE INSERT ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_number();

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for all tables
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_metrics_updated_at ON ai_metrics;
CREATE TRIGGER update_ai_metrics_updated_at
    BEFORE UPDATE ON ai_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_insights_updated_at ON ai_insights;
CREATE TRIGGER update_ai_insights_updated_at
    BEFORE UPDATE ON ai_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_help_articles_updated_at ON help_articles;
CREATE TRIGGER update_help_articles_updated_at
    BEFORE UPDATE ON help_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
