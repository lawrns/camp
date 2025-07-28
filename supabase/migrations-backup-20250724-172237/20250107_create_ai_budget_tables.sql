-- Create AI Budget Management Tables
-- These tables support tracking AI usage costs and budget limits per organization

-- Create ai_budgets table
CREATE TABLE ai_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    monthly_limit_usd DECIMAL(10, 2) NOT NULL DEFAULT 0,
    current_spend_usd DECIMAL(10, 2) NOT NULL DEFAULT 0,
    period_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
    is_active BOOLEAN NOT NULL DEFAULT true,
    alert_threshold_percentage INTEGER DEFAULT 80, -- Alert when 80% of budget is reached
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(user_id),
    
    CONSTRAINT ai_budgets_monthly_limit_positive CHECK (monthly_limit_usd >= 0),
    CONSTRAINT ai_budgets_current_spend_positive CHECK (current_spend_usd >= 0),
    CONSTRAINT ai_budgets_alert_threshold_valid CHECK (alert_threshold_percentage > 0 AND alert_threshold_percentage <= 100),
    CONSTRAINT ai_budgets_period_valid CHECK (period_end_date > period_start_date)
);

-- Create ai_budget_alerts table
CREATE TABLE ai_budget_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES ai_budgets(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('threshold_reached', 'budget_exceeded', 'weekly_summary')),
    threshold_percentage INTEGER,
    current_spend_usd DECIMAL(10, 2) NOT NULL,
    budget_limit_usd DECIMAL(10, 2) NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES profiles(user_id),
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    metadata JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ai_budget_notifications table  
CREATE TABLE ai_budget_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES ai_budget_alerts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'slack', 'webhook', 'in_app')),
    recipient_email TEXT,
    recipient_user_id UUID REFERENCES profiles(user_id),
    webhook_url TEXT,
    slack_channel TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    metadata JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX ai_budgets_organization_id_idx ON ai_budgets(organization_id);
CREATE INDEX ai_budgets_active_idx ON ai_budgets(organization_id, is_active) WHERE is_active = true;
CREATE INDEX ai_budgets_period_idx ON ai_budgets(period_start_date, period_end_date);

CREATE INDEX ai_budget_alerts_budget_id_idx ON ai_budget_alerts(budget_id);
CREATE INDEX ai_budget_alerts_organization_id_idx ON ai_budget_alerts(organization_id);
CREATE INDEX ai_budget_alerts_triggered_at_idx ON ai_budget_alerts(triggered_at);
CREATE INDEX ai_budget_alerts_unacknowledged_idx ON ai_budget_alerts(organization_id, is_acknowledged) WHERE is_acknowledged = false;

CREATE INDEX ai_budget_notifications_alert_id_idx ON ai_budget_notifications(alert_id);
CREATE INDEX ai_budget_notifications_organization_id_idx ON ai_budget_notifications(organization_id);
CREATE INDEX ai_budget_notifications_status_idx ON ai_budget_notifications(status);
CREATE INDEX ai_budget_notifications_pending_idx ON ai_budget_notifications(status, created_at) WHERE status = 'pending';

-- Enable Row Level Security (RLS)
ALTER TABLE ai_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_budget_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_budget_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_budgets
CREATE POLICY "ai_budgets_select_policy" ON ai_budgets
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "ai_budgets_insert_policy" ON ai_budgets
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active' AND role IN ('admin', 'owner')
        )
    );

CREATE POLICY "ai_budgets_update_policy" ON ai_budgets
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active' AND role IN ('admin', 'owner')
        )
    );

CREATE POLICY "ai_budgets_delete_policy" ON ai_budgets
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active' AND role IN ('admin', 'owner')
        )
    );

-- RLS Policies for ai_budget_alerts
CREATE POLICY "ai_budget_alerts_select_policy" ON ai_budget_alerts
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "ai_budget_alerts_insert_policy" ON ai_budget_alerts
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "ai_budget_alerts_update_policy" ON ai_budget_alerts
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- RLS Policies for ai_budget_notifications
CREATE POLICY "ai_budget_notifications_select_policy" ON ai_budget_notifications
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "ai_budget_notifications_insert_policy" ON ai_budget_notifications
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "ai_budget_notifications_update_policy" ON ai_budget_notifications
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Enable realtime for budget alerts (for real-time notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE ai_budget_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_budget_notifications;

-- Create trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_budgets_updated_at 
    BEFORE UPDATE ON ai_budgets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_budget_notifications_updated_at 
    BEFORE UPDATE ON ai_budget_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default budget for existing organizations
INSERT INTO ai_budgets (organization_id, name, monthly_limit_usd, period_start_date, period_end_date)
SELECT 
    id as organization_id,
    'Default Monthly Budget' as name,
    100.00 as monthly_limit_usd, -- $100 default monthly limit
    DATE_TRUNC('month', CURRENT_DATE) as period_start_date,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day') as period_end_date
FROM organizations
WHERE NOT EXISTS (
    SELECT 1 FROM ai_budgets WHERE ai_budgets.organization_id = organizations.id
);

-- Comment on tables
COMMENT ON TABLE ai_budgets IS 'AI usage budget limits and tracking per organization';
COMMENT ON TABLE ai_budget_alerts IS 'Alerts triggered when budget thresholds are reached';
COMMENT ON TABLE ai_budget_notifications IS 'Notification delivery tracking for budget alerts';