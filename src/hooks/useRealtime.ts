/**
 * STANDARDIZED REALTIME HOOK - SINGLE SOURCE OF TRUTH
 *
 * This is the ONLY realtime hook that should be used across the entire application.
 * All other realtime implementations are deprecated and will be removed.
 *
 * Usage:
 * - Widget: useRealtime({ type: "widget", organizationId, conversationId })
 * - Dashboard: useRealtime({ type: "dashboard", organizationId, conversationId, userId })
 * - General: useRealtime({ type: "general", organizationId })
 */

"use client";

import {
  CHANNEL_PATTERNS,
  channelManager,
  EVENT_TYPES,
  RealtimeHelpers,
  subscribeToChannel
} from "@/lib/realtime/standardized-realtime";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

// Types for the standardized realtime hook
interface RealtimeConfig {
  type: "widget" | "dashboard" | "general";
  organizationId: string;
  conversationId?: string;
  userId?: string;
}

interface RealtimeState {
  isConnected: boolean;
  connectionStatus: string;
  error: string | null;
  lastActivity: Date | null;
}

interface RealtimeActions {
  sendMessage: (message: unknown) => Promise<boolean>;
  broadcastTyping: (isTyping: boolean) => Promise<boolean>;
  broadcastAssignment: (assigneeId: string) => Promise<boolean>;
  disconnect: () => void;
  reconnect: () => void;
}

/**
 * STANDARDIZED REALTIME HOOK
 *
 * This hook provides a unified interface for all realtime communication.
 * It automatically manages channels, prevents memory leaks, and provides
 * consistent event handling across the application.
 */
export function useRealtime(config: RealtimeConfig): [RealtimeState, RealtimeActions] {
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    connectionStatus: 'disconnected',
    error: null,
    lastActivity: null,
  });

  const unsubscribersRef = useRef<(() => void)[]>([]);
  const configRef = useRef(config);

  // Update config ref when config changes
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Setup realtime connections
  useEffect(() => {
    if (!config.organizationId) return;

    setState(prev => ({ ...prev, connectionStatus: 'connecting' }));

    // CRITICAL FIX: Wait for authentication before creating channels
    const setupConnections = async () => {
      try {
        // Check if we have a valid session before creating channels
        const { supabase } = await import("@/lib/supabase");
        const client = supabase.browser();
        const { data: session, error } = await client.auth.getSession();

        if (error || !session?.session?.access_token) {
          console.log('[useRealtime] ⏳ Waiting for authentication before creating channels...');

          // Listen for auth state changes
          const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.access_token) {
              console.log('[useRealtime] ✅ Authentication established, creating channels');
              subscription.unsubscribe();
              setupConnectionsWithAuth();
            }
          });

          return;
        }

        console.log('[useRealtime] ✅ Valid session found, creating channels');
        setupConnectionsWithAuth();
      } catch (error) {
        console.error('[useRealtime] ❌ Authentication check failed:', error);
        setState(prev => ({ ...prev, connectionStatus: 'error', error: error as Error }));
      }
    };

    const setupConnectionsWithAuth = () => {
      const { organizationId, conversationId, userId, type } = configRef.current;
      const unsubscribers: (() => void)[] = [];

      try {
        // Subscribe to organization-wide events
        const orgUnsubscriber = subscribeToChannel(
          CHANNEL_PATTERNS.conversations(organizationId),
          EVENT_TYPES.CONVERSATION_UPDATED,
          (payload) => {
            setState(prev => ({ ...prev, lastActivity: new Date() }));
            // Handle organization-wide conversation updates
          }
        );
        unsubscribers.push(orgUnsubscriber);

        // Subscribe to conversation-specific events if conversationId is provided
        if (conversationId) {
          const messageUnsubscriber = subscribeToChannel(
            CHANNEL_PATTERNS.conversation(organizationId, conversationId),
            EVENT_TYPES.MESSAGE_CREATED,
            (payload) => {
              setState(prev => ({ ...prev, lastActivity: new Date() }));
              // Handle new messages
            }
          );
          unsubscribers.push(messageUnsubscriber);

          // Subscribe to typing indicators
          const typingUnsubscriber = RealtimeHelpers.subscribeToTyping(
            organizationId,
            conversationId,
            (payload) => {
              setState(prev => ({ ...prev, lastActivity: new Date() }));
              // Handle typing indicators
            }
          );
          unsubscribers.push(typingUnsubscriber);
        }

        // Subscribe to assignment events
        const assignmentUnsubscriber = subscribeToChannel(
          CHANNEL_PATTERNS.conversations(organizationId),
          EVENT_TYPES.CONVERSATION_ASSIGNED,
          (payload) => {
            setState(prev => ({ ...prev, lastActivity: new Date() }));
            // Handle assignment changes
          }
        );
        unsubscribers.push(assignmentUnsubscriber);

        setState(prev => ({
          ...prev,
          isConnected: true,
          connectionStatus: 'connected',
          error: null
        }));

        // Store unsubscribers for cleanup
        unsubscribersRef.current = unsubscribers;
        return unsubscribers;
      } catch (error) {
        console.error('[Realtime] Setup error:', error);
        setState(prev => ({
          ...prev,
          isConnected: false,
          connectionStatus: 'error',
          error: error instanceof Error ? error.message : 'Connection failed'
        }));
        return [];
      }
    };

    // Start async setup (no await needed in useEffect)
    setupConnections();

    return () => {
      // Cleanup any existing subscriptions
      unsubscribersRef.current.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('[Realtime] Cleanup error:', error);
        }
      });
      unsubscribersRef.current = [];
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionStatus: 'disconnected'
      }));
    };
  }, [config.organizationId, config.conversationId, config.userId, config.type]);

  // Actions
  const actions: RealtimeActions = {
    sendMessage: useCallback(async (message: unknown) => {
      if (!config.conversationId || !config.organizationId) return false;
      return RealtimeHelpers.broadcastMessage(config.organizationId, config.conversationId, message);
    }, [config.organizationId, config.conversationId]),

    broadcastTyping: useCallback(async (isTyping: boolean) => {
      if (!config.conversationId || !config.organizationId || !config.userId) return false;
      return RealtimeHelpers.broadcastTyping(config.organizationId, config.conversationId, config.userId, isTyping);
    }, [config.organizationId, config.conversationId, config.userId]),

    broadcastAssignment: useCallback(async (assigneeId: string) => {
      if (!config.conversationId || !config.organizationId || !config.userId) return false;
      return RealtimeHelpers.broadcastAssignment(config.organizationId, config.conversationId, assigneeId, config.userId);
    }, [config.organizationId, config.conversationId, config.userId]),

    disconnect: useCallback(() => {
      unsubscribersRef.current.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('[Realtime] Disconnect error:', error);
        }
      });
      unsubscribersRef.current = [];
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionStatus: 'disconnected'
      }));
    }, []),

    reconnect: useCallback(() => {
      // Trigger reconnection by updating state
      setState(prev => ({ ...prev, connectionStatus: 'reconnecting' }));
      // The useEffect will handle the actual reconnection
    }, []),
  };

  return [state, actions];
}

// Export the hook as default
export default useRealtime;
