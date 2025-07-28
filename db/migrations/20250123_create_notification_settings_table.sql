-- Create notification_settings table for user preferences
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Channel preferences
  email BOOLEAN NOT NULL DEFAULT TRUE,
  push BOOLEAN NOT NULL DEFAULT TRUE,
  desktop BOOLEAN NOT NULL DEFAULT TRUE,
  sound BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Digest settings
  digest TEXT NOT NULL DEFAULT 'none' CHECK (digest IN ('none', 'daily', 'weekly')),
  
  -- Quiet hours
  quiet_hours JSONB DEFAULT '{"enabled": false}',
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Unique constraint for user/org combination
  UNIQUE(user_id, organization_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_organization_id ON notification_settings(organization_id);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own settings" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON notification_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_notification_settings_updated_at_trigger
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();