-- Migration: Align mailboxes table with Drizzle schema expectations
-- This adds missing columns that the code expects but don't exist in the current database

-- Add missing columns to mailboxes table
ALTER TABLE mailboxes 
ADD COLUMN IF NOT EXISTS slack_escalation_channel TEXT,
ADD COLUMN IF NOT EXISTS slack_bot_token TEXT,
ADD COLUMN IF NOT EXISTS slack_bot_user_id TEXT,
ADD COLUMN IF NOT EXISTS slack_team_id TEXT,
ADD COLUMN IF NOT EXISTS github_installation_id TEXT,
ADD COLUMN IF NOT EXISTS github_repo_owner TEXT,
ADD COLUMN IF NOT EXISTS github_repo_name TEXT,
ADD COLUMN IF NOT EXISTS prompt_updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS widget_display_mode TEXT DEFAULT 'always',
ADD COLUMN IF NOT EXISTS widget_display_min_value BIGINT,
ADD COLUMN IF NOT EXISTS auto_respond_email_to_chat BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS widget_host TEXT,
ADD COLUMN IF NOT EXISTS vip_threshold BIGINT,
ADD COLUMN IF NOT EXISTS vip_channel_id TEXT,
ADD COLUMN IF NOT EXISTS vip_expected_response_hours INTEGER,
ADD COLUMN IF NOT EXISTS is_whitelabel BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_metadata JSONB DEFAULT '{"completed": false}',
ADD COLUMN IF NOT EXISTS auto_close_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_close_days_of_inactivity INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS disable_auto_response_for_vips BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS response_generator_prompt TEXT,
ADD COLUMN IF NOT EXISTS escalation_email_body TEXT,
ADD COLUMN IF NOT EXISTS escalation_expected_resolution_hours INTEGER,
ADD COLUMN IF NOT EXISTS rag_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS prompt_prefix TEXT DEFAULT 'You are a helpful assistant.',
ADD COLUMN IF NOT EXISTS prompt_suffix TEXT DEFAULT 'Be concise and helpful.',
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"confetti": false}';

-- Update existing records to have proper defaults
UPDATE mailboxes 
SET 
  prompt_updated_at = COALESCE(prompt_updated_at, updated_at, NOW()),
  widget_display_mode = COALESCE(widget_display_mode, 'always'),
  auto_respond_email_to_chat = COALESCE(auto_respond_email_to_chat, false),
  is_whitelabel = COALESCE(is_whitelabel, false),
  onboarding_metadata = COALESCE(onboarding_metadata, '{"completed": false}'),
  auto_close_enabled = COALESCE(auto_close_enabled, false),
  auto_close_days_of_inactivity = COALESCE(auto_close_days_of_inactivity, 7),
  disable_auto_response_for_vips = COALESCE(disable_auto_response_for_vips, false),
  rag_enabled = COALESCE(rag_enabled, true),
  prompt_prefix = COALESCE(prompt_prefix, 'You are a helpful assistant.'),
  prompt_suffix = COALESCE(prompt_suffix, 'Be concise and helpful.'),
  preferences = COALESCE(preferences, '{"confetti": false}')
WHERE 
  prompt_updated_at IS NULL 
  OR widget_display_mode IS NULL 
  OR auto_respond_email_to_chat IS NULL
  OR is_whitelabel IS NULL
  OR onboarding_metadata IS NULL
  OR auto_close_enabled IS NULL
  OR auto_close_days_of_inactivity IS NULL
  OR disable_auto_response_for_vips IS NULL
  OR rag_enabled IS NULL
  OR prompt_prefix IS NULL
  OR prompt_suffix IS NULL
  OR preferences IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mailboxes_rag_enabled ON mailboxes(rag_enabled);
CREATE INDEX IF NOT EXISTS idx_mailboxes_widget_display_mode ON mailboxes(widget_display_mode);
CREATE INDEX IF NOT EXISTS idx_mailboxes_auto_close_enabled ON mailboxes(auto_close_enabled);

-- Add constraints
ALTER TABLE mailboxes 
ADD CONSTRAINT chk_widget_display_mode 
CHECK (widget_display_mode IN ('always', 'revenue_based', 'off'));

-- Record this migration
INSERT INTO schema_migrations (version, description) VALUES 
('004_align_mailboxes_schema', 'Align mailboxes table with Drizzle schema expectations')
ON CONFLICT (version) DO NOTHING;

-- Verify the migration
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as total_mailboxes,
  COUNT(CASE WHEN rag_enabled = true THEN 1 END) as rag_enabled_count,
  COUNT(CASE WHEN prompt_prefix IS NOT NULL THEN 1 END) as with_prompt_prefix
FROM mailboxes;
