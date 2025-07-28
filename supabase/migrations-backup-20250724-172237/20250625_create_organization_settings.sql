-- Create organization_settings table for system configuration
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  system_config JSONB NOT NULL DEFAULT '{}',
  widget_config JSONB DEFAULT '{}',
  notification_config JSONB DEFAULT '{}',
  security_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Ensure one settings record per organization
  UNIQUE(organization_id)
);

-- Create audit_logs table for tracking configuration changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_settings_org_id ON organization_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable RLS
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_settings
CREATE POLICY "Users can view settings for their organizations" ON organization_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage organization settings" ON organization_settings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Service role can access all settings" ON organization_settings
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for audit_logs
CREATE POLICY "Users can view audit logs for their organizations" ON audit_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can access all audit logs" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_organization_settings_updated_at 
  BEFORE UPDATE ON organization_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default settings for new organizations
CREATE OR REPLACE FUNCTION create_default_organization_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_settings (
    organization_id,
    system_config,
    widget_config,
    notification_config,
    security_config
  ) VALUES (
    NEW.id,
    '{
      "database": {
        "connectionPoolSize": 10,
        "queryTimeout": 30000,
        "enableReadReplicas": false,
        "backupRetention": 30
      },
      "realtime": {
        "maxConnections": 1000,
        "heartbeatInterval": 25000,
        "reconnectAttempts": 5,
        "messageQueueSize": 1000
      },
      "ai": {
        "provider": "openai",
        "model": "gpt-4",
        "maxTokens": 4000,
        "temperature": 0.7,
        "enableRAG": true,
        "confidenceThreshold": 0.8
      },
      "security": {
        "sessionTimeout": 3600,
        "maxLoginAttempts": 5,
        "enableTwoFactor": false,
        "passwordPolicy": {
          "minLength": 8,
          "requireSpecialChars": true,
          "requireNumbers": true
        }
      },
      "notifications": {
        "emailProvider": "resend",
        "webhookRetries": 3,
        "enablePushNotifications": true,
        "defaultNotificationSettings": {
          "newConversation": true,
          "agentAssignment": true,
          "escalation": true
        }
      },
      "performance": {
        "cacheTimeout": 3600,
        "enableCompression": true,
        "maxFileSize": 10485760,
        "rateLimitRequests": 1000
      }
    }',
    '{
      "position": "bottom-right",
      "theme": "light",
      "primaryColor": "#3B82F6",
      "welcomeMessage": "Hi! How can we help you today?",
      "enableFileUpload": true,
      "enableEmojis": true,
      "showAgentTyping": true,
      "autoOpen": false,
      "workingHours": {
        "enabled": false,
        "timezone": "UTC",
        "schedule": {}
      }
    }',
    '{
      "email": {
        "newConversation": true,
        "agentAssignment": true,
        "escalation": true,
        "dailyDigest": false
      },
      "push": {
        "newMessage": true,
        "mentions": true,
        "escalation": true
      },
      "webhook": {
        "enabled": false,
        "url": "",
        "events": []
      }
    }',
    '{
      "twoFactorRequired": false,
      "sessionTimeout": 3600,
      "ipWhitelist": [],
      "allowedDomains": [],
      "passwordPolicy": {
        "minLength": 8,
        "requireUppercase": true,
        "requireLowercase": true,
        "requireNumbers": true,
        "requireSpecialChars": true,
        "maxAge": 90
      }
    }'
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create default settings for new organizations
CREATE TRIGGER create_default_settings_trigger
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION create_default_organization_settings();

-- Create default settings for existing organizations (if any)
INSERT INTO organization_settings (
  organization_id,
  system_config,
  widget_config,
  notification_config,
  security_config
)
SELECT 
  id,
  '{
    "database": {"connectionPoolSize": 10, "queryTimeout": 30000, "enableReadReplicas": false, "backupRetention": 30},
    "realtime": {"maxConnections": 1000, "heartbeatInterval": 25000, "reconnectAttempts": 5, "messageQueueSize": 1000},
    "ai": {"provider": "openai", "model": "gpt-4", "maxTokens": 4000, "temperature": 0.7, "enableRAG": true, "confidenceThreshold": 0.8},
    "security": {"sessionTimeout": 3600, "maxLoginAttempts": 5, "enableTwoFactor": false, "passwordPolicy": {"minLength": 8, "requireSpecialChars": true, "requireNumbers": true}},
    "notifications": {"emailProvider": "resend", "webhookRetries": 3, "enablePushNotifications": true, "defaultNotificationSettings": {"newConversation": true, "agentAssignment": true, "escalation": true}},
    "performance": {"cacheTimeout": 3600, "enableCompression": true, "maxFileSize": 10485760, "rateLimitRequests": 1000}
  }',
  '{"position": "bottom-right", "theme": "light", "primaryColor": "#3B82F6", "welcomeMessage": "Hi! How can we help you today?", "enableFileUpload": true, "enableEmojis": true, "showAgentTyping": true, "autoOpen": false}',
  '{"email": {"newConversation": true, "agentAssignment": true, "escalation": true, "dailyDigest": false}, "push": {"newMessage": true, "mentions": true, "escalation": true}, "webhook": {"enabled": false, "url": "", "events": []}}',
  '{"twoFactorRequired": false, "sessionTimeout": 3600, "ipWhitelist": [], "allowedDomains": [], "passwordPolicy": {"minLength": 8, "requireUppercase": true, "requireLowercase": true, "requireNumbers": true, "requireSpecialChars": true, "maxAge": 90}}'
FROM organizations 
WHERE id NOT IN (SELECT organization_id FROM organization_settings)
ON CONFLICT (organization_id) DO NOTHING;
