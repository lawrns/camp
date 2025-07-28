-- Add missing onboarding tables for Campfire
-- This migration adds the tables referenced in the onboarding API routes

-- 1. Create onboarding_completion_tracking table
CREATE TABLE IF NOT EXISTS onboarding_completion_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    current_step TEXT NOT NULL DEFAULT 'business',
    completed_steps TEXT[] DEFAULT '{}',
    skipped_steps TEXT[] DEFAULT '{}',
    total_steps INTEGER DEFAULT 4,
    is_completed BOOLEAN DEFAULT false,
    completion_percentage INTEGER DEFAULT 0,
    estimated_time_remaining INTEGER DEFAULT 15, -- minutes
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one tracking record per user
    UNIQUE(user_id)
);

-- 2. Create onboarding_preferences table
CREATE TABLE IF NOT EXISTS onboarding_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Business Information
    industry TEXT,
    company_size TEXT,
    support_volume TEXT,
    
    -- Team Information
    team_size TEXT,
    current_tools TEXT,
    challenges TEXT,
    
    -- AI Configuration
    ai_tone TEXT DEFAULT 'professional' CHECK (ai_tone IN ('professional', 'friendly', 'casual', 'formal')),
    ai_automation_level TEXT DEFAULT 'balanced' CHECK (ai_automation_level IN ('minimal', 'balanced', 'aggressive')),
    ai_handover_threshold DECIMAL(3,2) DEFAULT 0.7 CHECK (ai_handover_threshold >= 0 AND ai_handover_threshold <= 1),
    
    -- Widget Customization
    widget_position TEXT DEFAULT 'bottom-right' CHECK (widget_position IN ('bottom-right', 'bottom-left', 'top-right', 'top-left')),
    widget_color TEXT DEFAULT '#3b82f6' CHECK (widget_color ~ '^#[0-9A-Fa-f]{6}$'),
    widget_greeting TEXT,
    widget_offline_message TEXT,
    
    -- Dashboard Preferences
    dashboard_layout TEXT DEFAULT 'default' CHECK (dashboard_layout IN ('default', 'compact', 'detailed')),
    preferred_metrics TEXT[] DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{}',
    
    -- Communication Channels
    enabled_channels TEXT[] DEFAULT '{"chat"}',
    channel_priorities JSONB DEFAULT '{}',
    
    -- Additional settings
    enable_notifications BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one preference record per user per organization
    UNIQUE(user_id, organization_id)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_tracking_user_id 
ON onboarding_completion_tracking(user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_tracking_org_id 
ON onboarding_completion_tracking(organization_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_tracking_completed 
ON onboarding_completion_tracking(is_completed);

CREATE INDEX IF NOT EXISTS idx_onboarding_preferences_user_id 
ON onboarding_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_preferences_org_id 
ON onboarding_preferences(organization_id);

-- 4. Enable RLS (Row Level Security)
ALTER TABLE onboarding_completion_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_preferences ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for onboarding_completion_tracking
CREATE POLICY "Users can view their own onboarding tracking" 
ON onboarding_completion_tracking
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own onboarding tracking" 
ON onboarding_completion_tracking
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own onboarding tracking" 
ON onboarding_completion_tracking
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage all onboarding tracking" 
ON onboarding_completion_tracking
FOR ALL 
USING (auth.jwt()->>'role' = 'service_role');

-- 6. Create RLS policies for onboarding_preferences
CREATE POLICY "Users can view their own onboarding preferences" 
ON onboarding_preferences
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own onboarding preferences" 
ON onboarding_preferences
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Organization members can view preferences in their org" 
ON onboarding_preferences
FOR SELECT 
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

CREATE POLICY "Service role can manage all onboarding preferences" 
ON onboarding_preferences
FOR ALL 
USING (auth.jwt()->>'role' = 'service_role');

-- 7. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers to automatically update updated_at
CREATE TRIGGER update_onboarding_tracking_updated_at 
    BEFORE UPDATE ON onboarding_completion_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_preferences_updated_at 
    BEFORE UPDATE ON onboarding_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Add helpful comments
COMMENT ON TABLE onboarding_completion_tracking IS 'Tracks user progress through the onboarding flow';
COMMENT ON TABLE onboarding_preferences IS 'Stores user preferences collected during onboarding';

COMMENT ON COLUMN onboarding_completion_tracking.current_step IS 'Current step in the onboarding flow';
COMMENT ON COLUMN onboarding_completion_tracking.completed_steps IS 'Array of completed step IDs';
COMMENT ON COLUMN onboarding_completion_tracking.completion_percentage IS 'Percentage of onboarding completed (0-100)';
COMMENT ON COLUMN onboarding_completion_tracking.estimated_time_remaining IS 'Estimated minutes to complete onboarding';

COMMENT ON COLUMN onboarding_preferences.ai_tone IS 'Preferred tone for AI responses';
COMMENT ON COLUMN onboarding_preferences.widget_color IS 'Hex color code for chat widget';
COMMENT ON COLUMN onboarding_preferences.dashboard_layout IS 'Preferred dashboard layout style';

-- Record this migration
INSERT INTO applied_migrations (filename, success, applied_at)
VALUES ('20250706_add_onboarding_tables.sql', true, NOW())
ON CONFLICT (filename) DO UPDATE SET 
    success = EXCLUDED.success,
    applied_at = EXCLUDED.applied_at;
