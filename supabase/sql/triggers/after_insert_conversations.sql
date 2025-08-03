-- =====================================================
-- CONVERSATION BROADCAST TRIGGER
-- =====================================================
-- This trigger broadcasts conversation changes via realtime.broadcast()
-- to bypass the PostgreSQL binding mismatch in Realtime v1

-- Function to broadcast conversation changes
CREATE OR REPLACE FUNCTION broadcast_conversation_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast conversation insert/update events
  IF TG_OP = 'INSERT' THEN
    PERFORM realtime.broadcast(
      'org:' || NEW.organization_id, 
      'conv:insert', 
      json_build_object(
        'id', NEW.id,
        'organization_id', NEW.organization_id,
        'customer_name', NEW.customer_name,
        'customer_email', NEW.customer_email,
        'status', NEW.status,
        'priority', NEW.priority,
        'assigned_to_user_id', NEW.assigned_to_user_id,
        'created_at', NEW.created_at,
        'updated_at', NEW.updated_at,
        'last_message_at', NEW.last_message_at,
        'visitor_id', NEW.visitor_id,
        'channel', NEW.channel
      )
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    PERFORM realtime.broadcast(
      'org:' || NEW.organization_id, 
      'conv:update', 
      json_build_object(
        'id', NEW.id,
        'organization_id', NEW.organization_id,
        'customer_name', NEW.customer_name,
        'customer_email', NEW.customer_email,
        'status', NEW.status,
        'priority', NEW.priority,
        'assigned_to_user_id', NEW.assigned_to_user_id,
        'created_at', NEW.created_at,
        'updated_at', NEW.updated_at,
        'last_message_at', NEW.last_message_at,
        'visitor_id', NEW.visitor_id,
        'channel', NEW.channel
      )
    );
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS conversation_broadcast_trigger ON conversations;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER conversation_broadcast_trigger
  AFTER INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_conversation_changes();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION broadcast_conversation_changes() TO authenticated;
GRANT EXECUTE ON FUNCTION broadcast_conversation_changes() TO anon;
GRANT EXECUTE ON FUNCTION broadcast_conversation_changes() TO service_role;
