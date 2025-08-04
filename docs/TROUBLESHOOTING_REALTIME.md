# Campfire v2 Real-time Troubleshooting Guide

## Overview
This guide provides comprehensive troubleshooting steps for common real-time communication issues in Campfire v2, based on actual problems encountered and their solutions.

## Table of Contents
1. [Binding Mismatch Errors](#binding-mismatch-errors)
2. [Widget Authentication Failures](#widget-authentication-failures)
3. [Broadcast Event Issues](#broadcast-event-issues)
4. [Channel Connection Problems](#channel-connection-problems)
5. [Performance Issues](#performance-issues)
6. [Database Permission Errors](#database-permission-errors)

## Binding Mismatch Errors

### Problem: "mismatch between server and client bindings"
**Symptoms**:
- Error in server logs: `mismatch between server and client bindings`
- Real-time subscriptions failing
- postgres_changes events not working

**Root Cause**: Complex data types in Supabase Realtime v1 publications
- JSONB columns: `assignment_metadata`, `customer`, `metadata`, `ai_metadata`, `attachments`
- ARRAY columns: `tags`
- INET columns: `customer_ip`
- USER-DEFINED enums: `priority`, `status`

**Solution**: Implement scalar-only publication
```sql
-- Remove existing publication
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create scalar-only publication
CREATE PUBLICATION supabase_realtime FOR TABLE 
  conversations (id, organization_id, customer_name, customer_email, created_at, updated_at),
  messages (id, conversation_id, organization_id, content, sender_type, sender_name, sender_email, created_at),
  realtime_conversations;
```

**Channel Configuration**: Use broadcast-only channels
```typescript
const channel = client.channel(`bcast:${channelName}`, {
  config: {
    broadcast: { ack: false },
    presence: { ack: false },
    postgres_changes: [] // <-- CRITICAL: disable automatic CDC
  }
});
```

**Verification**: Check server logs for zero mismatch errors
```bash
# Search server logs
grep -i "mismatch" server.log
# Should return no results after fix
```

## Widget Authentication Failures

### Problem: 500 Internal Server Error on `/api/widget/auth`
**Symptoms**:
- `POST /api/widget/auth` returns 500 error
- "Failed to create conversation" in widget
- "permission denied for table realtime_conversations" in server logs

**Root Cause**: Database permission issues with trigger functions
1. Widget auth inserts into `conversations` table
2. `sync_realtime_conversations_trigger` fires on INSERT
3. Trigger function tries to INSERT into `realtime_conversations` table
4. Function lacks proper privileges (not SECURITY DEFINER)
5. RLS policies block INSERT operation

**Solution Steps**:

**1. Add Missing RLS Policies**:
```sql
-- Enable INSERT operations
CREATE POLICY "realtime_conv_insert" 
ON realtime_conversations FOR INSERT 
TO authenticated, anon WITH CHECK (true);

-- Enable UPDATE operations  
CREATE POLICY "realtime_conv_update" 
ON realtime_conversations FOR UPDATE 
TO authenticated, anon USING (true) WITH CHECK (true);
```

**2. Fix Trigger Function Security Context**:
```sql
-- Enable elevated privileges for trigger function
ALTER FUNCTION sync_realtime_conversations() SECURITY DEFINER;
```

**3. Verify Permissions**:
```sql
-- Check RLS policies
SELECT policyname, cmd, roles FROM pg_policies 
WHERE tablename = 'realtime_conversations' AND schemaname = 'public';

-- Check function security context
SELECT proname, prosecdef FROM pg_proc 
WHERE proname = 'sync_realtime_conversations';
-- prosecdef should be 'true'
```

**Verification**: Test widget authentication
```bash
curl -X POST http://localhost:3001/api/widget/auth \
  -H "Content-Type: application/json" \
  -H "x-organization-id: YOUR_ORG_ID" \
  -d '{"visitorId": "test-123", "customerEmail": "test@example.com"}'

# Should return 200 with conversationId
```

## Broadcast Event Issues

### Problem: Broadcast events not being received
**Symptoms**:
- Messages sent but not appearing in real-time
- No broadcast success messages in server logs
- Channel subscriptions not triggering

**Diagnostic Steps**:

**1. Check Server Logs for Broadcast Success**:
```bash
grep "Broadcast successful" server.log
# Should see: [Realtime] ✅ Broadcast successful: org:{orgId}:conv:{convId} -> message:created
```

**2. Verify Channel Configuration**:
```typescript
// Correct configuration
const channel = client.channel(`bcast:org:${orgId}:conv:${convId}`, {
  config: {
    broadcast: { ack: false },
    presence: { ack: false },
    postgres_changes: [] // Must be empty array
  }
});
```

**3. Check Event Listeners**:
```typescript
// Correct event listener setup
channel.on('broadcast', { event: 'message:created' }, (payload) => {
  console.log('Message received:', payload);
});
```

**Common Issues**:
- **Wrong channel name**: Must follow `org:{orgId}:conv:{convId}` pattern
- **Missing bcast: prefix**: All channels need broadcast-only configuration
- **postgres_changes enabled**: Must be disabled to prevent conflicts
- **Event name mismatch**: Use exact event names from UNIFIED_EVENTS

## Channel Connection Problems

### Problem: Channels not connecting or disconnecting frequently
**Symptoms**:
- Channel status shows 'closed' or 'errored'
- Frequent reconnection attempts
- Heartbeat timeouts

**Solution Steps**:

**1. Check Channel Status**:
```typescript
console.log('Channel status:', channel.state);
// Should be 'joined' for active channels
```

**2. Implement Proper Error Handling**:
```typescript
channel
  .on('system', {}, (payload) => {
    console.log('System event:', payload);
  })
  .on('error', (error) => {
    console.error('Channel error:', error);
  })
  .on('close', () => {
    console.log('Channel closed');
  });
```

**3. Configure Heartbeat and Reconnection**:
```typescript
const channel = client.channel(channelName, {
  config: {
    heartbeatIntervalMs: 25000, // Reduced from 30s
    rejoinAfterMs: (tries: number) => Math.min(1000 * Math.pow(2, tries), 10000)
  }
});
```

**4. Proper Cleanup**:
```typescript
// In component unmount or cleanup
useEffect(() => {
  return () => {
    if (channel) {
      channel.unsubscribe();
    }
  };
}, []);
```

## Performance Issues

### Problem: Slow message delivery or high latency
**Symptoms**:
- Messages taking >1 second to appear
- High API response times
- Broadcast events delayed

**Diagnostic Steps**:

**1. Measure API Latency**:
```bash
time curl -X POST http://localhost:3001/api/widget/messages \
  -H "Content-Type: application/json" \
  -H "x-organization-id: YOUR_ORG_ID" \
  -d '{"conversationId": "CONV_ID", "content": "test", "senderType": "visitor"}'
```

**2. Check Broadcast Event Timing**:
```bash
# Look for broadcast timing in server logs
grep "Broadcast result" server.log
# Should show quick response times
```

**Optimization Strategies**:

**1. Minimize Broadcast Channels**:
```typescript
// Only broadcast to necessary channels
const channels = [
  `org:${orgId}:conv:${convId}`,     // Conversation-specific
  `org:${orgId}`,                    // Organization-wide
  `org:${orgId}:conversations`       // Conversations list
];
```

**2. Use Efficient Event Payloads**:
```typescript
// Include only necessary data
const payload = {
  message: {
    id: message.id,
    content: message.content,
    sender_type: message.sender_type,
    created_at: message.created_at
  },
  conversationId,
  organizationId
};
```

**3. Implement Connection Pooling**:
```typescript
// Reuse Supabase client instances
const client = createClient(url, key, {
  realtime: {
    params: {
      eventsPerSecond: 10 // Throttle events
    }
  }
});
```

## Database Permission Errors

### Problem: Various permission denied errors
**Symptoms**:
- "permission denied for table X"
- RLS policy violations
- Function execution failures

**Common Permission Issues**:

**1. Missing Table Permissions**:
```sql
-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE ON realtime_conversations TO authenticated, anon, service_role;
```

**2. RLS Policy Issues**:
```sql
-- Check existing policies
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('conversations', 'messages', 'realtime_conversations');

-- Add missing policies
CREATE POLICY "conversations_select_org" ON conversations FOR SELECT 
TO authenticated, anon USING (organization_id = current_setting('app.current_organization_id', true));
```

**3. Function Security Context**:
```sql
-- Check function security
SELECT proname, prosecdef FROM pg_proc 
WHERE proname IN ('sync_realtime_conversations', 'update_updated_at_column');

-- Fix security context
ALTER FUNCTION sync_realtime_conversations() SECURITY DEFINER;
```

## Quick Diagnostic Checklist

### ✅ System Health Check
```bash
# 1. Check for binding mismatch errors
grep -i "mismatch" server.log

# 2. Verify widget authentication
curl -X POST http://localhost:3001/api/widget/auth -H "Content-Type: application/json" -H "x-organization-id: YOUR_ORG_ID" -d '{"visitorId": "test", "customerEmail": "test@example.com"}'

# 3. Test message sending
curl -X POST http://localhost:3001/api/widget/messages -H "Content-Type: application/json" -H "x-organization-id: YOUR_ORG_ID" -d '{"conversationId": "CONV_ID", "content": "test", "senderType": "visitor"}'

# 4. Check broadcast success
grep "Broadcast successful" server.log

# 5. Verify database permissions
psql -c "SELECT policyname FROM pg_policies WHERE tablename = 'realtime_conversations';"
```

### ✅ Expected Results
- Zero mismatch errors in logs
- Widget auth returns 200 with conversationId
- Message API returns success: true
- Broadcast successful messages in logs
- RLS policies exist for all tables

## Emergency Recovery

### If Real-time System Completely Fails
1. **Reset Publication**: Drop and recreate with scalar-only types
2. **Reset Channels**: Restart server to clear channel state
3. **Reset Database**: Run permission and policy scripts
4. **Reset Client**: Clear browser cache and reconnect
5. **Verify Step-by-Step**: Use diagnostic checklist above

### Contact Information
For persistent issues not covered in this guide:
- Check server logs for specific error messages
- Verify database schema matches requirements
- Test with minimal reproduction case
- Document exact steps to reproduce issue

## Conclusion

This troubleshooting guide covers the most common real-time communication issues in Campfire v2. The solutions provided have been tested and verified to resolve the specific problems encountered during development and testing.
