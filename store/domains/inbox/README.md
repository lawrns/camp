# Inbox Domain Store

The inbox store manages all state related to the inbox interface, including message composition, bulk conversation selection, and panel visibility.

## Purpose

This store was extracted from the unified Campfire store to:

- Improve performance by reducing unnecessary re-renders
- Centralize all inbox-related logic
- Provide better TypeScript support with specific hooks
- Enable easier testing of inbox functionality

## Features

### Message Composition

- Message text state
- Sending state management
- File upload progress tracking

### Bulk Actions

- Multi-conversation selection
- Select all functionality
- Toggle selection helpers

### Panel Management

- Resizable panel widths
- Panel visibility toggles
- Persistent size preferences

### UI State

- Composer disabled state
- Panel open detection
- State reset utilities

## Usage

```typescript
import { useInboxActions, useMessageText, useSelectedConversations } from "@/store/domains/inbox";

function InboxComponent() {
  const messageText = useMessageText();
  const selectedConversations = useSelectedConversations();
  const { setMessageText, toggleConversationSelection } = useInboxActions();

  // Component logic...
}
```

## Architecture

The store follows these principles:

1. **Single Responsibility**: Only manages inbox-specific state
2. **Performance**: Uses Zustand selectors for optimal re-renders
3. **Type Safety**: Fully typed with TypeScript
4. **Persistence**: Saves user preferences for panel sizes
5. **Developer Experience**: Provides convenience hooks and actions

## Related Stores

- **Unified Store** (`/store/unified-campfire-store.ts`): Core data and authentication
- **UI Store** (`/store/domains/ui`): General UI state
- **Performance Store** (`/store/domains/performance`): Performance monitoring

## Migration

See [migration-guide.md](./migration-guide.md) for instructions on migrating from the unified store.
