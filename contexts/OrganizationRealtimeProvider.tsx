"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
// MIGRATED: Using unified realtime hook
import { useRealtime } from "@/hooks/useRealtime";

interface RealtimeCallbacks {
  onNewMessage?: (message: unknown) => void;
  onMessageStatusUpdate?: (statusUpdate: unknown) => void;
  onConversationUpdate?: (update: unknown) => void;
  onNewConversation?: (conversation: unknown) => void;
  onTypingStart?: (data: { userId: string; userName: string; conversationId: string }) => void;
  onTypingStop?: (data: { userId: string; conversationId: string }) => void;
  onPresenceUpdate?: (data: { userId: string; isOnline: boolean; lastSeen: string }) => void;
}

interface OrganizationRealtimeContextType {
  events: unknown[];
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  subscribe: (callbacks: RealtimeCallbacks) => () => void;
}

const OrganizationRealtimeContext = createContext<OrganizationRealtimeContextType | null>(null);

interface OrganizationRealtimeProviderProps {
  children: React.ReactNode;
}

/**
 * Singleton provider for organization-level realtime subscriptions
 * Prevents subscription thrash by maintaining a single connection per organization
 */
export function OrganizationRealtimeProvider({ children }: OrganizationRealtimeProviderProps) {
  const { user } = useAuth();
  const organizationId = user?.organizationId;
  const [subscribers, setSubscribers] = useState<Map<string, RealtimeCallbacks>>(new Map());
  const [events, setEvents] = useState<any[]>([]);
  const subscriberIdRef = useRef(0);
  const subscribersRef = useRef<Map<string, RealtimeCallbacks>>(new Map());

  // Keep subscribersRef in sync with subscribers state
  React.useEffect(() => {
    subscribersRef.current = subscribers;
  }, [subscribers]);

  // Memoized broadcast functions to prevent re-creating realtime hooks
  const handleNewMessage = React.useCallback((message: unknown) => {
    console.log("🔥 [Provider] Broadcasting new message to subscribers");
    // Add to events log
    setEvents((prev) => [...prev.slice(-49), { type: "new_message", data: message, timestamp: Date.now() }]);
    // Broadcast to all subscribers using ref to avoid stale closure
    subscribersRef.current.forEach((callbacks: RealtimeCallbacks) => {
      callbacks.onNewMessage?.(message);
    });
  }, []);

  // NEW: Handle message status updates (delivery, read receipts)
  const handleMessageStatusUpdate = React.useCallback((statusUpdate: unknown) => {
    console.log("📊 [Provider] Broadcasting message status update to subscribers:", statusUpdate);
    // Add to events log
    setEvents((prev) => [
      ...prev.slice(-49),
      { type: "message_status_update", data: statusUpdate, timestamp: Date.now() },
    ]);
    // Broadcast to all subscribers using ref to avoid stale closure
    subscribersRef.current.forEach((callbacks: RealtimeCallbacks) => {
      callbacks.onMessageStatusUpdate?.(statusUpdate);
    });
  }, []);

  const handleConversationUpdate = React.useCallback((update: unknown) => {
    console.log("🔥 [Provider] Broadcasting conversation update to subscribers");
    // Add to events log
    setEvents((prev) => [...prev.slice(-49), { type: "conversation_update", data: update, timestamp: Date.now() }]);
    // Broadcast to all subscribers using ref to avoid stale closure
    subscribersRef.current.forEach((callbacks: RealtimeCallbacks) => {
      callbacks.onConversationUpdate?.(update);
    });
  }, []);

  const handleNewConversation = React.useCallback((conversation: unknown) => {
    console.log("🔥 [Provider] Broadcasting new conversation to subscribers");
    // Add to events log
    setEvents((prev) => [...prev.slice(-49), { type: "new_conversation", data: conversation, timestamp: Date.now() }]);
    // Broadcast to all subscribers using ref to avoid stale closure
    subscribersRef.current.forEach((callbacks: RealtimeCallbacks) => {
      callbacks.onNewConversation?.(conversation);
    });
  }, []);
  // NEW: Handle typing start events
  const handleTypingStart = React.useCallback((data: unknown) => {
    console.log("⌨️ [Provider] Broadcasting typing start to subscribers:", data);
    // Add to events log
    setEvents((prev) => [...prev.slice(-49), { type: "typing_start", data, timestamp: Date.now() }]);
    // Broadcast to all subscribers using ref to avoid stale closure
    subscribersRef.current.forEach((callbacks: RealtimeCallbacks) => {
      callbacks.onTypingStart?.(data);
    });
  }, []);

  // NEW: Handle typing stop events
  const handleTypingStop = React.useCallback((data: unknown) => {
    console.log("⌨️ [Provider] Broadcasting typing stop to subscribers:", data);
    // Add to events log
    setEvents((prev) => [...prev.slice(-49), { type: "typing_stop", data, timestamp: Date.now() }]);
    // Broadcast to all subscribers using ref to avoid stale closure
    subscribersRef.current.forEach((callbacks: RealtimeCallbacks) => {
      callbacks.onTypingStop?.(data);
    });
  }, []);

  // NEW: Handle presence update events
  const handlePresenceUpdate = React.useCallback((data: unknown) => {
    console.log("👤 [Provider] Broadcasting presence update to subscribers:", data);
    // Add to events log
    setEvents((prev) => [...prev.slice(-49), { type: "presence_update", data, timestamp: Date.now() }]);
    // Broadcast to all subscribers using ref to avoid stale closure
    subscribersRef.current.forEach((callbacks: RealtimeCallbacks) => {
      callbacks.onPresenceUpdate?.(data);
    });
  }, []);

  // Memoize the options object to prevent infinite re-renders
  const realtimeOptions = React.useMemo(
    () => ({
      onNewMessage: handleNewMessage,
      onMessageStatusUpdate: handleMessageStatusUpdate,
      onConversationUpdate: handleConversationUpdate,
      onNewConversation: handleNewConversation,
      onTypingStart: handleTypingStart,
      onTypingStop: handleTypingStop,
      onPresenceUpdate: handlePresenceUpdate,
    }),
    [
      handleNewMessage,
      handleMessageStatusUpdate,
      handleConversationUpdate,
      handleNewConversation,
      handleTypingStart,
      handleTypingStop,
      handlePresenceUpdate,
    ]
  );

  // Single unified organization realtime connection
  const [realtimeState] = useRealtime({
    type: "dashboard",
    organizationId: organizationId || "",
    userId: user?.id,
    enableHeartbeat: true,
    enablePresence: true
  });
  const organizationRealtime = {
    connectionStatus: realtimeState.connectionStatus as "connecting" | "connected" | "disconnected" | "error",
    error: realtimeState.error
  };

  const subscribe = React.useCallback(
    (callbacks: {
      onNewMessage?: (message: unknown) => void;
      onMessageStatusUpdate?: (statusUpdate: unknown) => void;
      onConversationUpdate?: (update: unknown) => void;
      onNewConversation?: (conversation: unknown) => void;
      onTypingStart?: (data: unknown) => void;
      onTypingStop?: (data: unknown) => void;
      onPresenceUpdate?: (data: unknown) => void;
    }) => {
      const id = `subscriber-${++subscriberIdRef.current}`;

      setSubscribers((prev) => new Map(prev).set(id, callbacks));

      // Return unsubscribe function
      return () => {
        setSubscribers((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      };
    },
    []
  );

  const contextValue: OrganizationRealtimeContextType = React.useMemo(
    () => ({
      events,
      connectionStatus: organizationRealtime?.connectionStatus || "disconnected",
      subscribe,
    }),
    [events, organizationRealtime?.connectionStatus, subscribe]
  );

  return <OrganizationRealtimeContext.Provider value={contextValue}>{children}</OrganizationRealtimeContext.Provider>;
}

/**
 * Hook to access organization realtime context
 * Use this instead of useOrganizationRealtime directly to prevent subscription thrash
 */
export function useOrganizationRealtimeContext() {
  const context = useContext(OrganizationRealtimeContext);

  if (!context) {
    throw new Error("useOrganizationRealtimeContext must be used within OrganizationRealtimeProvider");
  }

  return context;
}

/**
 * Hook for components that need to listen to organization realtime events
 * Automatically subscribes/unsubscribes on mount/unmount
 */
export function useOrganizationRealtimeSubscription(callbacks: {
  onNewMessage?: (message: unknown) => void;
  onMessageStatusUpdate?: (statusUpdate: unknown) => void;
  onConversationUpdate?: (update: unknown) => void;
  onNewConversation?: (conversation: unknown) => void;
}) {
  const { subscribe, events, connectionStatus } = useOrganizationRealtimeContext();

  // Memoize the callbacks to prevent infinite re-renders
  const memoizedCallbacks = React.useMemo(
    () => callbacks,
    [
      callbacks.onNewMessage,
      callbacks.onMessageStatusUpdate,
      callbacks.onConversationUpdate,
      callbacks.onNewConversation,
    ]
  );

  useEffect(() => {
    const unsubscribe = subscribe(memoizedCallbacks);
    return unsubscribe;
  }, [subscribe, memoizedCallbacks]);

  return { events, connectionStatus };
}
