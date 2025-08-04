// ============================================================================
// React Hooks for Typed Events
// ============================================================================

import { useEffect, useRef } from "react";
import { RealtimeChannel } from "@supabase/realtime-js";
import { SupabaseClient } from "@supabase/supabase-js";
// ============================================================================
// Integration with Existing Realtime Hooks
// ============================================================================

import { useConversationRealtime, useOrganizationRealtime } from "../index";
import {
  broadcastToConversation,
  broadcastToDashboard,
  broadcastToOrganization,
  publishToRealtime,
} from "../lean-server";
import {
  EventBuilders,
  EventDispatcher,
  EventPayloadMap,
  EventType,
  EventTypes,
  parseEvent,
  validateEvent,
} from "./registry";

// ============================================================================
// Server-Side Event Broadcasting
// ============================================================================

/**
 * Broadcasts a typed event to a conversation channel
 */
export async function broadcastConversationEvent<T extends EventType>(
  organizationId: string,
  conversationId: string,
  eventType: T,
  payload: Omit<EventPayloadMap[T], "id" | "timestamp">
): Promise<void> {
  const event = EventBuilders[eventType as keyof typeof EventBuilders]?.(payload as unknown);

  if (!event) {
    throw new Error(`No event builder found for type: ${eventType}`);
  }

  await broadcastToConversation(organizationId, conversationId, eventType, event);
}

/**
 * Broadcasts a typed event to an organization channel
 */
export async function broadcastOrganizationEvent<T extends EventType>(
  organizationId: string,
  eventType: T,
  payload: Omit<EventPayloadMap[T], "id" | "timestamp">
): Promise<void> {
  const event = EventBuilders[eventType as keyof typeof EventBuilders]?.(payload as unknown);

  if (!event) {
    throw new Error(`No event builder found for type: ${eventType}`);
  }

  await broadcastToOrganization(organizationId, eventType, event);
}

/**
 * Broadcasts a typed event to a dashboard channel
 */
export async function broadcastDashboardEvent<T extends EventType>(
  organizationId: string,
  eventType: T,
  payload: Omit<EventPayloadMap[T], "id" | "timestamp">
): Promise<void> {
  const event = EventBuilders[eventType as keyof typeof EventBuilders]?.(payload as unknown);

  if (!event) {
    throw new Error(`No event builder found for type: ${eventType}`);
  }

  await broadcastToDashboard(organizationId, eventType, event);
}

// ============================================================================
// Client-Side Event Subscription
// ============================================================================

export interface TypedRealtimeChannel {
  channel: RealtimeChannel;
  dispatcher: EventDispatcher;

  /**
   * Subscribe to a specific event type
   */
  on<T extends EventType>(eventType: T, handler: (event: EventPayloadMap[T]) => void | Promise<void>): () => void;

  /**
   * Subscribe to all events
   */
  onAny(handler: (type: EventType, event: unknown) => void | Promise<void>): () => void;

  /**
   * Unsubscribe from the channel
   */
  unsubscribe(): Promise<void>;
}

/**
 * Creates a typed realtime channel with event validation
 */
export function createTypedChannel(supabase: SupabaseClient, channelName: string): TypedRealtimeChannel {
  const dispatcher = new EventDispatcher();
  const channel = supabase.channel(channelName);

  // Set up the channel to listen for all broadcast events
  channel.on("broadcast", { event: "*" }, (payload: unknown) => {
    const eventType = payload.event as EventType;
    const eventData = payload.payload;

    // Validate the event
    if (!validateEvent(eventType, eventData)) {
      return;
    }

    // Parse and dispatch the event
    try {
      const parsedEvent = parseEvent(eventType, eventData);
      dispatcher.emit(eventType, parsedEvent);
    } catch (error) {}
  });

  // Subscribe to the channel
  channel.subscribe();

  return {
    channel,
    dispatcher,

    on<T extends EventType>(eventType: T, handler: (event: EventPayloadMap[T]) => void | Promise<void>): () => void {
      return dispatcher.on(eventType, handler);
    },

    onAny(handler: (type: EventType, event: unknown) => void | Promise<void>): () => void {
      return dispatcher.onAny(handler);
    },

    async unsubscribe(): Promise<void> {
      dispatcher.clear();
      await channel.unsubscribe();
    },
  };
}

/**
 * React hook for subscribing to typed realtime events
 */
export function useTypedRealtimeEvents(channel: TypedRealtimeChannel | null): {
  on<T extends EventType>(eventType: T, handler: (event: EventPayloadMap[T]) => void | Promise<void>): void;
  onAny(handler: (type: EventType, event: unknown) => void | Promise<void>): void;
} {
  const unsubscribersRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    return () => {
      // Cleanup all subscriptions
      unsubscribersRef.current.forEach((unsub: unknown) => unsub());
      unsubscribersRef.current = [];
    };
  }, []);

  return {
    on<T extends EventType>(eventType: T, handler: (event: EventPayloadMap[T]) => void | Promise<void>): void {
      if (!channel) return;

      const unsubscribe = channel.on(eventType, handler);
      unsubscribersRef.current.push(unsubscribe);
    },

    onAny(handler: (type: EventType, event: unknown) => void | Promise<void>): void {
      if (!channel) return;

      const unsubscribe = channel.onAny(handler);
      unsubscribersRef.current.push(unsubscribe);
    },
  };
}

// ============================================================================
// Event-Specific Hooks
// ============================================================================

/**
 * Hook for subscribing to AI handover events
 */
export function useAIHandoverEvents(
  channel: TypedRealtimeChannel | null,
  handlers: {
    onRequested?: (event: EventPayloadMap[typeof EventTypes.AI_HANDOVER_REQUESTED]) => void;
    onAccepted?: (event: EventPayloadMap[typeof EventTypes.AI_HANDOVER_ACCEPTED]) => void;
    onRejected?: (event: EventPayloadMap[typeof EventTypes.AI_HANDOVER_REJECTED]) => void;
    onCompleted?: (event: EventPayloadMap[typeof EventTypes.AI_HANDOVER_COMPLETED]) => void;
  }
): void {
  const events = useTypedRealtimeEvents(channel);

  useEffect(() => {
    if (!channel) return;

    const unsubscribers: Array<() => void> = [];

    if (handlers.onRequested) {
      unsubscribers.push(channel.on(EventTypes.AI_HANDOVER_REQUESTED, handlers.onRequested));
    }

    if (handlers.onAccepted) {
      unsubscribers.push(channel.on(EventTypes.AI_HANDOVER_ACCEPTED, handlers.onAccepted));
    }

    if (handlers.onRejected) {
      unsubscribers.push(channel.on(EventTypes.AI_HANDOVER_REJECTED, handlers.onRejected));
    }

    if (handlers.onCompleted) {
      unsubscribers.push(channel.on(EventTypes.AI_HANDOVER_COMPLETED, handlers.onCompleted));
    }

    return () => {
      unsubscribers.forEach((unsub: unknown) => unsub());
    };
  }, [channel, handlers]);
}

/**
 * Hook for subscribing to typing events
 */
export function useTypingEvents(
  channel: TypedRealtimeChannel | null,
  handlers: {
    onStart?: (event: EventPayloadMap[typeof EventTypes.TYPING_START]) => void;
    onStop?: (event: EventPayloadMap[typeof EventTypes.TYPING_STOP]) => void;
    onClear?: (event: EventPayloadMap[typeof EventTypes.TYPING_CLEAR]) => void;
  }
): void {
  useEffect(() => {
    if (!channel) return;

    const unsubscribers: Array<() => void> = [];

    if (handlers.onStart) {
      unsubscribers.push(channel.on(EventTypes.TYPING_START, handlers.onStart));
    }

    if (handlers.onStop) {
      unsubscribers.push(channel.on(EventTypes.TYPING_STOP, handlers.onStop));
    }

    if (handlers.onClear) {
      unsubscribers.push(channel.on(EventTypes.TYPING_CLEAR, handlers.onClear));
    }

    return () => {
      unsubscribers.forEach((unsub: unknown) => unsub());
    };
  }, [channel, handlers]);
}

/**
 * Hook for subscribing to message events
 */
export function useMessageEvents(
  channel: TypedRealtimeChannel | null,
  handlers: {
    onCreated?: (event: EventPayloadMap[typeof EventTypes.MESSAGE_CREATED]) => void;
    onUpdated?: (event: EventPayloadMap[typeof EventTypes.MESSAGE_UPDATED]) => void;
    onDeleted?: (event: EventPayloadMap[typeof EventTypes.MESSAGE_DELETED]) => void;
    onReactionAdded?: (event: EventPayloadMap[typeof EventTypes.MESSAGE_REACTION_ADDED]) => void;
    onReactionRemoved?: (event: EventPayloadMap[typeof EventTypes.MESSAGE_REACTION_REMOVED]) => void;
  }
): void {
  useEffect(() => {
    if (!channel) return;

    const unsubscribers: Array<() => void> = [];

    if (handlers.onCreated) {
      unsubscribers.push(channel.on(EventTypes.MESSAGE_CREATED, handlers.onCreated));
    }

    if (handlers.onUpdated) {
      unsubscribers.push(channel.on(EventTypes.MESSAGE_UPDATED, handlers.onUpdated));
    }

    if (handlers.onDeleted) {
      unsubscribers.push(channel.on(EventTypes.MESSAGE_DELETED, handlers.onDeleted));
    }

    if (handlers.onReactionAdded) {
      unsubscribers.push(channel.on(EventTypes.MESSAGE_REACTION_ADDED, handlers.onReactionAdded));
    }

    if (handlers.onReactionRemoved) {
      unsubscribers.push(channel.on(EventTypes.MESSAGE_REACTION_REMOVED, handlers.onReactionRemoved));
    }

    return () => {
      unsubscribers.forEach((unsub: unknown) => unsub());
    };
  }, [channel, handlers]);
}

/**
 * Improved conversation realtime hook with typed events
 */
export function useTypedConversationRealtime(
  organizationId: string,
  conversationId: string,
  options?: { enabled?: boolean }
): {
  channel: TypedRealtimeChannel | null;
  isConnected: boolean;
  error: Error | null;
} {
  const { channel: rawChannel, connectionStatus, error } = useConversationRealtime(organizationId, conversationId, {});

  const typedChannelRef = useRef<TypedRealtimeChannel | null>(null);

  useEffect(() => {
    if (rawChannel && !typedChannelRef.current) {
      typedChannelRef.current = {
        channel: rawChannel,
        dispatcher: new EventDispatcher(),
        on: function (eventType, handler) {
          return this.dispatcher.on(eventType, handler);
        },
        onAny: function (handler) {
          return this.dispatcher.onAny(handler);
        },
        unsubscribe: async function () {
          this.dispatcher.clear();
          await this.channel.unsubscribe();
        },
      };

      // Set up the typed event handling
      rawChannel.on("broadcast", { event: "*" }, (payload: { event: string; payload: unknown }) => {
        const eventType = payload.event as EventType;
        const eventData = payload.payload;

        if (validateEvent(eventType, eventData)) {
          try {
            const parsedEvent = parseEvent(eventType, eventData);
            typedChannelRef.current!.dispatcher.emit(eventType, parsedEvent);
          } catch (error) {}
        }
      });
    }

    return () => {
      if (typedChannelRef.current) {
        typedChannelRef.current.unsubscribe();
        typedChannelRef.current = null;
      }
    };
  }, [rawChannel]);

  return {
    channel: typedChannelRef.current,
    isConnected: connectionStatus === "connected",
    error: error ? new Error(error) : null,
  };
}

/**
 * Improved organization realtime hook with typed events
 */
export function useTypedOrganizationRealtime(
  organizationId: string,
  options?: { enabled?: boolean }
): {
  channel: TypedRealtimeChannel | null;
  isConnected: boolean;
  error: Error | null;
} {
  const { channel: rawChannel, connectionStatus, error } = useOrganizationRealtime(organizationId, {});

  const typedChannelRef = useRef<TypedRealtimeChannel | null>(null);

  useEffect(() => {
    if (rawChannel && !typedChannelRef.current) {
      typedChannelRef.current = {
        channel: rawChannel,
        dispatcher: new EventDispatcher(),
        on: function (eventType, handler) {
          return this.dispatcher.on(eventType, handler);
        },
        onAny: function (handler) {
          return this.dispatcher.onAny(handler);
        },
        unsubscribe: async function () {
          this.dispatcher.clear();
          await this.channel.unsubscribe();
        },
      };

      // Set up the typed event handling
      rawChannel.on("broadcast", { event: "*" }, (payload: { event: string; payload: unknown }) => {
        const eventType = payload.event as EventType;
        const eventData = payload.payload;

        if (validateEvent(eventType, eventData)) {
          try {
            const parsedEvent = parseEvent(eventType, eventData);
            typedChannelRef.current!.dispatcher.emit(eventType, parsedEvent);
          } catch (error) {}
        }
      });
    }

    return () => {
      if (typedChannelRef.current) {
        typedChannelRef.current.unsubscribe();
        typedChannelRef.current = null;
      }
    };
  }, [rawChannel]);

  return {
    channel: typedChannelRef.current,
    isConnected: connectionStatus === "connected",
    error: error ? new Error(error) : null,
  };
}

// ============================================================================
// Export everything
// ============================================================================

export * from "./registry";
