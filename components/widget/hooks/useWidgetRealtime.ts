"use client";

/**
 * PHASE 0 CRITICAL FIX: Widget Realtime Hook - DEPRECATED
 * 
 * This implementation has been DEPRECATED in favor of the unified useRealtime hook.
 * This file now serves as a compatibility wrapper to prevent breaking changes.
 * 
 * MIGRATION: Use useRealtime({ type: "widget", organizationId, conversationId }) instead
 * 
 * FIXED: Infinite re-render issue by delegating to unified implementation
 * FIXED: Connection stability with unified error handling
 * FIXED: Prevents competing real-time implementations
 */

import { useRealtime } from '../../../hooks/useRealtime';
import { WidgetMessage, MessageStatus } from '../../../types/entities/message';
import { useEffect } from 'react';
import { subscribeToChannel } from '../../../lib/realtime/standardized-realtime';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '../../../lib/realtime/unified-channel-standards';

interface WidgetRealtimeConfig {
  organizationId: string;
  conversationId?: string;
  userId?: string;
  onMessage?: (message: WidgetMessage) => void;
  onTyping?: (isTyping: boolean, userName?: string) => void;
  onConnectionChange?: (connected: boolean) => void;
  onMessageStatusUpdate?: (messageId: string, status: string) => void;
  getAuthHeaders?: () => Promise<Record<string, string>>;
}

type ConnectionStatus = 'connecting' | 'connected' | 'error' | 'disconnected';

export function useWidgetRealtime(config: WidgetRealtimeConfig) {
  // PHASE 0 CRITICAL FIX: Delegate to unified realtime implementation
  const [realtimeState, realtimeActions] = useRealtime({
    type: 'widget',
    organizationId: config.organizationId,
    conversationId: config.conversationId,
    userId: config.userId,
    enableTyping: true,
    enablePresence: false
  });

  // CRITICAL FIX: Add missing callback handling for widget message reception
  useEffect(() => {
    if (!config.conversationId || !config.organizationId) return;

    console.log('[Widget Realtime] 🔧 BIDIRECTIONAL FIX: Setting up message callbacks for:', {
      organizationId: config.organizationId,
      conversationId: config.conversationId
    });

    const unsubscribers: (() => void)[] = [];

    // Subscribe to messages using unified channels
    if (config.onMessage) {
      const messageUnsubscriber = subscribeToChannel(
        UNIFIED_CHANNELS.conversation(config.organizationId, config.conversationId),
        UNIFIED_EVENTS.MESSAGE_CREATED,
        (payload) => {
          console.log('[Widget Realtime] 📨 Received agent message:', payload);
          if (payload.payload?.message && config.onMessage) {
            config.onMessage(payload.payload.message);
          }
        }
      );
      unsubscribers.push(messageUnsubscriber);
    }

    // Subscribe to typing indicators
    if (config.onTyping) {
      const typingStartUnsubscriber = subscribeToChannel(
        UNIFIED_CHANNELS.conversationTyping(config.organizationId, config.conversationId),
        UNIFIED_EVENTS.TYPING_START,
        (payload) => {
          if (config.onTyping) {
            config.onTyping(true, payload.payload?.userName);
          }
        }
      );
      unsubscribers.push(typingStartUnsubscriber);

      const typingStopUnsubscriber = subscribeToChannel(
        UNIFIED_CHANNELS.conversationTyping(config.organizationId, config.conversationId),
        UNIFIED_EVENTS.TYPING_STOP,
        (payload) => {
          if (config.onTyping) {
            config.onTyping(false, payload.payload?.userName);
          }
        }
      );
      unsubscribers.push(typingStopUnsubscriber);
    }

    return () => {
      console.log('[Widget Realtime] 🧹 Cleaning up message subscriptions');
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [config.conversationId, config.organizationId, config.onMessage, config.onTyping]);

  // Notify connection changes
  useEffect(() => {
    if (config.onConnectionChange) {
      config.onConnectionChange(realtimeState.isConnected);
    }
  }, [realtimeState.isConnected, config.onConnectionChange]);

  // Return compatibility interface
  return {
    isConnected: realtimeState.isConnected,
    connectionStatus: realtimeState.connectionStatus as ConnectionStatus,
    sendTypingIndicator: (isTyping: boolean) => {
      if (isTyping) {
        realtimeActions.startTyping();
      } else {
        realtimeActions.stopTyping();
      }
    },
    sendReadReceipt: (messageId: string) => {
      // Implement read receipt logic if needed
      console.log('[Widget Realtime] Read receipt for:', messageId);
    },
    disconnect: realtimeActions.disconnect,
    connect: realtimeActions.connect
  };
}

// PHASE 0 CRITICAL FIX: Old implementation removed to prevent conflicts
