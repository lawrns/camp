-- Dashboard Statistics Functions
-- Adds RPC functions for calculating dashboard metrics

-- Function to calculate average response time
CREATE OR REPLACE FUNCTION calculate_avg_response_time(org_id text, days_back integer DEFAULT 30)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    avg_time numeric;
BEGIN
    -- Calculate average time between visitor message and first operator/ai response
    SELECT AVG(
        EXTRACT(EPOCH FROM (
            operator_msg.created_at - visitor_msg.created_at
        )) / 60.0 -- Convert to minutes
    ) INTO avg_time
    FROM messages visitor_msg
    JOIN LATERAL (
        SELECT created_at
        FROM messages
        WHERE conversation_id = visitor_msg.conversation_id
        AND organization_id = visitor_msg.organization_id
        AND sender_type IN ('operator', 'ai')
        AND created_at > visitor_msg.created_at
        ORDER BY created_at ASC
        LIMIT 1
    ) operator_msg ON true
    WHERE visitor_msg.organization_id = org_id
    AND visitor_msg.sender_type = 'visitor'
    AND visitor_msg.created_at >= NOW() - INTERVAL '1 day' * days_back;

    RETURN COALESCE(avg_time, 0);
END;
$$;

-- Function to get recent activity events
CREATE OR REPLACE FUNCTION get_recent_activity(org_id text, limit_count integer DEFAULT 10)
RETURNS TABLE (
    id bigint,
    type text,
    title text,
    description text,
    time_ago text,
    status text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ae.id,
        ae.event_type as type,
        ae.title,
        ae.description,
        CASE 
            WHEN ae.created_at >= NOW() - INTERVAL '1 minute' THEN 'Just now'
            WHEN ae.created_at >= NOW() - INTERVAL '1 hour' THEN 
                EXTRACT(MINUTES FROM NOW() - ae.created_at)::text || ' minutes ago'
            WHEN ae.created_at >= NOW() - INTERVAL '1 day' THEN 
                EXTRACT(HOURS FROM NOW() - ae.created_at)::text || ' hours ago'
            ELSE 
                EXTRACT(DAYS FROM NOW() - ae.created_at)::text || ' days ago'
        END as time_ago,
        CASE ae.event_type
            WHEN 'conversation_started' THEN 'active'
            WHEN 'agent_joined' THEN 'success'
            WHEN 'escalation' THEN 'warning'
            WHEN 'resolution' THEN 'success'
            ELSE 'info'
        END as status,
        ae.created_at
    FROM activity_events ae
    WHERE ae.organization_id = org_id
    ORDER BY ae.created_at DESC
    LIMIT limit_count;
END;
$$;

-- Function to get conversation volume trends
CREATE OR REPLACE FUNCTION get_conversation_trends(org_id text, days_back integer DEFAULT 7)
RETURNS TABLE (
    date date,
    conversation_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(c.created_at) as date,
        COUNT(c.id) as conversation_count
    FROM conversations c
    WHERE c.organization_id = org_id
    AND c.created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY DATE(c.created_at)
    ORDER BY date DESC;
END;
$$;

-- Function to get hourly response time trends
CREATE OR REPLACE FUNCTION get_response_time_trends(org_id text, days_back integer DEFAULT 7)
RETURNS TABLE (
    hour_of_day integer,
    avg_response_time_minutes numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(HOUR FROM visitor_msg.created_at)::integer as hour_of_day,
        AVG(
            EXTRACT(EPOCH FROM (
                operator_msg.created_at - visitor_msg.created_at
            )) / 60.0
        ) as avg_response_time_minutes
    FROM messages visitor_msg
    JOIN LATERAL (
        SELECT created_at
        FROM messages
        WHERE conversation_id = visitor_msg.conversation_id
        AND organization_id = visitor_msg.organization_id
        AND sender_type IN ('operator', 'ai')
        AND created_at > visitor_msg.created_at
        ORDER BY created_at ASC
        LIMIT 1
    ) operator_msg ON true
    WHERE visitor_msg.organization_id = org_id
    AND visitor_msg.sender_type = 'visitor'
    AND visitor_msg.created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY EXTRACT(HOUR FROM visitor_msg.created_at)
    ORDER BY hour_of_day;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_avg_response_time(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activity(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_trends(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_response_time_trends(text, integer) TO authenticated;