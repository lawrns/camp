-- Security Monitoring Tables
-- Team 3: Security/DevOps
-- 
-- Tables for security event logging, monitoring, and alerting

-- 1. Security logs table
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_security_logs_event_type (event_type),
    INDEX idx_security_logs_severity (severity),
    INDEX idx_security_logs_user_id (user_id),
    INDEX idx_security_logs_organization_id (organization_id),
    INDEX idx_security_logs_created_at (created_at),
    INDEX idx_security_logs_ip_address (ip_address)
);

-- Enable RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can insert logs
CREATE POLICY "service_role_insert_logs" ON security_logs
FOR INSERT TO service_role
WITH CHECK (true);

-- Admins can read logs for their organization
CREATE POLICY "admin_read_org_logs" ON security_logs
FOR SELECT USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
    AND EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.profile_id = auth.uid()
        AND om.organization_id = security_logs.organization_id
        AND om.role = 'admin'
    )
);

-- 2. Security alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('WARNING', 'ERROR', 'CRITICAL')),
    details JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_security_alerts_severity (severity),
    INDEX idx_security_alerts_resolved (resolved),
    INDEX idx_security_alerts_created_at (created_at)
);

-- Enable RLS
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "service_role_manage_alerts" ON security_alerts
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- 3. Security metrics table (for aggregated data)
CREATE TABLE IF NOT EXISTS security_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL,
    metric_value JSONB NOT NULL,
    time_bucket TIMESTAMPTZ NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicates
    UNIQUE(metric_type, time_bucket, organization_id),
    
    -- Indexes
    INDEX idx_security_metrics_type (metric_type),
    INDEX idx_security_metrics_bucket (time_bucket),
    INDEX idx_security_metrics_org (organization_id)
);

-- Enable RLS
ALTER TABLE security_metrics ENABLE ROW LEVEL SECURITY;

-- Organization isolation
CREATE POLICY "metrics_org_isolation" ON security_metrics
FOR ALL USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
);

-- 4. Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- Could be user_id, ip_address, api_key, etc
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    window_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
    
    -- Unique constraint
    UNIQUE(identifier, endpoint, window_start),
    
    -- Indexes
    INDEX idx_rate_limits_identifier (identifier),
    INDEX idx_rate_limits_endpoint (endpoint),
    INDEX idx_rate_limits_window (window_start, window_end)
);

-- No RLS on rate limits (managed by service)

-- 5. Security configuration table
CREATE TABLE IF NOT EXISTS security_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE security_config ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage
CREATE POLICY "super_admin_only" ON security_config
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.is_super_admin = true
    )
);

-- Insert default security configurations
INSERT INTO security_config (config_key, config_value, description) VALUES
('alert_thresholds', '{
    "failed_logins_per_user_per_hour": 5,
    "failed_logins_per_ip_per_hour": 10,
    "api_errors_per_minute": 20,
    "rls_violations_per_hour": 3,
    "cross_org_attempts_per_day": 1,
    "rate_limit_violations_per_hour": 10
}', 'Thresholds for security alerts'),
('rate_limits', '{
    "default": {"requests": 100, "window": "1 minute"},
    "api": {"requests": 1000, "window": "1 hour"},
    "auth": {"requests": 10, "window": "5 minutes"},
    "widget": {"requests": 50, "window": "1 minute"}
}', 'Rate limiting configuration'),
('monitoring_enabled', 'true', 'Enable security monitoring')
ON CONFLICT (config_key) DO NOTHING;

-- 6. Helper functions

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_limit INTEGER,
    p_window INTERVAL
) RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
    v_window_start TIMESTAMPTZ;
BEGIN
    v_window_start := NOW() - p_window;
    
    -- Count requests in window
    SELECT SUM(request_count) INTO v_count
    FROM rate_limits
    WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start >= v_window_start;
    
    -- Check if limit exceeded
    IF COALESCE(v_count, 0) >= p_limit THEN
        RETURN FALSE; -- Rate limit exceeded
    END IF;
    
    -- Record this request
    INSERT INTO rate_limits (identifier, endpoint, window_start, window_end)
    VALUES (p_identifier, p_endpoint, NOW(), NOW() + p_window)
    ON CONFLICT (identifier, endpoint, window_start) 
    DO UPDATE SET request_count = rate_limits.request_count + 1;
    
    RETURN TRUE; -- Within rate limit
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get security metrics
CREATE OR REPLACE FUNCTION get_security_metrics(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_organization_id UUID DEFAULT NULL
) RETURNS TABLE (
    event_type TEXT,
    severity TEXT,
    count BIGINT,
    day DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.event_type,
        sl.severity,
        COUNT(*) as count,
        DATE(sl.created_at) as day
    FROM security_logs sl
    WHERE sl.created_at BETWEEN p_start_date AND p_end_date
    AND (p_organization_id IS NULL OR sl.organization_id = p_organization_id)
    GROUP BY sl.event_type, sl.severity, DATE(sl.created_at)
    ORDER BY day DESC, count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_security_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_security_alerts_updated_at
BEFORE UPDATE ON security_alerts
FOR EACH ROW
EXECUTE FUNCTION update_security_updated_at();

-- Grant necessary permissions
GRANT SELECT ON security_logs TO authenticated;
GRANT SELECT ON security_alerts TO authenticated;
GRANT SELECT ON security_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION get_security_metrics TO authenticated;