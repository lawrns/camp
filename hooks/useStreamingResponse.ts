/**
 * useStreamingResponse Hook
 *
 * React hook for consuming real-time streaming AI responses.
 * Handles connection management, message updates, and typing indicators.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { StreamingMessage } from "@/lib/ai/StreamingResponseService";
import { createImprovedRealtimeClient } from "@/lib/supabase";

interface StreamingState {
  message: StreamingMessage | null;
  isStreaming: boolean;
  isTyping: boolean;
  error: Error | null;
  connectionState: "connecting" | "connected" | "disconnected" | "error";
}

interface UseStreamingResponseOptions {
  conversationId: string;
  organizationId: string;
  onMessageComplete?: (message: StreamingMessage) => void;
  onMessageUpdate?: (message: StreamingMessage) => void;
  onTypingChange?: (isTyping: boolean) => void;
  onError?: (error: Error) => void;
  autoConnect?: boolean;
}

export function useStreamingResponse(options: UseStreamingResponseOptions) {
  const {
    conversationId,
    organizationId,
    onMessageComplete,
    onMessageUpdate,
    onTypingChange,
    onError,
    autoConnect = true,
  } = options;

  const [state, setState] = useState<StreamingState>({
    message: null,
    isStreaming: false,
    isTyping: false,
    error: null,
    connectionState: "disconnected",
  });

  const realtimeClientRef = useRef(createImprovedRealtimeClient(organizationId));
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const channelNameRef = useRef(`conversation:${organizationId}:${conversationId}`);

  /**
   * Handle streaming message updates
   */
  const handleStreamingMessage = useCallback(
    (payload: any) => {
      const { messageId, content, isComplete, timestamp, metadata } = payload;

      const streamingMessage: StreamingMessage = {
        id: messageId,
        content,
        role: "assistant",
        isComplete,
        tokenCount: metadata?.tokensGenerated || 0,
        timestamp: new Date(timestamp),
        metadata,
      };

      setState((prev) => ({
        ...prev,
        message: streamingMessage,
        isStreaming: !isComplete,
        error: null,
      }));

      // Call appropriate callbacks
      if (isComplete) {
        onMessageComplete?.(streamingMessage);
      } else {
        onMessageUpdate?.(streamingMessage);
      }
    },
    [onMessageComplete, onMessageUpdate]
  );

  /**
   * Handle typing indicator updates
   */
  const handleTypingIndicator = useCallback(
    (payload: any) => {
      const { isTyping, senderType } = payload;

      // Only handle AI typing indicators
      if (senderType === "ai") {
        setState((prev) => ({
          ...prev,
          isTyping,
          error: null,
        }));

        onTypingChange?.(isTyping);
      }
    },
    [onTypingChange]
  );

  /**
   * Handle connection state changes
   */
  const handleConnectionChange = useCallback((connectionState: string) => {
    setState((prev) => ({
      ...prev,
      connectionState: connectionState as StreamingState["connectionState"],
    }));
  }, []);

  /**
   * Handle errors
   */
  const handleError = useCallback(
    (error: Error) => {
      setState((prev) => ({
        ...prev,
        error,
        isStreaming: false,
        isTyping: false,
        connectionState: "error",
      }));

      onError?.(error);
    },
    [onError]
  );

  /**
   * Connect to the streaming channel
   */
  const connect = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, connectionState: "connecting", error: null }));

      const callbacks = {
        onMessage: (message: any) => {
          if (message.event === "streaming_message") {
            handleStreamingMessage(message.payload);
          } else if (message.event === "typing_indicator") {
            handleTypingIndicator(message.payload);
          }
        },
        onError: handleError,
        onConnectionChange: handleConnectionChange,
        onReconnect: () => {
          setState((prev) => ({ ...prev, connectionState: "connected", error: null }));
        },
      };

      const channel = await realtimeClientRef.current.subscribe(channelNameRef.current, callbacks.onMessage);
      // Store the unsubscribe function instead of the channel
      unsubscribeRef.current = () => {
        if (channel && typeof channel.unsubscribe === "function") {
          channel.unsubscribe();
        }
      };

      setState((prev) => ({ ...prev, connectionState: "connected" }));
    } catch (error) {
      handleError(error instanceof Error ? error : new Error("Connection failed"));
    }
  }, [handleStreamingMessage, handleTypingIndicator, handleError, handleConnectionChange]);

  /**
   * Disconnect from the streaming channel
   */
  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      connectionState: "disconnected",
      isStreaming: false,
      isTyping: false,
    }));
  }, []);

  /**
   * Clear current message and reset state
   */
  const clearMessage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      message: null,
      isStreaming: false,
      isTyping: false,
      error: null,
    }));
  }, []);

  /**
   * Retry connection on error
   */
  const retry = useCallback(async () => {
    disconnect();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
    await connect();
  }, [disconnect, connect]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Reconnect when conversation or organization changes
  useEffect(() => {
    const newChannelName = `conversation:${organizationId}:${conversationId}`;

    if (newChannelName !== channelNameRef.current) {
      channelNameRef.current = newChannelName;

      if (state.connectionState === "connected") {
        disconnect();
        connect();
      }
    }
  }, [conversationId, organizationId, state.connectionState, disconnect, connect]);

  return {
    // State
    message: state.message,
    isStreaming: state.isStreaming,
    isTyping: state.isTyping,
    error: state.error,
    connectionState: state.connectionState,
    isConnected: state.connectionState === "connected",

    // Actions
    connect,
    disconnect,
    retry,
    clearMessage,

    // Utils
    hasActiveStream: state.isStreaming || state.isTyping,
    latestContent: state.message?.content || "",
    tokenCount: state.message?.tokenCount || 0,
  };
}

/**
 * Hook for managing multiple streaming conversations
 */
export function useMultiStreamingResponse() {
  const [streams] = useState(new Map<string, ReturnType<typeof useStreamingResponse>>());

  const getOrCreateStream = useCallback(
    (conversationId: string, organizationId: string, options?: Partial<UseStreamingResponseOptions>) => {
      const key = `${organizationId}:${conversationId}`;

      if (!streams.has(key)) {
        // This would need to be implemented differently in practice
        // as hooks can't be called conditionally. This is a conceptual example.
      }

      return streams.get(key);
    },
    [streams]
  );

  const removeStream = useCallback(
    (conversationId: string, organizationId: string) => {
      const key = `${organizationId}:${conversationId}`;
      const stream = streams.get(key);

      if (stream) {
        stream.disconnect();
        streams.delete(key);
      }
    },
    [streams]
  );

  const clearAllStreams = useCallback(() => {
    for (const stream of streams.values()) {
      stream.disconnect();
    }
    streams.clear();
  }, [streams]);

  return {
    getOrCreateStream,
    removeStream,
    clearAllStreams,
    activeStreams: streams.size,
    hasActiveStreams: Array.from(streams.values()).some((s) => s.hasActiveStream),
  };
}
