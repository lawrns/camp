# Integration Guide

This guide explains how to integrate the new architectural patterns with existing components.

## Overview

We have implemented the core architectural patterns from `GUIDE.md`:

1. **State Management**: Zustand stores for widget and inbox state
2. **Real-time Communication**: Supabase Realtime with standardized channels
3. **Event Handling**: Debounced, throttled, and rate-limited event handlers
4. **Security**: Input validation and sanitization
5. **Monitoring**: Structured logging and performance tracking

## Integration Layers

### Widget Integration

The `WidgetIntegration` class provides a clean interface to connect widget components with the architectural patterns:

```typescript
import { useWidgetIntegration } from '@/lib/integration/widget-integration';

function WidgetComponent({ organizationId }: { organizationId: string }) {
  const integration = useWidgetIntegration({
    organizationId,
    enableSecurity: true,
    enableMonitoring: true
  });

  const handleSendMessage = async (content: string) => {
    if (integration) {
      const success = await integration.sendMessage(content);
      if (success) {
        console.log('Message sent successfully');
      }
    }
  };

  return (
    <div>
      {/* Widget UI */}
    </div>
  );
}
```

### Inbox Integration

The `InboxIntegration` class provides similar functionality for inbox components:

```typescript
import { useInboxIntegration } from '@/lib/integration/inbox-integration';

function InboxComponent({ organizationId, agentId }: { organizationId: string; agentId: string }) {
  const integration = useInboxIntegration({
    organizationId,
    agentId,
    enableSecurity: true,
    enableMonitoring: true
  });

  const handleSendMessage = async (conversationId: string, content: string) => {
    if (integration) {
      const success = await integration.sendMessage(conversationId, content);
      if (success) {
        console.log('Message sent successfully');
      }
    }
  };

  return (
    <div>
      {/* Inbox UI */}
    </div>
  );
}
```

## State Management

### Widget State

The widget state is managed by `useWidgetStore`:

```typescript
import { useWidgetStore, selectMessages, selectIsOpen } from '@/lib/state/widget-state';

function WidgetComponent() {
  const messages = useWidgetStore(selectMessages);
  const isOpen = useWidgetStore(selectIsOpen);
  const { openWidget, closeWidget, addMessage } = useWidgetStore();

  return (
    <div>
      {messages.map(message => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  );
}
```

### Inbox State

The inbox state is managed by `useInboxStore`:

```typescript
import { useInboxStore, selectConversations, selectActiveConversation } from '@/lib/state/inbox-state';

function InboxComponent() {
  const conversations = useInboxStore(selectConversations);
  const activeConversation = useInboxStore(selectActiveConversation);
  const { setActiveConversation, updateConversation } = useInboxStore();

  return (
    <div>
      {conversations.map(conversation => (
        <ConversationCard 
          key={conversation.id} 
          conversation={conversation}
          onClick={() => setActiveConversation(conversation)}
        />
      ))}
    </div>
  );
}
```

## Security Integration

Security features are automatically applied when enabled:

```typescript
// Input validation and sanitization
const validation = validateMessageContent(content);
if (!validation.isValid) {
  console.error('Invalid message:', validation.errors);
  return;
}

const sanitizedContent = sanitizeMessage(content);
```

## Monitoring Integration

Monitoring is handled automatically by the integration layers:

```typescript
// Structured logging
widgetLogger.info('Message sent', {
  messageId,
  contentLength: content.length,
  organizationId
});

// Performance monitoring
performanceMonitor.recordMessageSent();
```

## Real-time Communication

Real-time features are handled through the channel conventions:

```typescript
import { subscribeToChannel, broadcastToChannel, EVENT_TYPES } from '@/lib/realtime/channel-conventions';

// Subscribe to conversation updates
const unsubscribe = subscribeToChannel(
  supabase,
  `org:${organizationId}:conv:${conversationId}`,
  EVENT_TYPES.MESSAGE_CREATED,
  (payload) => {
    // Handle new message
    addMessage(payload);
  }
);

// Broadcast message
await broadcastToChannel(
  supabase,
  `org:${organizationId}:conv:${conversationId}`,
  EVENT_TYPES.MESSAGE_CREATED,
  messageData
);
```

## Event Handling

Event handlers provide debounced, throttled, and rate-limited functionality:

```typescript
import { createTypingStartHandler, createTypingStopHandler } from '@/lib/events/event-handlers';

const typingStartHandler = createTypingStartHandler(
  supabase,
  channelName,
  userId,
  userName
);

const typingStopHandler = createTypingStopHandler(
  supabase,
  channelName,
  userId
);
```

## Migration Guide

### Existing Widget Components

1. Replace direct API calls with integration layer
2. Use `useWidgetStore` for state management
3. Enable security and monitoring features
4. Remove manual real-time handling

### Existing Inbox Components

1. Replace direct API calls with integration layer
2. Use `useInboxStore` for state management
3. Enable security and monitoring features
4. Remove manual real-time handling

## Best Practices

1. **Always use the integration layers** for new components
2. **Enable security features** in production
3. **Enable monitoring** for observability
4. **Use selectors** for efficient state access
5. **Handle errors gracefully** with structured logging
6. **Follow the channel naming conventions** for real-time communication

## Next Steps

1. **Widget Integration**: Update existing widget components to use the integration layer
2. **Inbox Integration**: Update existing inbox components to use the integration layer
3. **Real-time Enhancement**: Add real-time features to the integration layers
4. **Performance Optimization**: Implement performance monitoring
5. **Security Hardening**: Deploy security validations
6. **Monitoring Deployment**: Connect to external monitoring services

## Testing

Test the integration layers with:

```typescript
// Test widget integration
const widgetIntegration = new WidgetIntegration({
  organizationId: 'test-org',
  enableSecurity: true,
  enableMonitoring: true
});

// Test inbox integration
const inboxIntegration = new InboxIntegration({
  organizationId: 'test-org',
  agentId: 'test-agent',
  enableSecurity: true,
  enableMonitoring: true
});
```

This integration guide provides a foundation for connecting the architectural patterns with existing components while maintaining the standards defined in `GUIDE.md`. 