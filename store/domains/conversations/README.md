# Conversations Store

Domain-specific store for managing conversations in the Campfire application.

## Overview

The conversations store manages all conversation-related state including:

- Conversations data with normalized Map structure
- Message previews and unread counts for performance
- Filtering and searching capabilities
- Real-time updates with optimistic UI
- Authentication-aware cleanup

## Usage

### Basic Usage

```typescript
import { useConversationsStore } from '@/store/domains/conversations';

function ConversationList() {
  const conversations = useConversationsStore(state => state.conversations);
  const isLoading = useConversationsStore(state => state.isLoading);

  // Or use the convenience hook
  const filteredConversations = useFilteredConversations();

  return (
    <div>
      {isLoading ? (
        <Spinner />
      ) : (
        filteredConversations.map(conv => (
          <ConversationItem key={conv.id} conversation={conv} />
        ))
      )}
    </div>
  );
}
```

### Actions

```typescript
const { loadConversations, updateConversationStatus, setSelectedConversation, setActiveFilter, setSearchQuery } =
  useConversationsStore();

// Load conversations
await loadConversations();

// Update status with optimistic UI
await updateConversationStatus("conv123", "closed");

// Select a conversation (marks as read)
setSelectedConversation("conv123");

// Filter conversations
setActiveFilter("unread");

// Search
setSearchQuery("customer@example.com");
```

### Selectors

```typescript
import { conversationSelectors } from "@/store/domains/conversations";

// Get all conversations sorted by last message
const allConversations = useConversationsStore(conversationSelectors.getAllConversations);

// Get filtered conversations (applies current filter and search)
const filtered = useConversationsStore(conversationSelectors.getFilteredConversations);

// Get specific conversation
const conversation = useConversationsStore(conversationSelectors.getConversationById("conv123"));

// Get total unread count
const unreadCount = useConversationsStore(conversationSelectors.getTotalUnreadCount);
```

### Convenience Hooks

```typescript
import {
  useConversationById,
  useFilteredConversations,
  useIsLoadingMessages,
  useSelectedConversation,
  useTotalUnreadCount,
} from "@/store/domains/conversations";

// Direct access to common data
const selectedConversation = useSelectedConversation();
const filteredConversations = useFilteredConversations();
const unreadCount = useTotalUnreadCount();
const conversation = useConversationById("conv123");
const isLoadingMessages = useIsLoadingMessages("conv123");
```

## Features

### 1. Normalized State Structure

Conversations are stored in a Map for O(1) lookups:

```typescript
conversations: Map<string, Conversation>;
```

### 2. Performance Optimizations

- Message previews cached separately for fast list rendering
- Unread counts tracked independently
- Per-conversation message loading states

### 3. Optimistic Updates

Status updates and assignments are applied optimistically with automatic rollback on failure:

```typescript
// Immediate UI update, rollback if API fails
await updateConversationStatus("conv123", "closed");
```

### 4. Auth Integration

The store automatically:

- Clears conversations on logout
- Reloads conversations on login
- Includes auth tokens in API requests

### 5. Real-time Ready

The store structure supports real-time updates:

```typescript
// Update from real-time event
updateConversation(realtimeConversation);
updateLastMessagePreview(conversationId, preview, timestamp);
```

## State Structure

```typescript
interface ConversationsState {
  // Core data
  conversations: Map<string, Conversation>;

  // Performance caches
  lastMessagePreviews: Record<string, string>;
  unreadCounts: Record<string, number>;

  // UI state
  selectedConversationId: string | null;
  activeFilter: "all" | "unread" | "assigned" | "unassigned" | "closed";
  searchQuery: string;

  // Loading states
  isLoading: boolean;
  isLoadingMessages: Record<string, boolean>;
  error: string | null;

  // Pagination
  hasMore: boolean;
  nextCursor: string | null;
  totalCount: number;
}
```

## Utility Functions

```typescript
import { batchUpdateConversations, getConversationStats } from "@/store/domains/conversations";

// Get statistics
const stats = getConversationStats();
console.log(stats);
// {
//   total: 50,
//   open: 30,
//   closed: 20,
//   unread: 10,
//   assigned: 35,
//   unassigned: 15
// }

// Batch update multiple conversations
batchUpdateConversations([
  { id: "conv1", changes: { status: "closed" } },
  { id: "conv2", changes: { assigned_to: "user123" } },
  { id: "conv3", changes: { priority: "high" } },
]);
```

## Testing

The store includes comprehensive tests. Run them with:

```bash
pnpm test store/domains/conversations
```

## Migration

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for migrating from the unified store.
