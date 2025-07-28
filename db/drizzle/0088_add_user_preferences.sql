-- Create user_preferences table for storing inbox preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  preferences JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, organization_id)
);

-- Add RLS policies for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own preferences
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all preferences
CREATE POLICY "Service role full access" ON user_preferences
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_org_id ON user_preferences(organization_id);
CREATE INDEX idx_user_preferences_user_org ON user_preferences(user_id, organization_id);