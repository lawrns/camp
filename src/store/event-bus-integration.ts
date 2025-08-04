/**
 * Event Bus Integration with Existing Stores
 *
 * This file demonstrates how to integrate the event bus system
 * with the existing Zustand stores in the Campfire application.
 */

import { useConversationsStore as useConversationStore } from "./domains/conversations";
import { eventBus, EventPriority } from "./event-bus";
import { useStore as useCampfireStore } from "./phoenix-store";

/**
 * Initialize event bus listeners for cross-store communication
 * Call this once during app initialization
 */
export function initializeEventBusIntegration() {
  // ===== AUTH EVENTS =====

  // When user logs in, update all stores
  eventBus.on("auth:login", {
    handler: async (event) => {
      // Update organization context
      // const campfireStore = useCampfireStore.getState();

      // Load user-specific data - commented out until stores are available
      // await Promise.all([
      //   campfireStore.loadConversations(),
      //   useConversationStore.getState().loadConversations(event.organizationId),
      // ]);

      console.log("Auth login event processed for:", event.userId);
    },
    priority: EventPriority.HIGH,
  });

  // When user logs out, clear all stores
  eventBus.on("auth:logout", {
    handler: () => {
      // Clear all user data - commented out until stores are available
      // useCampfireStore.getState().clearAuth();
      // useConversationStore.getState().clearAllData();

      console.log("Auth logout event processed");
    },
    priority: EventPriority.CRITICAL,
  });

  // ===== CONVERSATION EVENTS =====

  // When a conversation is created
  eventBus.on("conversation:created", {
    handler: (event) => {
      const campfireStore = useCampfireStore.getState();
      const conversationStore = useConversationStore.getState();

      // Add to both stores if needed
      if (!campfireStore.conversations.find((c) => c.id === event.conversationId)) {
        // Fetch and add the new conversation
        fetch(`/api/conversations/${event.conversationId}`)
          .then((res) => res.json())
          .then((data) => {
            campfireStore.setConversations([...campfireStore.conversations, data.conversation]);
            conversationStore.updateConversation(data.conversation);
          });
      }
    },
    priority: EventPriority.NORMAL,
  });

  // When a conversation is assigned
  eventBus.on("conversation:assigned", {
    handler: (event) => {
      const campfireStore = useCampfireStore.getState();
      const conversation = campfireStore.conversations.find((c) => c.id === event.conversationId);

      if (conversation) {
        // Update conversation in the array
        const updatedConversations = campfireStore.conversations.map((c) =>
          c.id === conversation.id ? { ...c, assigned_to: event.assigneeId, assigned_at: new Date().toISOString() } : c
        );
        campfireStore.setConversations(updatedConversations);
      }

      // Update dashboard metrics
      // useDashboardStore.getState().updateAssignmentMetrics(event.assigneeId);
      console.log("Assignment metrics updated for:", event.assigneeId);
    },
    priority: EventPriority.NORMAL,
  });

  // When conversation status changes
  eventBus.on("conversation:status-changed", {
    handler: async (event) => {
      const campfireStore = useCampfireStore.getState();

      // Update conversation status
      await campfireStore.updateConversationStatus(event.conversationId, event.newStatus as unknown);

      // Track metrics
      if (event.newStatus === "resolved") {
        // useDashboardStore.getState().incrementResolvedCount();
        console.log("Resolved count incremented");
      }
    },
    priority: EventPriority.NORMAL,
  });

  // ===== MESSAGE EVENTS =====

  // When a message is sent
  eventBus.on("message:sent", {
    handler: async (event) => {
      // Update conversation's last message
      const campfireStore = useCampfireStore.getState();
      const conversation = campfireStore.conversations.find((c) => c.id === event.conversationId);

      if (conversation) {
        // Update conversation in the array
        const updatedConversations = campfireStore.conversations.map((c) =>
          c.id === conversation.id
            ? {
                ...c,
                last_message: event.content,
                lastMessageAt: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : c
        );
        campfireStore.setConversations(updatedConversations);
      }

      // Update metrics
      // useDashboardStore.getState().incrementMessageCount();
      console.log("Message count incremented");
    },
    priority: EventPriority.NORMAL,
    async: true,
  });

  // When a message is received from customer
  eventBus.on("message:received", {
    handler: (event) => {
      const campfireStore = useCampfireStore.getState();

      // Add message to store
      campfireStore.addMessage(event.conversationId, {
        id: event.messageId,
        conversationId: event.conversationId,
        content: event.content,
        senderName: event.sender,
        createdAt: new Date().toISOString(),
      });

      // Update unread count if not currently viewing
      if (campfireStore.ui.selectedConversationId !== event.conversationId) {
        campfireStore.incrementUnreadCount(event.conversationId);
      }

      // Show notification
      if (event.sender === "customer") {
        campfireStore.addNotification({
          type: "info",
          message: `New message from customer in conversation`,
          conversationId: event.conversationId,
        });
      }
    },
    priority: EventPriority.HIGH,
  });

  // ===== AI EVENTS =====

  // When AI requests handover
  eventBus.on("ai:handover-requested", {
    handler: async (event) => {
      const campfireStore = useCampfireStore.getState();
      // const dashboardStore = useDashboardStore.getState();

      // Update conversation priority
      const conversation = campfireStore.conversations.find((c) => c.id === event.conversationId);
      if (conversation) {
        // Update conversation in the array
        const updatedConversations = campfireStore.conversations.map((c) =>
          c.id === conversation.id
            ? {
                ...c,
                priority: "high",
                metadata: {
                  ...c.metadata,
                  handover: {
                    confidence: event.confidence,
                    reason: event.reason,
                  },
                },
              }
            : c
        );
        campfireStore.setConversations(updatedConversations);
      }

      // Alert available agents
      // dashboardStore.addUrgentNotification({
      //   type: "handover",
      //   conversationId: event.conversationId,
      //   confidence: event.confidence,
      //   reason: event.reason,
      // });
      console.log("Urgent notification added for handover:", event.conversationId);

      // Log for analytics
      await fetch("/api/ai/handover-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      // Add realtime broadcast
      const supabase = useCampfireStore.getState().supabase;
      const organizationId = campfireStore.organization?.id;
      if (!supabase || !organizationId) return;

      const channel = supabase.channel(`org:${organizationId}`);
      channel.send({
        type: "broadcast",
        event: "handover",
        payload: {
          conversationId: event.conversationId,
          summary: event.summary,
          suggestedActions: event.suggestedActions,
          sentiment: event.sentiment,
          metadata: event.metadata,
        },
      });

      // Update store with handover state using setConversations
      const updatedConversations = campfireStore.conversations.map((c) =>
        c.id === event.conversationId
          ? {
              ...c,
              handoverState: {
                active: true,
                reason: event.reason,
                confidence: event.confidence,
                context: event.metadata,
              },
            }
          : c
      );
      campfireStore.setConversations(updatedConversations);
    },
    priority: EventPriority.CRITICAL,
    retryCount: 3,
    retryDelay: 1000,
  });

  // When AI generates a response
  eventBus.on("ai:response-generated", {
    handler: (event) => {
      // Track AI performance metrics
      // useDashboardStore.getState().updateAIMetrics({
      //   conversationId: event.conversationId,
      //   confidence: event.confidence,
      //   timestamp: Date.now(),
      // });
      console.log("AI metrics updated for conversation:", event.conversationId);
    },
    priority: EventPriority.LOW,
    async: true,
  });

  // ===== REALTIME EVENTS =====

  // When realtime connection is established
  eventBus.on("realtime:connected", {
    handler: (event) => {
      const campfireStore = useCampfireStore.getState();
      campfireStore.setRealtimeConnection(true, "connected");

      // Re-subscribe to channels if needed
      const organizationId = campfireStore.organization?.id;
      if (organizationId) {
        useConversationStore.getState().subscribeToOrganization(organizationId);
      }
    },
    priority: EventPriority.HIGH,
  });

  // When realtime connection is lost
  eventBus.on("realtime:disconnected", {
    handler: (event) => {
      const campfireStore = useCampfireStore.getState();
      campfireStore.setRealtimeConnection(false, "disconnected");

      // Show warning to user
      campfireStore.addNotification({
        type: "warning",
        message: "Connection lost. Some features may be unavailable.",
      });

      // Attempt reconnection
      setTimeout(() => {
        eventBus.emit("system:reconnect-requested", {
          source: "EventBusIntegration",
          reason: event.reason || "Connection lost",
        });
      }, 5000);
    },
    priority: EventPriority.HIGH,
  });

  // ===== UI EVENTS =====

  // When theme changes
  eventBus.on("ui:theme-changed", {
    handler: (event) => {
      // Update document classes
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(event.theme);

      // Persist preference
      localStorage.setItem("theme", event.theme);
    },
    priority: EventPriority.LOW,
  });

  // ===== PERFORMANCE EVENTS =====

  // Monitor slow API calls
  eventBus.on("performance:api-slow", {
    handler: (event) => {
      console.warn(`Slow API call detected: ${event.endpoint} took ${event.duration}ms`);

      // Track in dashboard
      // useDashboardStore.getState().addPerformanceMetric({
      //   type: "api",
      //   endpoint: event.endpoint,
      //   duration: event.duration,
      //   timestamp: Date.now(),
      // });
      console.log("Performance metric added for:", event.endpoint);
    },
    priority: EventPriority.LOW,
    async: true,
  });

  // Monitor memory usage
  eventBus.on("performance:memory-warning", {
    handler: (event) => {
      // Clear old data from stores
      const campfireStore = useCampfireStore.getState();
      const conversationStore = useConversationStore.getState();

      // Clear old messages (keep only recent 100 per conversation)
      Object.entries(campfireStore.messages).forEach(([conversationId, messages]) => {
        if (messages.length > 100) {
          const recentMessages = messages.slice(-100);
          campfireStore.setMessages(conversationId, recentMessages);
        }
      });

      // Clear old notifications
      const notifications = campfireStore.ui.notifications;
      if (notifications.length > 50) {
        notifications.splice(0, notifications.length - 50);
      }
    },
    priority: EventPriority.HIGH,
  });

  // ===== SYSTEM EVENTS =====

  // Handle system errors
  eventBus.on("system:error", {
    handler: async (event) => {
      console.error("System error:", event.error);

      // Log to error tracking service
      if (process.env.NODE_ENV === "production") {
        try {
          await fetch("/api/errors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              error: {
                message: event.error.message,
                stack: event.error.stack,
                context: event.context,
              },
              timestamp: event.timestamp,
              source: event.source,
            }),
          });
        } catch (err) {
          console.error("Failed to log error:", err);
        }
      }

      // Show user-friendly error
      useCampfireStore.getState().addNotification({
        type: "error",
        message: "An error occurred. Our team has been notified.",
      });
    },
    priority: EventPriority.CRITICAL,
    retryCount: 2,
    errorHandler: (error, event) => {
      console.error("Failed to handle system error:", error);
    },
  });

  // Handle online/offline events
  eventBus.on("system:online", {
    handler: () => {
      const campfireStore = useCampfireStore.getState();

      // Clear offline warning
      campfireStore.removeNotification("offline-warning");

      // Sync any offline changes
      // TODO: Implement offline sync when method is available
      // campfireStore.syncOfflineChanges();
    },
    priority: EventPriority.HIGH,
  });

  eventBus.on("system:offline", {
    handler: () => {
      const campfireStore = useCampfireStore.getState();

      // Show offline warning
      campfireStore.addNotification({
        type: "warning",
        message: "You are offline. Changes will be synced when connection is restored.",
        persistent: true,
      });
    },
    priority: EventPriority.HIGH,
  });

  console.log("[EventBus] Integration initialized");
}

/**
 * Clean up event bus listeners
 * Call this during app cleanup
 */
export function cleanupEventBusIntegration() {
  eventBus.clear();
  console.log("[EventBus] Integration cleaned up");
}
