/**
 * 🔥 Campfire Unified Realtime System
 * Consolidated implementation with standardized hook
 *
 * This is the single source of truth for all realtime functionality
 */

// STANDARDIZED REALTIME HOOK - SINGLE SOURCE OF TRUTH
export { useRealtime } from "@/hooks/useRealtime";
export type {
  StandardMessage,
  StandardRealtimeMetrics,
  StandardTypingUser,
  UseRealtimeConfig,
  UseRealtimeReturn,
} from "@/hooks/useRealtime";

// Legacy native implementations (deprecated - use useRealtime instead)
import {
  broadcastTypingStart,
  broadcastTypingStop,
  nativeBroadcast,
  useNativeConversationRealtime,
  useNativeOrganizationRealtime,
} from "./native-supabase";

export {
  broadcastTypingStart,
  broadcastTypingStop,
  nativeBroadcast,
  useNativeConversationRealtime,
  useNativeOrganizationRealtime,
};

// Legacy compatibility exports
export const useOrganizationRealtime = useNativeOrganizationRealtime;
export const useConversationRealtime = useNativeConversationRealtime;

// Server-side implementations
export { broadcastToConversation, broadcastToOrganization, publishToRealtime } from "./lean-server";

// Standard channel name generators for consistency
export const generateConversationChannel = (orgId: string, conversationId: string): string =>
  `${orgId}:conversation:${conversationId}`;

export const generateOrganizationChannel = (orgId: string): string => `${orgId}:organization`;

export const generateTypingChannel = (orgId: string, conversationId: string): string =>
  `${orgId}:typing:${conversationId}`;

export const generateDashboardChannel = (orgId: string): string => `${orgId}:dashboard`;

// CONSOLIDATED: Legacy compatibility with deprecation warnings
export const Realtime = {
  subscribeToConversation: () => {
    return () => {};
  },
  subscribeToOrganization: () => {
    return () => {};
  },
};

export const ConversationSubscriptionManager = {
  getInstance: () => ({
    subscribeToConversation: () => {
      return () => {};
    },
    unsubscribeFromConversation: () => {},
    subscribeToOrganization: () => {
      return () => {};
    },
  }),
};

// CONSOLIDATED: Replace deprecated manager with unified hooks
export const getUnifiedRealtimeManager = () => {
  return {
    subscribe: (
      organizationId: string,
      channelType: string,
      resourceId: string,
      callbacks: unknown,
      subscriberId: string
    ) => {
      return () => {};
    },
    unsubscribe: () => {},
    broadcast: () => {
      return Promise.resolve(false);
    },
    isHealthy: () => true,
    getDebugInfo: () => ({
      channels: [],
      subscriptions: [],
      circuitBreaker: { state: "deprecated" },
    }),
  };
};

// Legacy compatibility export
export const subscribeToConversation = () => {
  return () => {};
};

// LEGACY ALIASES – maintain backward-compat without touching callers
// Note: useConversationRealtime and useOrganizationRealtime are already exported above

// Very light ConnectionHealth typedef & helper fallback for examples component
export type ConnectionHealth = {
  isHealthy: boolean;
  mode: "websocket" | "polling" | "transitioning";
  failureCount: number;
  lastHeartbeat?: Date;
};

// Fallback hook: simply calls the native hook (no real fallback polling logic yet)
export function useOrganizationRealtimeWithFallback(
  organizationId: string,
  options: Parameters<typeof useNativeOrganizationRealtime>[1] = {}
) {
  // NOTE: A proper WS→polling fallback is TODO; this keeps legacy examples compiling.
  const result = useNativeOrganizationRealtime(organizationId, options);
  // Fabricate minimal ConnectionHealth object expected by old code
  const connectionHealth: ConnectionHealth = {
    isHealthy: result.connectionStatus === "connected",
    mode: result.connectionStatus === "connected" ? "websocket" : "transitioning",
    failureCount: result.connectionStatus === "error" ? 1 : 0,
    lastHeartbeat: new Date(),
  };
  return { ...result, connectionHealth } as const;
}

export function useConversationRealtimeWithFallback(
  organizationId: string,
  conversationId: string,
  options: Parameters<typeof useNativeConversationRealtime>[2] & { autoConnect?: boolean } = {}
) {
  const result = useNativeConversationRealtime(organizationId, conversationId, options);
  const connectionHealth: ConnectionHealth = {
    isHealthy: result.connectionStatus === "connected",
    mode: result.connectionStatus === "connected" ? "websocket" : "transitioning",
    failureCount: result.connectionStatus === "error" ? 1 : 0,
    lastHeartbeat: new Date(),
  };
  return {
    ...result,
    connectionHealth,
    messages: [],
    typingUsers: [],
    connect: () => {},
    disconnect: () => {},
  } as const;
}

// Legacy single-function typing broadcast helper
export const broadcastTyping = broadcastTypingStart;
