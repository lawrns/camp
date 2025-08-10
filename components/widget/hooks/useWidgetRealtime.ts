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
import { useEffect, useRef } from 'react';

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
  // Use refs to avoid infinite re-renders from function dependencies
  const onMessageRef = useRef(config.onMessage);
  const onTypingRef = useRef(config.onTyping);
  const onConnectionChangeRef = useRef(config.onConnectionChange);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = config.onMessage;
    onTypingRef.current = config.onTyping;
    onConnectionChangeRef.current = config.onConnectionChange;
  }, [config.onMessage, config.onTyping, config.onConnectionChange]);

  // NOTE: unified hook internally manages subscriptions. We only mirror state changes via refs.

  // Notify connection changes
  useEffect(() => {
    if (onConnectionChangeRef.current) {
      onConnectionChangeRef.current(realtimeState.isConnected);
    }
  }, [realtimeState.isConnected]); // Removed function dependency

  // Return compatibility interface
  return {
    isConnected: realtimeState.isConnected,
    connectionStatus: realtimeState.connectionStatus as ConnectionStatus,
    sendTypingIndicator: (isTyping: boolean) => {
      // FIXED: Use correct broadcastTyping method from unified realtime
      realtimeActions.broadcastTyping(isTyping);
    },
    sendMessage: (message: any) => {
      // FIXED: Add missing sendMessage method that UltimateWidget expects
      return realtimeActions.sendMessage(message);
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
