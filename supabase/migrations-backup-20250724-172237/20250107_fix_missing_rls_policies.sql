-- Comprehensive RLS Policy Fix for Missing Tables
-- This migration adds RLS policies to tables that don't have them

-- Check and fix agent_threads table
DO $$
BEGIN
  -- Enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'agent_threads' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.agent_threads ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Add policies if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_threads' AND policyname = 'Users access agent threads in their organization') THEN
    CREATE POLICY "Users access agent threads in their organization"
      ON public.agent_threads
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id 
          FROM public.profiles 
          WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Check and fix agent_messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'agent_messages' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_messages' AND policyname = 'Users access agent messages in their organization') THEN
    CREATE POLICY "Users access agent messages in their organization"
      ON public.agent_messages
      FOR ALL
      USING (
        thread_id IN (
          SELECT id FROM public.agent_threads 
          WHERE organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Check and fix agent_notifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'agent_notifications' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.agent_notifications ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_notifications' AND policyname = 'Users access their own notifications') THEN
    CREATE POLICY "Users access their own notifications"
      ON public.agent_notifications
      FOR ALL
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Check and fix message_queue table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'message_queue' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_queue' AND policyname = 'Users access message queue in their organization') THEN
    CREATE POLICY "Users access message queue in their organization"
      ON public.message_queue
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id 
          FROM public.profiles 
          WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Check and fix message_delivery_status table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'message_delivery_status' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.message_delivery_status ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_delivery_status' AND policyname = 'Users access delivery status in their organization') THEN
    CREATE POLICY "Users access delivery status in their organization"
      ON public.message_delivery_status
      FOR ALL
      USING (
        message_id IN (
          SELECT id FROM public.messages 
          WHERE organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Check and fix user_presence table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'user_presence' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_presence' AND policyname = 'Users access presence in their organization') THEN
    CREATE POLICY "Users access presence in their organization"
      ON public.user_presence
      FOR ALL
      USING (
        user_id IN (
          SELECT id FROM public.profiles 
          WHERE organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Check and fix widget_file_attachments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'widget_file_attachments' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.widget_file_attachments ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'widget_file_attachments' AND policyname = 'Users access file attachments in their organization') THEN
    CREATE POLICY "Users access file attachments in their organization"
      ON public.widget_file_attachments
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id 
          FROM public.profiles 
          WHERE id = auth.uid()
        )
      );
  END IF;

  -- Allow anonymous access for widget file downloads
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'widget_file_attachments' AND policyname = 'Anonymous can download public files') THEN
    CREATE POLICY "Anonymous can download public files"
      ON public.widget_file_attachments
      FOR SELECT
      TO anon
      USING (is_public = true);
  END IF;
END $$;

-- Add service role policies for all tables
DO $$
DECLARE
    table_name TEXT;
    table_names TEXT[] := ARRAY[
        'agent_threads', 'agent_messages', 'agent_notifications', 
        'message_queue', 'message_delivery_status', 'user_presence', 
        'widget_file_attachments'
    ];
BEGIN
    FOREACH table_name IN ARRAY table_names LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = table_name 
            AND policyname = 'Service role has full access'
        ) THEN
            EXECUTE format('CREATE POLICY "Service role has full access" ON public.%I FOR ALL TO service_role USING (true)', table_name);
        END IF;
    END LOOP;
END $$;