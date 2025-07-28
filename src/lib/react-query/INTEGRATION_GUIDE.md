# React Query Integration Guide for Campfire Inbox

## Overview

This guide explains how to integrate React Query (TanStack Query) into the Campfire inbox system for advanced caching and performance optimization.

## Quick Start

### 1. Import the New Dashboard Component

To use the React Query-enhanced inbox dashboard, import the V2 component:

```tsx
import { UnifiedInboxDashboardV2 } from "@/components/inbox/UnifiedInboxDashboardV2";

// Use it instead of the original UnifiedInboxDashboard
<UnifiedInboxDashboardV2 organizationId={organizationId} />;
```

### 2. Available React Query Hooks

#### Conversations

```tsx
import {
  useConversationsQuery,
  useMarkConversationRead,
  useUpdateConversation,
} from "@/lib/react-query/hooks/useConversationsQuery";

// Fetch conversations with filters
const { data, isLoading, error } = useConversationsQuery({
  status: "open",
  assignedTo: userId,
  search: "customer query",
});

// Update conversation
const updateMutation = useUpdateConversation();
updateMutation.mutate({
  conversationId,
  updates: { status: "closed" },
});

// Mark as read
const markAsRead = useMarkConversationRead();
markAsRead.mutate(conversationId);
```

#### Messages

```tsx
import { useMessagesQuery, useSendMessage } from "@/lib/react-query/hooks/useMessagesQuery";

// Fetch messages
const { data, isLoading } = useMessagesQuery(conversationId);

// Send message with optimistic updates
const sendMessage = useSendMessage();
await sendMessage.mutateAsync({
  conversationId,
  content: "Hello!",
  senderType: "agent",
});
```

#### Customer Profiles

```tsx
import { useCustomerProfileQuery, useUpdateCustomerProfile } from "@/lib/react-query/hooks/useCustomerProfileQuery";

// Fetch profile
const { data: profile } = useCustomerProfileQuery(customerEmail);

// Update profile
const updateProfile = useUpdateCustomerProfile();
updateProfile.mutate({
  email: customerEmail,
  updates: { name: "New Name" },
});
```

## Migration Strategy

### Phase 1: Parallel Implementation (Current)

- New React Query implementation exists alongside existing data fetching
- Both `UnifiedInboxDashboard` and `UnifiedInboxDashboardV2` are available
- No breaking changes to existing code

### Phase 2: Gradual Migration

1. Test `UnifiedInboxDashboardV2` in development
2. Replace dashboard imports one by one:

   ```tsx
   // Old
   import { UnifiedInboxDashboard } from "@/components/inbox/UnifiedInboxDashboard";
   // New
   import { UnifiedInboxDashboardV2 } from "@/components/inbox/UnifiedInboxDashboardV2";
   ```

3. Update any direct store usage to React Query hooks:

   ```tsx
   // Old
   const { conversations, loadConversations } = useUnifiedConversations();

   // New
   const { data, refetch } = useConversationsQuery();
   ```

### Phase 3: Cleanup

- Remove old data fetching hooks
- Remove store-based data management
- Keep only React Query implementation

## Key Features

### 1. Intelligent Caching

- Conversations cached for 5 minutes
- Messages cached for 10 minutes
- Customer profiles cached for 30 minutes
- Organization data cached for 1 hour

### 2. Background Refetching

- Conversations refetch every 30 seconds
- Active conversation messages refetch every 10 seconds
- Smart refetch on window focus (after 30s idle)

### 3. Optimistic Updates

- Messages appear instantly while sending
- Conversation previews update immediately
- Rollback on error

### 4. Offline Support

- Actions queued when offline
- Automatic sync when back online
- Visual indicators for offline state

### 5. Performance Optimizations

- Prefetching on hover
- Infinite scrolling support
- Request deduplication
- Cache persistence in localStorage

## Configuration

### Cache Times

Edit `/lib/react-query/config.ts`:

```tsx
export const CACHE_TIMES = {
  CONVERSATIONS: 5 * 60 * 1000, // 5 minutes
  MESSAGES: 10 * 60 * 1000, // 10 minutes
  USER_PROFILE: 30 * 60 * 1000, // 30 minutes
  ORGANIZATION: 60 * 60 * 1000, // 1 hour
};
```

### Refetch Intervals

```tsx
export const REFETCH_INTERVALS = {
  CONVERSATIONS: 30 * 1000, // 30 seconds
  MESSAGES: 60 * 1000, // 1 minute
  ACTIVE_CONVERSATION: 10 * 1000, // 10 seconds
};
```

## Best Practices

### 1. Use Query Keys Factory

```tsx
// Good
queryKeys.conversationsList({ organizationId, status: "open" })[
  // Bad
  ("conversations", organizationId, "open")
];
```

### 2. Handle Loading States

```tsx
if (query.isLoading) return <ConversationListSkeleton />;
if (query.error) return <ErrorMessage error={query.error} />;
```

### 3. Prefetch Critical Data

```tsx
// Prefetch next likely conversation
const prefetchConversation = usePrefetchConversation();
onMouseEnter={() => prefetchConversation(conversationId));
```

### 4. Use Mutations for Updates

```tsx
// Good - uses mutation with optimistic updates
const sendMessage = useSendMessage();
sendMessage.mutate({ conversationId, content });

// Bad - direct API call
await fetch('/api/messages', { method: 'POST', ... });
```

## Debugging

### React Query DevTools

- Available in development mode
- Shows cache contents
- Allows manual query invalidation
- Tracks query states

### Performance Monitoring

- Use Performance Overlay in development
- Track cache hit rates
- Monitor refetch frequency
- Measure query times

## Common Issues

### 1. Stale Data

```tsx
// Force refetch
queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
```

### 2. Duplicate Requests

- Check if multiple components use the same query
- React Query deduplicates by default

### 3. Cache Not Persisting

- Check localStorage permissions
- Verify persister configuration
- Clear cache if corrupted

## Next Steps

1. Test `UnifiedInboxDashboardV2` thoroughly
2. Monitor performance improvements
3. Gradually migrate other components
4. Remove old data fetching code
5. Optimize cache configuration based on usage patterns
