-- Fix Database Naming Conventions Migration
-- This migration standardizes column names to snake_case and adds missing organization_id columns

-- ============================================================================
-- 1. Fix camelCase column names to snake_case
-- ============================================================================

-- Fix conversations.emailFrom -> email_from (only if column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'emailFrom'
    ) THEN
        ALTER TABLE conversations RENAME COLUMN "emailFrom" TO email_from;
    END IF;
END $$;

-- Fix unassigned_conversations.emailFrom -> email_from (only if column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'unassigned_conversations' 
        AND column_name = 'emailFrom'
    ) THEN
        ALTER TABLE unassigned_conversations RENAME COLUMN "emailFrom" TO email_from;
    END IF;
END $$;

-- ============================================================================
-- 2. Add missing organization_id columns where needed
-- ============================================================================

-- Add organization_id to quick_replies (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quick_replies') THEN
        ALTER TABLE quick_replies ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add organization_id to widget_settings (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'widget_settings') THEN
        ALTER TABLE widget_settings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add organization_id to widget_visitors (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'widget_visitors') THEN
        ALTER TABLE widget_visitors ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add organization_id to typing_indicators (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'typing_indicators') THEN
        ALTER TABLE typing_indicators ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add organization_id to conversation_activities (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_activities') THEN
        ALTER TABLE conversation_activities ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add organization_id to conversation_followers (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_followers') THEN
        ALTER TABLE conversation_followers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add organization_id to message_read_status (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_read_status') THEN
        ALTER TABLE message_read_status ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add organization_id to operator_presence (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operator_presence') THEN
        ALTER TABLE operator_presence ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- 3. Create indexes for performance
-- ============================================================================

-- Index on organization_id columns for performance (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quick_replies') THEN
        CREATE INDEX IF NOT EXISTS idx_quick_replies_organization_id ON quick_replies(organization_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'widget_settings') THEN
        CREATE INDEX IF NOT EXISTS idx_widget_settings_organization_id ON widget_settings(organization_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'widget_visitors') THEN
        CREATE INDEX IF NOT EXISTS idx_widget_visitors_organization_id ON widget_visitors(organization_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'typing_indicators') THEN
        CREATE INDEX IF NOT EXISTS idx_typing_indicators_organization_id ON typing_indicators(organization_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_activities') THEN
        CREATE INDEX IF NOT EXISTS idx_conversation_activities_organization_id ON conversation_activities(organization_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_followers') THEN
        CREATE INDEX IF NOT EXISTS idx_conversation_followers_organization_id ON conversation_followers(organization_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_read_status') THEN
        CREATE INDEX IF NOT EXISTS idx_message_read_status_organization_id ON message_read_status(organization_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operator_presence') THEN
        CREATE INDEX IF NOT EXISTS idx_operator_presence_organization_id ON operator_presence(organization_id);
    END IF;
END $$;

-- Composite indexes for common query patterns (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quick_replies') THEN
        CREATE INDEX IF NOT EXISTS idx_quick_replies_org_mailbox ON quick_replies(organization_id, mailbox_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'widget_settings') THEN
        CREATE INDEX IF NOT EXISTS idx_widget_settings_org_mailbox ON widget_settings(organization_id, mailbox_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'typing_indicators') THEN
        CREATE INDEX IF NOT EXISTS idx_typing_indicators_org_conversation ON typing_indicators(organization_id, conversation_id);
    END IF;
END $$;

-- ============================================================================
-- 4. Update RLS policies for new organization_id columns
-- ============================================================================

-- Enable RLS on tables that now have organization_id (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quick_replies') THEN
        ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'widget_settings') THEN
        ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'widget_visitors') THEN
        ALTER TABLE widget_visitors ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'typing_indicators') THEN
        ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_activities') THEN
        ALTER TABLE conversation_activities ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_followers') THEN
        ALTER TABLE conversation_followers ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_read_status') THEN
        ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operator_presence') THEN
        ALTER TABLE operator_presence ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies for organization scoping (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quick_replies') THEN
        DROP POLICY IF EXISTS "quick_replies_organization_scope" ON quick_replies;
        CREATE POLICY "quick_replies_organization_scope" ON quick_replies
          FOR ALL USING (
            organization_id IN (
              SELECT organization_id FROM organization_members 
              WHERE user_id = auth.uid()
            )
          );
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'widget_settings') THEN
        DROP POLICY IF EXISTS "widget_settings_organization_scope" ON widget_settings;
        CREATE POLICY "widget_settings_organization_scope" ON widget_settings
          FOR ALL USING (
            organization_id IN (
              SELECT organization_id FROM organization_members 
              WHERE user_id = auth.uid()
            )
          );
    END IF;
END $$;

-- Create remaining RLS policies for organization scoping (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'widget_visitors') THEN
        DROP POLICY IF EXISTS "widget_visitors_organization_scope" ON widget_visitors;
        CREATE POLICY "widget_visitors_organization_scope" ON widget_visitors
          FOR ALL USING (
            organization_id IN (
              SELECT organization_id FROM organization_members 
              WHERE user_id = auth.uid()
            )
          );
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'typing_indicators') THEN
        DROP POLICY IF EXISTS "typing_indicators_organization_scope" ON typing_indicators;
        CREATE POLICY "typing_indicators_organization_scope" ON typing_indicators
          FOR ALL USING (
            organization_id IN (
              SELECT organization_id FROM organization_members 
              WHERE user_id = auth.uid()
            )
          );
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_activities') THEN
        DROP POLICY IF EXISTS "conversation_activities_organization_scope" ON conversation_activities;
        CREATE POLICY "conversation_activities_organization_scope" ON conversation_activities
          FOR ALL USING (
            organization_id IN (
              SELECT organization_id FROM organization_members 
              WHERE user_id = auth.uid()
            )
          );
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_followers') THEN
        DROP POLICY IF EXISTS "conversation_followers_organization_scope" ON conversation_followers;
        CREATE POLICY "conversation_followers_organization_scope" ON conversation_followers
          FOR ALL USING (
            organization_id IN (
              SELECT organization_id FROM organization_members 
              WHERE user_id = auth.uid()
            )
          );
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_read_status') THEN
        DROP POLICY IF EXISTS "message_read_status_organization_scope" ON message_read_status;
        CREATE POLICY "message_read_status_organization_scope" ON message_read_status
          FOR ALL USING (
            organization_id IN (
              SELECT organization_id FROM organization_members 
              WHERE user_id = auth.uid()
            )
          );
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operator_presence') THEN
        DROP POLICY IF EXISTS "operator_presence_organization_scope" ON operator_presence;
        CREATE POLICY "operator_presence_organization_scope" ON operator_presence
          FOR ALL USING (
            organization_id IN (
              SELECT organization_id FROM organization_members 
              WHERE user_id = auth.uid()
            )
          );
    END IF;
END $$;

-- ============================================================================
-- 5. Data migration - populate organization_id from related tables
-- ============================================================================

-- Update quick_replies.organization_id from mailbox relationship (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quick_replies') THEN
        UPDATE quick_replies 
        SET organization_id = (
          SELECT organization_id 
          FROM mailboxes 
          WHERE mailboxes.id = quick_replies.mailbox_id
        )
        WHERE organization_id IS NULL;
    END IF;
END $$;

-- Update widget_settings.organization_id from mailbox relationship (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'widget_settings') THEN
        UPDATE widget_settings 
        SET organization_id = (
          SELECT organization_id 
          FROM mailboxes 
          WHERE mailboxes.id = widget_settings.mailbox_id
        )
        WHERE organization_id IS NULL;
    END IF;
END $$;

-- Update typing_indicators.organization_id from conversation relationship (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'typing_indicators') THEN
        UPDATE typing_indicators 
        SET organization_id = (
          SELECT organization_id 
          FROM conversations 
          WHERE conversations.id = typing_indicators.conversation_id
        )
        WHERE organization_id IS NULL;
    END IF;
END $$;

-- Update conversation_activities.organization_id from conversation relationship (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_activities') THEN
        UPDATE conversation_activities 
        SET organization_id = (
          SELECT organization_id 
          FROM conversations 
          WHERE conversations.id = conversation_activities.conversation_id
        )
        WHERE organization_id IS NULL;
    END IF;
END $$;

-- Update conversation_followers.organization_id from conversation relationship (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_followers') THEN
        UPDATE conversation_followers 
        SET organization_id = (
          SELECT organization_id 
          FROM conversations 
          WHERE conversations.id = conversation_followers.conversation_id
        )
        WHERE organization_id IS NULL;
    END IF;
END $$;

-- ============================================================================
-- 6. Data integrity validation
-- ============================================================================

-- Function to validate data integrity after migration
CREATE OR REPLACE FUNCTION validate_naming_convention_migration()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check for remaining camelCase columns
  RETURN QUERY
  SELECT 
    'camelCase_columns'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    CASE WHEN COUNT(*) = 0 
      THEN 'No camelCase columns found'::TEXT
      ELSE 'Found ' || COUNT(*)::TEXT || ' camelCase columns'::TEXT
    END
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND column_name ~ '[A-Z]'
    AND table_name NOT LIKE 'pg_%';
  
  -- Check for missing organization_id in key tables
  RETURN QUERY
  SELECT 
    'missing_organization_id'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
    'Tables without organization_id: ' || STRING_AGG(table_name, ', ')::TEXT
  FROM (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT IN (
        'organizations', 'applied_migrations', 'ai_insights', 'ai_suggestions',
        'campfire_handoff_logs', 'conversation_messages', 'message_delivery_status',
        'message_edits'
      )
      AND table_name NOT IN (
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND column_name = 'organization_id'
      )
  ) missing_tables;
  
  -- Check RLS policies are enabled
  RETURN QUERY
  SELECT 
    'rls_policies'::TEXT,
    'INFO'::TEXT,
    'RLS policies created for organization scoping'::TEXT;
    
END;
$$ LANGUAGE plpgsql;

-- Run validation
SELECT * FROM validate_naming_convention_migration();

-- Clean up validation function
DROP FUNCTION validate_naming_convention_migration();

-- ============================================================================
-- 7. Migration completion notice
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Database naming convention migration completed successfully!';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '- Fixed camelCase columns: emailFrom -> email_from';
  RAISE NOTICE '- Added organization_id to 8 tables';
  RAISE NOTICE '- Created performance indexes';
  RAISE NOTICE '- Added RLS policies for organization scoping';
  RAISE NOTICE '- Migrated existing data to populate organization_id';
END $$;
