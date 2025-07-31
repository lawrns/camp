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
    if (!supabaseMessage) {
      throw new Error('Cannot convert undefined message to widget format');
    }

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
      content: supabaseMessage.content || '',
      senderType,
      senderName: supabaseMessage.sender_name || 'Unknown',
      createdAt: supabaseMessage.created_at || new Date().toISOString(),
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

      const messageData = await response.json();

      if (!messageData || !messageData.id) {
        widgetDebugger.logMessage('error', 'Invalid response from message API', { messageData });
        throw new Error('Invalid response from message API - missing message data');
      }

      widgetDebugger.logNetworkResponse('/api/widget/messages', response.status, { messageId: messageData.id });

      // Broadcast message to real-time channel if channel is available
      if (channelRef.current) {
        const channelName = UNIFIED_CHANNELS.conversation(config.organizationId, activeConversationId);
        widgetDebugger.logRealtime('info', 'Broadcasting message to channel', {
          channelName,
          messageId: messageData.id,
          event: UNIFIED_EVENTS.MESSAGE_CREATED
        });

        try {
          await channelRef.current.send({
            type: 'broadcast',
            event: UNIFIED_EVENTS.MESSAGE_CREATED,
            payload: {
              message: messageData,
              source: 'widget',
              timestamp: new Date().toISOString(),
            },
          });
          widgetDebugger.logRealtime('info', 'Message broadcast successful');
        } catch (broadcastError) {
          widgetDebugger.logRealtime('warn', 'Message broadcast failed', broadcastError);
          // Don't throw here - message was still sent successfully via API
        }
      } else {
        widgetDebugger.logRealtime('warn', 'No channel available for broadcast');
      }

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
  }, [conversationId, config.organizationId, config.userId, config.getAuthHeaders]);

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

        const responseData = await response.json();
        const newConversation = responseData?.conversation;

        if (!newConversation || !newConversation.id) {
          throw new Error('Invalid response from conversation API - missing conversation data');
        }

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

  // Connect to real-time channel with retry logic
  const connect = useCallback(async (retryAttempt: number = 0) => {
    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds

    if (!supabaseRef.current) {
      logWidgetError('Cannot connect: Supabase client not initialized');
      return;
    }

    try {
      widgetDebugger.logRealtime('info', `Starting real-time connection attempt ${retryAttempt + 1}/${maxRetries + 1}`);

      logWidgetEvent('widget_realtime_connect_start', {
        organizationId: config.organizationId,
        hasExistingConversation: !!conversationId,
        retryAttempt,
      });

      // Verify authentication before proceeding
      const { data: { session: authSession }, error: sessionError } = await supabaseRef.current.auth.getSession();

      widgetDebugger.logRealtime('info', 'Session check for real-time connection', {
        hasSession: !!authSession,
        hasAccessToken: !!authSession?.access_token,
        sessionError: sessionError?.message,
        userId: authSession?.user?.id,
        retryAttempt
      });

      if (sessionError || !authSession?.access_token) {
        throw new Error(`Authentication required for real-time connection: ${sessionError?.message || 'No session'}`);
      }

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

      // Verify authentication before subscribing with retry logic
      let session: any = null;
      let sessionAttempts = 0;
      const maxSessionAttempts = 5; // Increased attempts

      widgetDebugger.logRealtime('info', 'Starting session verification for real-time connection', {
        organizationId: config.organizationId,
        conversationId: convId
      });

      while (!session && sessionAttempts < maxSessionAttempts) {
        const { data: { session: currentSession }, error: sessionError } = await supabaseRef.current.auth.getSession();

        widgetDebugger.logRealtime('info', `Session check attempt ${sessionAttempts + 1}/${maxSessionAttempts}`, {
          hasSession: !!currentSession,
          hasAccessToken: !!currentSession?.access_token,
          sessionError: sessionError?.message,
          userId: currentSession?.user?.id,
          userEmail: currentSession?.user?.email,
          isWidgetSession: currentSession?.user?.user_metadata?.widget_session ||
                          currentSession?.user?.app_metadata?.provider === 'widget'
        });

        if (sessionError) {
          widgetDebugger.logRealtime('warn', `Session check attempt ${sessionAttempts + 1} failed`, { sessionError });
          sessionAttempts++;
          if (sessionAttempts < maxSessionAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay
            continue;
          } else {
            widgetDebugger.logRealtime('error', 'Failed to get valid session after retries', { sessionError });
            throw new Error(`Authentication failed after ${maxSessionAttempts} attempts: ${sessionError.message}`);
          }
        }

        if (!currentSession) {
          widgetDebugger.logRealtime('warn', `Session check attempt ${sessionAttempts + 1} returned null session`);
          sessionAttempts++;
          if (sessionAttempts < maxSessionAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay
            continue;
          } else {
            widgetDebugger.logRealtime('error', 'No valid session found after retries');
            throw new Error('Authentication required for real-time connection - no session found');
          }
        }

        // Validate session has required properties
        if (!currentSession.access_token) {
          widgetDebugger.logRealtime('warn', `Session check attempt ${sessionAttempts + 1} missing access token`);
          sessionAttempts++;
          if (sessionAttempts < maxSessionAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          } else {
            widgetDebugger.logRealtime('error', 'No valid access token found after retries');
            throw new Error('Authentication required for real-time connection - no access token');
          }
        }

        session = currentSession;
        break;
      }

      widgetDebugger.logRealtime('info', 'Session verified for real-time', {
        hasSession: !!session,
        userId: session.user?.id,
        sessionAttempts: sessionAttempts + 1,
        isWidgetSession: session.user?.user_metadata?.widget_session || session.user?.app_metadata?.provider === 'widget',
        tokenPreview: session.access_token?.substring(0, 20) + '...'
      });

      // CRITICAL: Set the access token before creating the channel
      if (session?.access_token) {
        // Debug JWT token structure
        try {
          const tokenParts = session.access_token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            widgetDebugger.logRealtime('info', '🔑 JWT Token Structure for WebSocket', {
              aud: payload.aud,
              iss: payload.iss,
              role: payload.role,
              exp: payload.exp,
              iat: payload.iat,
              sub: payload.sub,
              organization_id: payload.organization_id,
              user_metadata: payload.user_metadata,
              app_metadata: payload.app_metadata,
              isExpired: payload.exp < Math.floor(Date.now() / 1000),
              timeUntilExpiry: payload.exp - Math.floor(Date.now() / 1000),
              isAnonymous: payload.user_metadata?.is_anonymous || payload.app_metadata?.provider === 'anonymous'
            });

            // Check for potential issues
            if (payload.exp < Math.floor(Date.now() / 1000)) {
              widgetDebugger.logRealtime('error', '❌ JWT token is expired!', {
                expiredAt: new Date(payload.exp * 1000).toISOString(),
                currentTime: new Date().toISOString()
              });
            }

            if (payload.role !== 'anon' && payload.role !== 'authenticated') {
              widgetDebugger.logRealtime('warn', '⚠️ Unexpected JWT role', {
                role: payload.role,
                expected: ['anon', 'authenticated']
              });
            }
          }
        } catch (e) {
          widgetDebugger.logRealtime('warn', 'Failed to decode JWT for debugging', e);
        }

        // Update the client's auth token for WebSocket authentication
        try {
          await supabaseRef.current.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token || '',
          });

          widgetDebugger.logRealtime('info', '✅ Updated Supabase client session for WebSocket', {
            hasAccessToken: !!session.access_token,
            tokenPreview: session.access_token.substring(0, 20) + '...',
            sessionUpdated: true
          });
        } catch (sessionError) {
          widgetDebugger.logRealtime('error', '❌ Failed to update Supabase client session', {
            error: sessionError,
            hasAccessToken: !!session.access_token
          });
          throw new Error(`Failed to update session: ${sessionError}`);
        }
      } else {
        widgetDebugger.logRealtime('warn', '⚠️ No access token available for WebSocket authentication', {
          hasSession: !!session,
          sessionKeys: session ? Object.keys(session) : []
        });
      }

      // Create the channel with simplified configuration
      // CRITICAL: Remove problematic postgres_changes filter that might cause CLOSED status
      const channel = supabaseRef.current.channel(channelName, {
        config: {
          presence: { key: session?.user?.id || 'anonymous' },
          broadcast: { self: true },
          postgres_changes: { enabled: true }
          // REMOVED: organization_id filter that might conflict with RLS policies
        }
      });

      // Set up channel event listeners after channel creation
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
          try {
            if (!payload?.new) {
              widgetDebugger.logRealtime('warn', 'Received invalid message payload', payload);
              return;
            }

            const message = convertToWidgetMessage(payload.new);
            // Only handle messages not sent by this widget instance
            if (payload.new.metadata?.source !== 'widget' || payload.new.sender_type !== 'user') {
              config.onMessage?.(message);
              logWidgetEvent('widget_message_received', {
                messageId: message.id,
                senderType: message.senderType,
              });
            }
          } catch (error) {
            widgetDebugger.logRealtime('error', 'Error processing received message', error);
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
          try {
            if (!payload?.new || !payload?.old) {
              widgetDebugger.logRealtime('warn', 'Received invalid status update payload', payload);
              return;
            }

            if (payload.new.status !== payload.old.status) {
              config.onMessageStatusUpdate?.(payload.new.id, payload.new.status);
              logWidgetEvent('widget_message_status_updated', {
                messageId: payload.new.id,
                status: payload.new.status,
              });
            }
          } catch (error) {
            widgetDebugger.logRealtime('error', 'Error processing status update', error);
          }
        }
      );

      // Listen for broadcast events (typing, presence, etc.)
      channel.on('broadcast', { event: UNIFIED_EVENTS.TYPING_START }, (payload: any) => {
        try {
          if (!payload?.payload) {
            widgetDebugger.logRealtime('warn', 'Received invalid typing start payload', payload);
            return;
          }
          // Only show typing from agents, not from this widget
          if (payload.payload.source !== 'widget') {
            config.onTyping?.(true, payload.payload.userName);
          }
        } catch (error) {
          widgetDebugger.logRealtime('error', 'Error processing typing start', error);
        }
      });

      channel.on('broadcast', { event: UNIFIED_EVENTS.TYPING_STOP }, (payload: any) => {
        try {
          if (!payload?.payload) {
            widgetDebugger.logRealtime('warn', 'Received invalid typing stop payload', payload);
            return;
          }
          if (payload.payload.source !== 'widget') {
            config.onTyping?.(false, payload.payload.userName);
          }
        } catch (error) {
          widgetDebugger.logRealtime('error', 'Error processing typing stop', error);
        }
      });

      // Listen for message broadcasts (for immediate updates)
      channel.on('broadcast', { event: UNIFIED_EVENTS.MESSAGE_CREATED }, (payload: any) => {
        try {
          if (!payload?.payload) {
            widgetDebugger.logRealtime('warn', 'Received invalid broadcast payload', payload);
            return;
          }

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
        } catch (error) {
          widgetDebugger.logRealtime('error', 'Error processing message broadcast', error);
        }
      });

      // Subscribe to channel with improved error handling
      widgetDebugger.logRealtime('info', 'Subscribing to channel', {
        channelName,
        organizationId: config.organizationId,
        conversationId: convId,
        sessionUserId: session.user?.id,
        timestamp: new Date().toISOString()
      });
      widgetDebugger.updateWebSocketStatus('connecting');

      const subscriptionPromise = new Promise<void>((resolve, reject) => {
        let timeoutId: NodeJS.Timeout;
        let isResolved = false;

        const cleanup = () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        };

        const resolveOnce = () => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            resolve();
          }
        };

        const rejectOnce = (error: Error) => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            reject(error);
          }
        };

        // Increased timeout to 30 seconds for better reliability
        timeoutId = setTimeout(() => {
          widgetDebugger.logRealtime('error', 'Channel subscription timeout after 30 seconds', {
            channelName,
            sessionUserId: session?.user?.id,
            organizationId: config.organizationId
          });
          rejectOnce(new Error('Channel subscription timeout after 30 seconds'));
        }, 30000);

        try {
          // Add WebSocket connection monitoring
          const realtimeClient = supabaseRef.current.realtime;

          widgetDebugger.logRealtime('info', 'WebSocket connection status before subscription', {
            isConnected: realtimeClient.isConnected(),
            connectionState: realtimeClient.connectionState(),
            channels: realtimeClient.channels.length,
            endpointURL: realtimeClient.endpointURL
          });

          channel.subscribe((status: string) => {
            const connected = status === 'SUBSCRIBED';

            // Enhanced debugging for channel status changes
            widgetDebugger.logRealtime('info', `🔄 Channel subscription status: ${status}`, {
              connected,
              channelName,
              timestamp: new Date().toISOString(),
              wsConnected: realtimeClient.isConnected(),
              wsState: realtimeClient.connectionState(),
              channelState: channel.state,
              sessionUserId: session?.user?.id,
              organizationId: config.organizationId
            });

            // Log all possible status values for debugging
            if (status === 'JOINING') {
              widgetDebugger.logRealtime('info', '🔄 Channel joining...', { channelName });
            } else if (status === 'JOINED') {
              widgetDebugger.logRealtime('info', '✅ Channel joined successfully', { channelName });
            } else if (connected) {
              widgetDebugger.updateWebSocketStatus('connected');
              widgetDebugger.logRealtime('info', '🎉 Channel subscription successful', {
                channelName,
                wsConnected: realtimeClient.isConnected(),
                finalState: channel.state
              });
              resolveOnce();
            } else if (status === 'CHANNEL_ERROR') {
              widgetDebugger.updateWebSocketStatus('error');
              widgetDebugger.logRealtime('error', '❌ Channel subscription failed with CHANNEL_ERROR', {
                channelName,
                wsConnected: realtimeClient.isConnected(),
                wsState: realtimeClient.connectionState(),
                channelState: channel.state,
                lastError: realtimeClient.lastError,
                sessionInfo: {
                  hasSession: !!session,
                  hasAccessToken: !!session?.access_token,
                  userId: session?.user?.id
                }
              });
              rejectOnce(new Error(`Channel subscription failed: CHANNEL_ERROR`));
            } else if (status === 'CLOSED') {
              widgetDebugger.updateWebSocketStatus('error');
              widgetDebugger.logRealtime('error', '❌ Channel subscription failed with CLOSED status', {
                channelName,
                wsConnected: realtimeClient.isConnected(),
                wsState: realtimeClient.connectionState(),
                channelState: channel.state,
                lastError: realtimeClient.lastError,
                possibleCauses: [
                  'RLS policy blocking access',
                  'Invalid JWT token',
                  'WebSocket authentication failure',
                  'Channel configuration issue',
                  'Database permission denied'
                ],
                sessionInfo: {
                  hasSession: !!session,
                  hasAccessToken: !!session?.access_token,
                  userId: session?.user?.id,
                  role: session?.user?.role,
                  isAnonymous: session?.user?.is_anonymous
                }
              });
              rejectOnce(new Error(`Channel subscription failed: CLOSED - Check RLS policies and authentication`));
            } else if (status === 'TIMED_OUT') {
              widgetDebugger.updateWebSocketStatus('error');
              widgetDebugger.logRealtime('error', '⏰ Channel subscription timed out', {
                channelName,
                timeout: '30 seconds'
              });
              rejectOnce(new Error('Channel subscription timed out'));
            } else {
              // Log any other status for debugging
              widgetDebugger.logRealtime('info', `🔍 Unknown channel status: ${status}`, {
                channelName,
                status,
                channelState: channel.state
              });
            }

            setIsConnected(connected);
            config.onConnectionChange?.(connected);

            logWidgetEvent('widget_realtime_connection_change', {
              status,
              connected,
              channelName,
              timestamp: new Date().toISOString(),
            });
          });
        } catch (subscribeError) {
          widgetDebugger.logRealtime('error', 'Error during channel subscription', subscribeError);
          rejectOnce(new Error(`Subscription error: ${subscribeError}`));
        }
      });

      await subscriptionPromise;

      channelRef.current = channel;

      widgetDebugger.logRealtime('info', 'Real-time connection established successfully');
      logWidgetEvent('widget_realtime_connected', {
        conversationId: convId,
        channelName,
      });

    } catch (error) {
      widgetDebugger.logRealtime('error', `Real-time connection attempt ${retryAttempt + 1} failed`, error);

      // Retry logic with exponential backoff
      if (retryAttempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryAttempt); // Exponential backoff
        widgetDebugger.logRealtime('info', `Retrying connection in ${delay}ms (attempt ${retryAttempt + 2}/${maxRetries + 1})`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return connect(retryAttempt + 1);
      }

      // All retries exhausted
      widgetDebugger.logRealtime('error', 'All connection attempts failed', {
        totalAttempts: maxRetries + 1,
        finalError: error
      });
      logWidgetError('Failed to connect to real-time after retries', {
        error,
        attempts: maxRetries + 1
      });
      setIsConnected(false);
      config.onConnectionChange?.(false);
      throw error;
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
