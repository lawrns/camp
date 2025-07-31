"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { REALTIME_EVENTS } from '@/lib/realtime/constants';
import { logWidgetEvent, logWidgetError } from '@/lib/monitoring/widget-logger';
import { WidgetMessage, SenderType } from '@/types/entities/message';
import { widgetDebugger } from '@/lib/utils/widget-debug';

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

export function useWidgetRealtime(config: WidgetRealtimeConfig) {
  const [isConnected, setIsConnected] = useState(false);
  const [conversationId, setConversationId] = useState(config.conversationId);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const supabaseRef = useRef<any>(null);
  const initializationPromiseRef = useRef<Promise<string> | null>(null);

  // Initialize Supabase client for real-time only (not for database operations)
  useEffect(() => {
    if (!supabaseRef.current) {
      // Use the widget-specific client with unified authentication
      widgetDebugger.logSupabase('info', 'Initializing widget Supabase client');
      widgetDebugger.updateSupabaseStatus('initializing');

      supabaseRef.current = supabase.widget();

      widgetDebugger.logSupabase('info', 'Widget Supabase client initialized successfully');
      widgetDebugger.updateSupabaseStatus('connected');

      logWidgetEvent('widget_supabase_client_initialized', {
        organizationId: config.organizationId,
        note: 'Widget client with unified auth - database ops via API',
      });
    }
  }, [config.organizationId]);

  // Convert Supabase message to Widget message format
  const convertToWidgetMessage = useCallback((supabaseMessage: SupabaseMessage): WidgetMessage => {
    // Map database sender types to widget types
    let senderType: SenderType;
    switch (supabaseMessage.sender_type) {
      case 'visitor':
        senderType = 'visitor';
        break;
      case 'agent':
        senderType = 'agent';
        break;
      case 'ai_assistant':
        senderType = 'ai_assistant';
        break;
      default:
        senderType = 'system';
    }

    return {
      id: parseInt(supabaseMessage.id) || Date.now(), // Convert to number as expected by Message interface
      conversationId: parseInt(supabaseMessage.conversation_id) || 0,
      content: supabaseMessage.content,
      senderType,
      senderName: supabaseMessage.sender_name || 'Unknown',
      createdAt: supabaseMessage.created_at,
      status: (supabaseMessage.status as any) || 'sent',
    };
  }, []);

  // Send message to conversation
  const sendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!supabaseRef.current) {
      widgetDebugger.logError('Supabase client not initialized', null, 'Messages');
      throw new Error('Supabase client not initialized');
    }

    widgetDebugger.logMessage('info', 'Starting message send process', {
      content: content.substring(0, 50) + '...',
      hasAttachments: (attachments?.length || 0) > 0
    });

    // Ensure conversation is initialized before sending
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      widgetDebugger.logMessage('info', 'No conversation ID, initializing...');
      if (initializationPromiseRef.current) {
        // Wait for ongoing initialization
        widgetDebugger.logMessage('debug', 'Waiting for ongoing initialization');
        activeConversationId = await initializationPromiseRef.current;
      } else {
        // Start new initialization
        widgetDebugger.logMessage('debug', 'Starting new conversation initialization');
        activeConversationId = await initializeConversation();
      }
    }

    if (!activeConversationId) {
      widgetDebugger.logError('Failed to initialize conversation', null, 'Messages');
      throw new Error('Failed to initialize conversation');
    }

    widgetDebugger.logMessage('info', 'Using conversation ID', { conversationId: activeConversationId });

    try {
      logWidgetEvent('widget_message_send_attempt', {
        conversationId,
        contentLength: content.length,
        hasAttachments: (attachments?.length || 0) > 0,
      });

      // Get authorization headers from auth hook
      const authHeaders = config.getAuthHeaders ? await config.getAuthHeaders() : {};
      widgetDebugger.logMessage('debug', 'Got auth headers', {
        hasHeaders: Object.keys(authHeaders).length > 0,
        headerKeys: Object.keys(authHeaders)
      });

      const requestData = {
        conversationId: activeConversationId,
        content,
        senderName: 'Website Visitor',
        senderEmail: 'visitor@widget.com',
        senderType: 'customer', // API maps this to 'visitor'
      };

      widgetDebugger.logNetworkRequest('/api/widget/messages', 'POST', {
        ...authHeaders,
        'x-organization-id': config.organizationId,
      }, requestData);

      // Insert message via API endpoint (bypasses RLS issues)
      const response = await fetch('/api/widget/messages', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'x-organization-id': config.organizationId,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        widgetDebugger.logNetworkResponse('/api/widget/messages', response.status, null, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const { message: messageData } = await response.json();
      widgetDebugger.logNetworkResponse('/api/widget/messages', response.status, { messageId: messageData.id });

      // Broadcast message to real-time channel
      const channelName = UNIFIED_CHANNELS.conversation(config.organizationId, activeConversationId);
      widgetDebugger.logRealtime('info', 'Broadcasting message to channel', {
        channelName,
        messageId: messageData.id,
        event: UNIFIED_EVENTS.MESSAGE_CREATED
      });

      await channelRef.current?.send({
        type: 'broadcast',
        event: UNIFIED_EVENTS.MESSAGE_CREATED,
        payload: {
          message: messageData,
          source: 'widget',
          timestamp: new Date().toISOString(),
        },
      });

      widgetDebugger.updateMessageSent();
      logWidgetEvent('widget_message_sent_success', {
        messageId: messageData.id,
        conversationId: activeConversationId,
      });

      return messageData;
    } catch (error) {
      widgetDebugger.logMessage('error', 'Message send failed', error);
      logWidgetError('Failed to send widget message', { error, conversationId });
      throw error;
    }
  }, [conversationId, config.organizationId, config.userId]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!channelRef.current || !conversationId) return;

    try {
      const event = isTyping ? UNIFIED_EVENTS.TYPING_START : UNIFIED_EVENTS.TYPING_STOP;
      await channelRef.current.send({
        type: 'broadcast',
        event,
        payload: {
          userId: config.userId || 'anonymous',
          userName: 'Visitor',
          conversationId,
          timestamp: new Date().toISOString(),
          source: 'widget',
        },
      });

      logWidgetEvent('widget_typing_sent', { isTyping, conversationId });
    } catch (error) {
      logWidgetError('Failed to send typing indicator', { error, isTyping });
    }
  }, [conversationId, config.userId]);

  // Initialize or create conversation
  const initializeConversation = useCallback(async (): Promise<string> => {
    if (!supabaseRef.current) {
      throw new Error('Supabase client not initialized');
    }

    // If already initializing, wait for that promise
    if (initializationPromiseRef.current) {
      return initializationPromiseRef.current;
    }

    // If conversation already exists, return it
    if (conversationId) {
      return conversationId;
    }

    // Start initialization
    setIsInitializing(true);
    setInitializationError(null);

    const initPromise = (async () => {
      try {
        logWidgetEvent('widget_conversation_init_start', {
          organizationId: config.organizationId,
          userId: config.userId,
        });

        // Create new conversation via API endpoint
        const response = await fetch('/api/widget/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organizationId: config.organizationId,
            visitorId: config.userId || 'anonymous',
            customerName: 'Website Visitor',
            customerEmail: 'visitor@widget.com',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const { conversation: newConversation } = await response.json();

        setConversationId(newConversation.id);
        setIsInitializing(false);

        logWidgetEvent('widget_conversation_created', {
          conversationId: newConversation.id,
          organizationId: config.organizationId,
        });

        return newConversation.id;
      } catch (error) {
        setIsInitializing(false);
        setInitializationError(error instanceof Error ? error.message : 'Unknown error');
        logWidgetError('Failed to initialize conversation', { error });
        throw error;
      } finally {
        initializationPromiseRef.current = null;
      }
    })();

    initializationPromiseRef.current = initPromise;
    return initPromise;
  }, [conversationId, config.organizationId, config.userId]);

  // Connect to real-time channel
  const connect = useCallback(async () => {
    if (!supabaseRef.current) {
      logWidgetError('Cannot connect: Supabase client not initialized');
      return;
    }

    try {
      logWidgetEvent('widget_realtime_connect_start', {
        organizationId: config.organizationId,
        hasExistingConversation: !!conversationId,
      });

      // Ensure we have a conversation
      const convId = await initializeConversation();
      if (!convId) {
        throw new Error('Failed to get conversation ID');
      }

      // Disconnect existing channel
      if (channelRef.current) {
        await channelRef.current.unsubscribe();
      }

      // Create new channel using unified naming convention
      const channelName = UNIFIED_CHANNELS.conversation(config.organizationId, convId);
      const channel = supabaseRef.current.channel(channelName);

      // Listen for new messages from database
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload: any) => {
          const message = convertToWidgetMessage(payload.new);
          // Only handle messages not sent by this widget instance
          if (payload.new.metadata?.source !== 'widget' || payload.new.sender_type !== 'user') {
            config.onMessage?.(message);
            logWidgetEvent('widget_message_received', {
              messageId: message.id,
              senderType: message.senderType,
            });
          }
        }
      );

      // Listen for message status updates
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload: any) => {
          if (payload.new.status !== payload.old.status) {
            config.onMessageStatusUpdate?.(payload.new.id, payload.new.status);
            logWidgetEvent('widget_message_status_updated', {
              messageId: payload.new.id,
              status: payload.new.status,
            });
          }
        }
      );

      // Listen for broadcast events (typing, presence, etc.)
      channel.on('broadcast', { event: UNIFIED_EVENTS.TYPING_START }, (payload: any) => {
        // Only show typing from agents, not from this widget
        if (payload.payload.source !== 'widget') {
          config.onTyping?.(true, payload.payload.userName);
        }
      });

      channel.on('broadcast', { event: UNIFIED_EVENTS.TYPING_STOP }, (payload: any) => {
        if (payload.payload.source !== 'widget') {
          config.onTyping?.(false, payload.payload.userName);
        }
      });

      // Listen for message broadcasts (for immediate updates)
      channel.on('broadcast', { event: UNIFIED_EVENTS.MESSAGE_CREATED }, (payload: any) => {
        widgetDebugger.logRealtime('info', 'Received message broadcast', {
          source: payload.payload.source,
          hasMessage: !!payload.payload.message,
          messageId: payload.payload.message?.id
        });

        if (payload.payload.source !== 'widget' && payload.payload.message) {
          const message = convertToWidgetMessage(payload.payload.message);
          widgetDebugger.updateMessageReceived();
          config.onMessage?.(message);
        }
      });

      // Subscribe to channel
      widgetDebugger.logRealtime('info', 'Subscribing to channel', { channelName });
      widgetDebugger.updateWebSocketStatus('connecting');

      await channel.subscribe((status: string) => {
        const connected = status === 'SUBSCRIBED';
        widgetDebugger.logRealtime('info', `Channel subscription status: ${status}`, { connected });

        if (connected) {
          widgetDebugger.updateWebSocketStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          widgetDebugger.updateWebSocketStatus('error');
        }

        setIsConnected(connected);
        config.onConnectionChange?.(connected);

        logWidgetEvent('widget_realtime_connection_change', {
          status,
          connected,
          channelName,
        });
      });

      channelRef.current = channel;
      
      logWidgetEvent('widget_realtime_connected', {
        conversationId: convId,
        channelName,
      });

    } catch (error) {
      logWidgetError('Failed to connect to real-time', { error });
      setIsConnected(false);
      config.onConnectionChange?.(false);
    }
  }, [config.organizationId, conversationId, initializeConversation, convertToWidgetMessage]);

  // Disconnect from real-time
  const disconnect = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    setIsConnected(false);
    config.onConnectionChange?.(false);
    
    logWidgetEvent('widget_realtime_disconnected', {
      conversationId,
    });
  }, [conversationId]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, []); // Remove dependencies to prevent infinite loop

  // Update conversation ID when config changes
  useEffect(() => {
    if (config.conversationId !== conversationId) {
      setConversationId(config.conversationId);
      if (config.conversationId) {
        connect();
      }
    }
  }, [config.conversationId, conversationId]); // Remove connect dependency

  return {
    isConnected,
    conversationId,
    isInitializing,
    initializationError,
    sendMessage,
    sendTypingIndicator,
    connect,
    disconnect,
  };
}
