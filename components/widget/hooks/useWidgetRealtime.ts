"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '../../../lib/supabase/client';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '../../../lib/realtime/unified-channel-standards';
import { logWidgetEvent } from '../../../lib/monitoring/widget-logger';
import { WidgetMessage, MessageStatus } from '../../../types/entities/message';

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

interface SupabaseMessage {
  id: string;
  content: string;
  conversation_id: string;
  sender_type: 'visitor' | 'agent' | 'ai_assistant';
  sender_name?: string;
  sender_email?: string;
  created_at: string;
  updated_at?: string;
  status?: string;
  metadata?: any;
}

type ConnectionStatus = 'connecting' | 'connected' | 'error' | 'disconnected';

export function useWidgetRealtime(config: WidgetRealtimeConfig) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [conversationId, setConversationId] = useState(config.conversationId);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isIntentionalDisconnectRef = useRef<boolean>(false);

  // Initialize Supabase client
  useEffect(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
      logWidgetEvent('widget_supabase_client_initialized', {
        organizationId: config.organizationId,
        note: 'Widget client with unified auth - database ops via API',
      });
    }
  }, [config.organizationId]);

  // Convert Supabase message to Widget message format
  const convertMessage = useCallback((supabaseMessage: SupabaseMessage): WidgetMessage => {
    // Database IDs are UUIDs (strings) - no conversion needed
    return {
      id: supabaseMessage.id, // Keep as string (UUID)
      content: supabaseMessage.content,
      senderType: supabaseMessage.sender_type, // Fixed: use the actual sender_type value
      senderName: supabaseMessage.sender_name || 'Unknown',
      createdAt: supabaseMessage.created_at,
      status: (supabaseMessage.status as MessageStatus) || 'delivered',
      metadata: supabaseMessage.metadata || {},
      conversationId: supabaseMessage.conversation_id, // Keep as string (UUID)
      // Add required WidgetMessage fields
      organizationId: '', // Will be set from context
      updatedAt: supabaseMessage.updated_at || supabaseMessage.created_at
    };
  }, []);

  // Connect to real-time channels
  const connect = useCallback(async () => {
    if (!supabaseRef.current || !config.organizationId) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      logWidgetEvent('widget_realtime_connecting', { organizationId: config.organizationId });

      // Connect to organization channel for general updates
      const orgChannel = UNIFIED_CHANNELS.organization(config.organizationId);
      const orgChannelClient = supabaseRef.current.channel(orgChannel);

      // Connect to conversations channel for conversation list updates
      const conversationsChannel = UNIFIED_CHANNELS.conversations(config.organizationId);
      const conversationsChannelClient = supabaseRef.current.channel(conversationsChannel);

      // Connect to specific conversation channel if conversationId is provided
      let conversationChannelClient: RealtimeChannel | null = null;
      if (config.conversationId) {
        const convChannel = UNIFIED_CHANNELS.conversation(config.organizationId, config.conversationId);
        conversationChannelClient = supabaseRef.current.channel(convChannel);
      }

      // Subscribe to message events
      const subscribeToMessages = (channel: RealtimeChannel) => {
        channel
          .on('broadcast', { event: UNIFIED_EVENTS.MESSAGE_CREATED }, (payload) => {
            if (config.onMessage && payload.payload) {
              const message = convertMessage(payload.payload.message);
              config.onMessage(message);
            }
          })
          .on('broadcast', { event: UNIFIED_EVENTS.MESSAGE_UPDATED }, (payload) => {
            if (config.onMessageStatusUpdate && payload.payload) {
              config.onMessageStatusUpdate(payload.payload.messageId, payload.payload.status);
            }
          });
      };

      // Subscribe to typing events
      const subscribeToTyping = (channel: RealtimeChannel) => {
        channel
          .on('broadcast', { event: UNIFIED_EVENTS.TYPING_START }, (payload) => {
            if (config.onTyping && payload.payload) {
              config.onTyping(true, payload.payload.userName);
            }
          })
          .on('broadcast', { event: UNIFIED_EVENTS.TYPING_STOP }, (_payload) => {
            if (config.onTyping) {
              config.onTyping(false);
            }
          });
      };

      // Subscribe to all channels
      subscribeToMessages(orgChannelClient);
      subscribeToMessages(conversationsChannelClient);
      subscribeToTyping(orgChannelClient);
      subscribeToTyping(conversationsChannelClient);

      if (conversationChannelClient) {
        subscribeToMessages(conversationChannelClient);
        subscribeToTyping(conversationChannelClient);
      }

      // Subscribe to all channels
      await orgChannelClient.subscribe();
      await conversationsChannelClient.subscribe();

      if (conversationChannelClient && conversationChannelClient !== conversationsChannelClient) {
        await conversationChannelClient.subscribe();
      }

      // Store the main channel reference (conversation channel if available, otherwise org channel)
      channelRef.current = conversationChannelClient || orgChannelClient;

      setIsConnected(true);
      setConnectionStatus('connected');
      config.onConnectionChange?.(true);

      logWidgetEvent('widget_realtime_connected', { 
        organizationId: config.organizationId,
        conversationId: config.conversationId 
      });

    } catch (error) {
      console.error('[Widget Realtime] Connection error:', error);
      setConnectionStatus('error');
      config.onConnectionChange?.(false);
      logWidgetEvent('widget_realtime_connection_error', { 
        organizationId: config.organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Attempt to reconnect after delay
      if (!isIntentionalDisconnectRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    }
  }, [config.organizationId, config.conversationId, config.onMessage, config.onTyping, config.onConnectionChange, config.onMessageStatusUpdate, convertMessage]);

  // Disconnect from real-time channels
  const disconnect = useCallback(async () => {
    isIntentionalDisconnectRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (channelRef.current) {
      await channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    config.onConnectionChange?.(false);

    logWidgetEvent('widget_realtime_disconnected', { 
      organizationId: config.organizationId 
    });
  }, [config.organizationId, config.onConnectionChange]);

  // Send typing indicator using tRPC
  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!isConnected || !config.conversationId) {
      return;
    }

    try {
      // For now, use a simple console log until tRPC is properly configured
      console.log('[Widget Realtime] Typing indicator:', {
        conversationId: config.conversationId,
        userId: config.userId || 'visitor',
        organizationId: config.organizationId,
        isTyping
      });

      // TODO: Implement proper tRPC call when client is configured
      // const result = await api.widget.typingIndicators.mutate({...});
    } catch (error) {
      console.error('[Widget Realtime] Typing indicator error:', error);
    }
  }, [isConnected, config.conversationId, config.organizationId, config.userId]);

  // Send read receipt
  const sendReadReceipt = useCallback(async (messageId: string, status: 'read' | 'delivered' = 'read') => {
    if (!isConnected || !config.conversationId) {
      return;
    }

    try {
      const response = await fetch('/api/widget/read-receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': config.organizationId,
        },
        body: JSON.stringify({
          messageId,
          conversationId: config.conversationId,
          status
        }),
      });

      if (!response.ok) {
        console.error('[Widget Realtime] Failed to send read receipt');
      }
    } catch (error) {
      console.error('[Widget Realtime] Read receipt error:', error);
    }
  }, [isConnected, config.conversationId, config.organizationId]);

  // Connect on mount and when config changes
  useEffect(() => {
    if (config.organizationId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [config.organizationId, config.conversationId]);

  // Update conversationId when it changes
  useEffect(() => {
    if (config.conversationId !== conversationId) {
      setConversationId(config.conversationId);
      // Reconnect to new conversation channel
      if (isConnected) {
        disconnect().then(() => connect());
      }
    }
  }, [config.conversationId, conversationId, isConnected]);

  return {
    isConnected,
    connectionStatus,
    sendTypingIndicator,
    sendReadReceipt,
    disconnect,
    connect
  };
}