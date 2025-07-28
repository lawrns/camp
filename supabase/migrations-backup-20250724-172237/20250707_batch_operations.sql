-- Batch Operations for Improved Performance
-- This migration adds functions for batch operations to reduce database round trips

-- ============================================
-- 1. BATCH MESSAGE OPERATIONS
-- ============================================

-- Function to batch insert messages (for importing conversation history)
CREATE OR REPLACE FUNCTION batch_insert_messages(
  p_messages JSONB[]
)
RETURNS TABLE (
  message_id UUID,
  success BOOLEAN,
  error TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_message JSONB;
  v_message_id UUID;
BEGIN
  FOR v_message IN SELECT unnest(p_messages)
  LOOP
    BEGIN
      INSERT INTO public.messages (
        organization_id,
        conversation_id,
        content,
        sender_type,
        sender_id,
        sender_name,
        sender_avatar,
        attachments,
        metadata,
        is_internal_note
      ) VALUES (
        (v_message->>'organization_id')::UUID,
        (v_message->>'conversation_id')::UUID,
        v_message->>'content',
        v_message->>'sender_type',
        (v_message->>'sender_id')::UUID,
        v_message->>'sender_name',
        v_message->>'sender_avatar',
        COALESCE((v_message->'attachments')::JSONB, '[]'::JSONB),
        COALESCE((v_message->'metadata')::JSONB, '{}'::JSONB),
        COALESCE((v_message->>'is_internal_note')::BOOLEAN, FALSE)
      )
      RETURNING id INTO v_message_id;
      
      RETURN QUERY SELECT v_message_id, TRUE, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT NULL::UUID, FALSE, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- Function to batch update conversation status
CREATE OR REPLACE FUNCTION batch_update_conversation_status(
  p_conversation_ids UUID[],
  p_status VARCHAR,
  p_user_id UUID,
  p_resolution_note TEXT DEFAULT NULL
)
RETURNS TABLE (
  conversation_id UUID,
  old_status VARCHAR,
  new_status VARCHAR,
  updated BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.conversations c
  SET 
    status = p_status,
    updated_at = NOW(),
    resolved_at = CASE 
      WHEN p_status = 'resolved' THEN NOW() 
      ELSE resolved_at 
    END,
    resolved_by = CASE 
      WHEN p_status = 'resolved' THEN p_user_id 
      ELSE resolved_by 
    END,
    resolution_note = CASE 
      WHEN p_status = 'resolved' AND p_resolution_note IS NOT NULL THEN p_resolution_note 
      ELSE resolution_note 
    END
  WHERE c.id = ANY(p_conversation_ids)
  RETURNING 
    c.id AS conversation_id,
    c.status AS old_status,
    p_status AS new_status,
    TRUE AS updated;
END;
$$;

-- Function to batch assign conversations
CREATE OR REPLACE FUNCTION batch_assign_conversations(
  p_assignments JSONB[]
)
RETURNS TABLE (
  conversation_id UUID,
  assigned_to UUID,
  assignment_note TEXT,
  success BOOLEAN,
  error TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_assignment JSONB;
BEGIN
  FOR v_assignment IN SELECT unnest(p_assignments)
  LOOP
    BEGIN
      UPDATE public.conversations
      SET 
        assigned_to = (v_assignment->>'assigned_to')::UUID,
        assignment_note = v_assignment->>'assignment_note',
        assigned_at = NOW(),
        updated_at = NOW()
      WHERE id = (v_assignment->>'conversation_id')::UUID;
      
      -- Log assignment activity
      INSERT INTO public.activity_events (
        organization_id,
        type,
        action,
        description,
        user_id,
        metadata
      )
      SELECT 
        organization_id,
        'conversation',
        'assigned',
        'Conversation assigned to ' || COALESCE(
          (SELECT full_name FROM profiles WHERE id = (v_assignment->>'assigned_to')::UUID),
          'agent'
        ),
        (v_assignment->>'assigned_by')::UUID,
        jsonb_build_object(
          'conversation_id', (v_assignment->>'conversation_id')::UUID,
          'assigned_to', (v_assignment->>'assigned_to')::UUID,
          'assignment_note', v_assignment->>'assignment_note'
        )
      FROM public.conversations
      WHERE id = (v_assignment->>'conversation_id')::UUID;
      
      RETURN QUERY SELECT 
        (v_assignment->>'conversation_id')::UUID,
        (v_assignment->>'assigned_to')::UUID,
        v_assignment->>'assignment_note',
        TRUE,
        NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 
        (v_assignment->>'conversation_id')::UUID,
        NULL::UUID,
        NULL::TEXT,
        FALSE,
        SQLERRM;
    END;
  END LOOP;
END;
$$;

-- ============================================
-- 2. BATCH TAG OPERATIONS
-- ============================================

-- Function to batch add tags to conversations
CREATE OR REPLACE FUNCTION batch_add_tags(
  p_conversation_ids UUID[],
  p_tags TEXT[]
)
RETURNS TABLE (
  conversation_id UUID,
  tags_added TEXT[],
  total_tags TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.conversations c
  SET 
    tags = array_cat(
      COALESCE(tags, ARRAY[]::TEXT[]), 
      p_tags
    ),
    updated_at = NOW()
  WHERE c.id = ANY(p_conversation_ids)
  RETURNING 
    c.id AS conversation_id,
    p_tags AS tags_added,
    c.tags AS total_tags;
END;
$$;

-- Function to batch remove tags from conversations
CREATE OR REPLACE FUNCTION batch_remove_tags(
  p_conversation_ids UUID[],
  p_tags TEXT[]
)
RETURNS TABLE (
  conversation_id UUID,
  tags_removed TEXT[],
  remaining_tags TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.conversations c
  SET 
    tags = array_remove_all(COALESCE(tags, ARRAY[]::TEXT[]), p_tags),
    updated_at = NOW()
  WHERE c.id = ANY(p_conversation_ids)
  RETURNING 
    c.id AS conversation_id,
    p_tags AS tags_removed,
    c.tags AS remaining_tags;
END;
$$;

-- Helper function to remove all occurrences of elements from array
CREATE OR REPLACE FUNCTION array_remove_all(arr TEXT[], elements TEXT[])
RETURNS TEXT[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY(
    SELECT DISTINCT unnest(arr)
    EXCEPT
    SELECT unnest(elements)
  );
$$;

-- ============================================
-- 3. BATCH NOTIFICATION OPERATIONS
-- ============================================

-- Function to batch create notifications for multiple users
CREATE OR REPLACE FUNCTION batch_create_notifications(
  p_notifications JSONB[]
)
RETURNS TABLE (
  notification_id UUID,
  user_id UUID,
  created BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_notification JSONB;
  v_notification_id UUID;
BEGIN
  FOR v_notification IN SELECT unnest(p_notifications)
  LOOP
    BEGIN
      INSERT INTO public.notifications (
        user_id,
        organization_id,
        type,
        title,
        message,
        data,
        action_url
      ) VALUES (
        (v_notification->>'user_id')::UUID,
        (v_notification->>'organization_id')::UUID,
        v_notification->>'type',
        v_notification->>'title',
        v_notification->>'message',
        COALESCE((v_notification->'data')::JSONB, '{}'::JSONB),
        v_notification->>'action_url'
      )
      RETURNING id INTO v_notification_id;
      
      RETURN QUERY SELECT 
        v_notification_id,
        (v_notification->>'user_id')::UUID,
        TRUE;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 
        NULL::UUID,
        (v_notification->>'user_id')::UUID,
        FALSE;
    END;
  END LOOP;
END;
$$;

-- Function to batch mark notifications as read
CREATE OR REPLACE FUNCTION batch_mark_notifications_read(
  p_notification_ids UUID[],
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET 
    is_read = TRUE,
    read_at = NOW()
  WHERE id = ANY(p_notification_ids)
    AND user_id = p_user_id
    AND is_read = FALSE;
    
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;

-- ============================================
-- 4. BATCH ANALYTICS OPERATIONS
-- ============================================

-- Function to batch log analytics events
CREATE OR REPLACE FUNCTION batch_log_analytics_events(
  p_events JSONB[]
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_inserted_count INTEGER := 0;
  v_event JSONB;
BEGIN
  FOR v_event IN SELECT unnest(p_events)
  LOOP
    BEGIN
      INSERT INTO public.analytics_events (
        organization_id,
        event_type,
        event_name,
        user_id,
        session_id,
        properties,
        timestamp
      ) VALUES (
        (v_event->>'organization_id')::UUID,
        v_event->>'event_type',
        v_event->>'event_name',
        (v_event->>'user_id')::UUID,
        v_event->>'session_id',
        COALESCE((v_event->'properties')::JSONB, '{}'::JSONB),
        COALESCE((v_event->>'timestamp')::TIMESTAMPTZ, NOW())
      );
      
      v_inserted_count := v_inserted_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing other events
      RAISE WARNING 'Failed to insert analytics event: %', SQLERRM;
    END;
  END LOOP;
  
  RETURN v_inserted_count;
END;
$$;

-- ============================================
-- 5. BATCH SEARCH OPERATIONS
-- ============================================

-- Function to batch search conversations by multiple criteria
CREATE OR REPLACE FUNCTION batch_search_conversations(
  p_organization_id UUID,
  p_search_queries JSONB[]
)
RETURNS TABLE (
  query_id INTEGER,
  conversation_id UUID,
  relevance_score FLOAT,
  matched_fields TEXT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_query JSONB;
  v_query_index INTEGER := 0;
BEGIN
  FOR v_query IN SELECT unnest(p_search_queries)
  LOOP
    v_query_index := v_query_index + 1;
    
    RETURN QUERY
    SELECT 
      v_query_index AS query_id,
      c.id AS conversation_id,
      -- Calculate relevance score based on matches
      (
        CASE WHEN c.customer_email ILIKE '%' || (v_query->>'email') || '%' THEN 1.0 ELSE 0.0 END +
        CASE WHEN c.customer_name ILIKE '%' || (v_query->>'name') || '%' THEN 0.8 ELSE 0.0 END +
        CASE WHEN (v_query->>'tags') IS NOT NULL AND c.tags && string_to_array(v_query->>'tags', ',') THEN 0.6 ELSE 0.0 END +
        CASE WHEN (v_query->>'status') IS NOT NULL AND c.status = (v_query->>'status') THEN 0.4 ELSE 0.0 END
      ) AS relevance_score,
      -- List matched fields
      ARRAY_REMOVE(ARRAY[
        CASE WHEN c.customer_email ILIKE '%' || (v_query->>'email') || '%' THEN 'email' END,
        CASE WHEN c.customer_name ILIKE '%' || (v_query->>'name') || '%' THEN 'name' END,
        CASE WHEN (v_query->>'tags') IS NOT NULL AND c.tags && string_to_array(v_query->>'tags', ',') THEN 'tags' END,
        CASE WHEN (v_query->>'status') IS NOT NULL AND c.status = (v_query->>'status') THEN 'status' END
      ], NULL) AS matched_fields
    FROM public.conversations c
    WHERE c.organization_id = p_organization_id
      AND (
        (v_query->>'email') IS NULL OR c.customer_email ILIKE '%' || (v_query->>'email') || '%' OR
        (v_query->>'name') IS NULL OR c.customer_name ILIKE '%' || (v_query->>'name') || '%' OR
        (v_query->>'tags') IS NULL OR c.tags && string_to_array(v_query->>'tags', ',') OR
        (v_query->>'status') IS NULL OR c.status = (v_query->>'status')
      );
  END LOOP;
END;
$$;

-- ============================================
-- 6. GRANTS
-- ============================================

-- Grant permissions on batch functions
GRANT EXECUTE ON FUNCTION batch_insert_messages TO authenticated;
GRANT EXECUTE ON FUNCTION batch_update_conversation_status TO authenticated;
GRANT EXECUTE ON FUNCTION batch_assign_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION batch_add_tags TO authenticated;
GRANT EXECUTE ON FUNCTION batch_remove_tags TO authenticated;
GRANT EXECUTE ON FUNCTION batch_create_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION batch_mark_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION batch_log_analytics_events TO authenticated;
GRANT EXECUTE ON FUNCTION batch_search_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION array_remove_all TO authenticated;