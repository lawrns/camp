"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { logWidgetEvent, logWidgetError } from '@/lib/monitoring/widget-logger';
import { WidgetMessage, SenderType } from '@/types/entities/message';
import { widgetDebugger } from '@/lib/utils/widget-debug';
import { realtimeConnectionMonitor } from '@/lib/monitoring/realtime-connection-monitor';

// ENHANCED CONNECTION MANAGEMENT CONSTANTS
const CONNECTION_TIMEOUT = 15000; // Reduced from 30s for faster feedback
const HEARTBEAT_INTERVAL = 25000; // Prevent 30s idle timeout
const MAX_RETRIES = 5; // Exponential backoff retry limit
const BACKOFF_BASE = 1000; // Base delay for exponential backoff
const PRE_CONNECTION_TIMEOUT = 5000; // WebSocket pre-check timeout

// Global channel memoization to prevent duplicates
const activeChannels = new Map<string, RealtimeChannel>();

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

// Enhanced connection status tracking
type ConnectionStatus = 'connecting' | 'connected' | 'error' | 'timeout' | 'retrying' | 'fallback';

interface ConnectionMetrics {
  connectionAttempts: number;
  successfulConnections: number;
  failedConnections: number;
  averageConnectionTime: number;
  lastConnectionTime: number | null;
  retryCount: number;
  fallbackActivated: boolean;
}

// UTILITY FUNCTIONS FOR ENHANCED CONNECTION MANAGEMENT

/**
 * Pre-connection WebSocket test to identify network issues early
 */
const testWebSocketConnection = (client: any): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      // Get WebSocket URL from Supabase realtime client
      const realtimeUrl = client.realtime.endpointURL || 
        `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('http', 'ws')}/realtime/v1/websocket`;
      
      const testWs = new WebSocket(realtimeUrl);
      
      const timeoutId = setTimeout(() => {
        testWs.close();
        reject(new Error('Pre-connection timeout'));
      }, PRE_CONNECTION_TIMEOUT);

      testWs.onopen = () => {
        clearTimeout(timeoutId);
        testWs.close();
        resolve(true);
      };

      testWs.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`WebSocket test failed: ${error}`));
      };
    } catch (error) {
      reject(new Error(`WebSocket test error: ${error}`));
    }
  });
};

/**
 * Ensure authentication session is valid before channel subscription
 * CRITICAL FIX: Enhanced authentication with proper error handling and token validation
 */
const ensureAuthSession = async (client: any, organizationId: string): Promise<string | null> => {
  try {
    widgetDebugger.logRealtime('info', '🔐 Checking authentication session...');

    const { data: { session }, error } = await client.auth.getSession();

    if (error) {
      widgetDebugger.logRealtime('warn', 'Auth session error, attempting anonymous sign-in', { error });

      // Clear any existing session first
      await client.auth.signOut();

      const { data: anonSession, error: anonError } = await client.auth.signInAnonymously({
        options: {
          data: {
            organization_id: organizationId,
            widget_session: true,
            visitor_id: `visitor_${Date.now()}`,
            source: "widget",
          },
        },
      });

      if (anonError) {
        widgetDebugger.logRealtime('error', 'Anonymous sign-in failed', anonError);
        throw anonError;
      }

      if (!anonSession.session?.access_token) {
        throw new Error('No access token received from anonymous sign-in');
      }

      widgetDebugger.logRealtime('info', '✅ Anonymous authentication successful');
      return anonSession.session.access_token;
    }

    if (!session?.access_token) {
      widgetDebugger.logRealtime('info', 'No session found, creating anonymous session');

      const { data: anonSession, error: anonError } = await client.auth.signInAnonymously({
        options: {
          data: {
            organization_id: organizationId,
            widget_session: true,
            visitor_id: `visitor_${Date.now()}`,
            source: "widget",
          },
        },
      });

      if (anonError) {
        widgetDebugger.logRealtime('error', 'Anonymous sign-in failed', anonError);
        throw anonError;
      }

      if (!anonSession.session?.access_token) {
        throw new Error('No access token received from anonymous sign-in');
      }

      widgetDebugger.logRealtime('info', '✅ Anonymous authentication successful');
      return anonSession.session.access_token;
    }

    // Validate existing token
    try {
      const tokenParts = session.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const now = Math.floor(Date.now() / 1000);

        if (payload.exp && payload.exp < now) {
          widgetDebugger.logRealtime('warn', 'Token expired, refreshing session');

          const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
          if (refreshError || !refreshData.session?.access_token) {
            throw new Error('Token refresh failed');
          }

          widgetDebugger.logRealtime('info', '✅ Token refreshed successfully');
          return refreshData.session.access_token;
        }
      }
    } catch (tokenError) {
      widgetDebugger.logRealtime('warn', 'Token validation failed, using existing token', tokenError);
    }

    widgetDebugger.logRealtime('info', '✅ Using existing valid session');
    return session.access_token;
  } catch (error) {
    widgetDebugger.logRealtime('error', 'Failed to ensure auth session', { error });
    throw error;
  }
};

export function useWidgetRealtime(config: WidgetRealtimeConfig) {
  // Enhanced state management
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState(config.conversationId);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  // Enhanced refs for connection management
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef<any>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializationPromiseRef = useRef<Promise<string> | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const isIntentionalDisconnectRef = useRef<boolean>(false);
  const connectionMetricsRef = useRef<ConnectionMetrics>({
    connectionAttempts: 0,
    successfulConnections: 0,
    failedConnections: 0,
    averageConnectionTime: 0,
    lastConnectionTime: null,
    retryCount: 0,
    fallbackActivated: false
  });

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
      id: String(supabaseMessage.id || Date.now()), // Convert to string as expected by WidgetMessage interface
      conversationId: String(supabaseMessage.conversation_id || ''),
      content: supabaseMessage.content || '',
      senderType,
      senderName: supabaseMessage.sender_name || 'Unknown',
      createdAt: supabaseMessage.created_at || new Date().toISOString(),
      status: (supabaseMessage.status as any) || 'sent',
    };
  }, []);

  // Initialize conversation if needed
  const initializeConversation = useCallback(async (): Promise<string> => {
    if (conversationId) {
      return conversationId;
    }

    if (initializationPromiseRef.current) {
      return initializationPromiseRef.current;
    }

    setIsInitializing(true);
    setInitializationError(null);

    const promise = (async () => {
      try {
        const headers = await config.getAuthHeaders?.() || {};
        const response = await fetch('/api/widget/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-organization-id': config.organizationId,
            ...headers,
          },
          body: JSON.stringify({
            organizationId: config.organizationId,
            visitorId: config.userId,
            customerName: 'Website Visitor',
            customerEmail: config.userId || 'anonymous@widget.com',
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to initialize conversation: ${response.status}`);
        }

        const data = await response.json();
        const newConversationId = data.conversation?.id || data.conversationId || data.id;

        if (!newConversationId) {
          throw new Error('No conversation ID returned from API');
        }

        setConversationId(newConversationId);
        return newConversationId;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setInitializationError(errorMessage);
        throw error;
      } finally {
        setIsInitializing(false);
        initializationPromiseRef.current = null;
      }
    })();

    initializationPromiseRef.current = promise;
    return promise;
  }, [conversationId, config.organizationId, config.userId, config.getAuthHeaders]);

  // ENHANCED CONNECTION MANAGEMENT FUNCTIONS

  /**
   * Start heartbeat to prevent idle timeouts
   */
  const startHeartbeat = useCallback((channel: RealtimeChannel) => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    heartbeatRef.current = setInterval(() => {
      if (channel.state === 'joined') {
        try {
          channel.send({
            type: 'broadcast',
            event: 'heartbeat',
            payload: { timestamp: Date.now() }
          });
          widgetDebugger.logRealtime('debug', '💓 Heartbeat sent', { 
            channelState: channel.state 
          });
        } catch (error) {
          widgetDebugger.logRealtime('warn', '💓 Heartbeat failed', { error });
        }
      }
    }, HEARTBEAT_INTERVAL);

    widgetDebugger.logRealtime('info', '💓 Heartbeat started', { 
      interval: HEARTBEAT_INTERVAL 
    });
  }, []);

  /**
   * Stop heartbeat
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
      widgetDebugger.logRealtime('info', '💓 Heartbeat stopped');
    }
  }, []);

  /**
   * Enhanced connection with retry logic and authentication gating
   */
  const connectWithRetry = useCallback(async (channelName: string, retryCount: number = 0): Promise<void> => {
    const startTime = Date.now();
    connectionMetricsRef.current.connectionAttempts++;

    // ENHANCED MONITORING: Track connection attempt
    realtimeConnectionMonitor.trackConnectionAttempt();

    try {
      // Pre-connection WebSocket test
      await testWebSocketConnection(supabaseRef.current);
      widgetDebugger.logRealtime('info', '✅ Pre-connection WebSocket test passed');

      // Ensure authentication with enhanced error handling
      const accessToken = await ensureAuthSession(supabaseRef.current, config.organizationId);
      if (accessToken) {
        // CRITICAL FIX: Set auth token before creating channel
        supabaseRef.current.realtime.setAuth(accessToken);
        widgetDebugger.logRealtime('info', '🔐 Authentication token set for realtime');

        // Wait a moment for auth to be processed
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        throw new Error('Failed to obtain access token for realtime connection');
      }

      // Check for existing channel and reuse if valid
      if (activeChannels.has(channelName)) {
        const existingChannel = activeChannels.get(channelName)!;
        if (existingChannel.state === 'joined') {
          channelRef.current = existingChannel;
          setIsConnected(true);
          setConnectionStatus('connected');
          startHeartbeat(existingChannel);
          connectionMetricsRef.current.successfulConnections++;
          widgetDebugger.logRealtime('info', '♻️ Reusing existing channel', { channelName });
          return;
        } else {
          // ROBUST CLEANUP: Use removeChannel for stale channels
          try {
            if (supabaseRef.current) {
              supabaseRef.current.removeChannel(existingChannel);
            } else {
              existingChannel.unsubscribe();
            }
          } catch (cleanupError) {
            widgetDebugger.logRealtime('warn', '⚠️ Stale channel cleanup error (ignoring)', cleanupError);
          }
          activeChannels.delete(channelName);
        }
      }

      // Create new channel with enhanced configuration
      const channel = supabaseRef.current.channel(channelName, {
        config: {
          presence: { key: accessToken ? 'authenticated' : 'anonymous' },
          broadcast: { self: true },
          postgres_changes: { enabled: true }
        }
      });

      activeChannels.set(channelName, channel);
      channelRef.current = channel;

      // Set up channel event handlers
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: any) => {
          widgetDebugger.logRealtime('info', '📨 Database change received', {
            event: payload.eventType,
            table: payload.table
          });

          if (payload.eventType === 'INSERT' && payload.new) {
            const message = convertToWidgetMessage(payload.new as SupabaseMessage);
            config.onMessage?.(message);
          }
        })
        .on('broadcast', { event: UNIFIED_EVENTS.MESSAGE_CREATED }, (payload: any) => {
          widgetDebugger.logRealtime('info', '📡 Broadcast message received', payload);
          if (payload.payload?.message) {
            const message = convertToWidgetMessage(payload.payload.message);
            config.onMessage?.(message);
          }
        })
        .on('broadcast', { event: UNIFIED_EVENTS.TYPING_START }, (payload: any) => {
          config.onTyping?.(true, payload.payload?.userName);
        })
        .on('broadcast', { event: UNIFIED_EVENTS.TYPING_STOP }, (payload: any) => {
          config.onTyping?.(false, payload.payload?.userName);
        });

      // Subscribe with robust timeout and enhanced error handling
      return new Promise<void>((resolve, reject) => {
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
            // ROBUST CLEANUP: Remove channel on error to prevent leaks
            try {
              if (supabaseRef.current && channel) {
                supabaseRef.current.removeChannel(channel);
              }
              activeChannels.delete(channelName);
            } catch (cleanupError) {
              widgetDebugger.logRealtime('warn', '⚠️ Error cleanup failed (ignoring)', cleanupError);
            }
            reject(error);
          }
        };

        const timeoutId = setTimeout(() => {
          rejectOnce(new Error(`Connection timeout after ${CONNECTION_TIMEOUT}ms`));
        }, CONNECTION_TIMEOUT);

        try {
          channel.subscribe((status: string) => {
            widgetDebugger.logRealtime('info', `🔄 Channel status: ${status}`, {
              channelName,
              retryCount,
              connectionTime: Date.now() - startTime
            });

            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              setConnectionStatus('connected');
              setConnectionError(null);
              startHeartbeat(channel);
              connectionMetricsRef.current.successfulConnections++;
              connectionMetricsRef.current.lastConnectionTime = Date.now() - startTime;
              connectionMetricsRef.current.retryCount = 0;

              // ENHANCED MONITORING: Track successful connection and state transition
              realtimeConnectionMonitor.trackConnectionSuccess();
              realtimeConnectionMonitor.trackStateTransition('connecting', 'connected');

              config.onConnectionChange?.(true);
              resolveOnce();
            } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
            connectionMetricsRef.current.failedConnections++;

            // ENHANCED MONITORING: Track state transition and failure
            realtimeConnectionMonitor.trackStateTransition('connecting', status.toLowerCase());

            if (retryCount < MAX_RETRIES) {
              const backoffDelay = BACKOFF_BASE * Math.pow(2, retryCount);
              setConnectionStatus('retrying');
              setConnectionError(`Connection failed, retrying in ${backoffDelay}ms...`);

              // ENHANCED MONITORING: Track connection failure with retry
              realtimeConnectionMonitor.trackConnectionFailure(`Status: ${status}`, true);

              widgetDebugger.logRealtime('warn', `🔄 Retrying connection (${retryCount + 1}/${MAX_RETRIES})`, {
                delay: backoffDelay,
                reason: status
              });

              retryTimeoutRef.current = setTimeout(() => {
                connectWithRetry(channelName, retryCount + 1).then(resolve).catch(reject);
              }, backoffDelay);
            } else {
              setConnectionStatus('fallback');
              setConnectionError('Real-time connection failed, using fallback mode');
              connectionMetricsRef.current.fallbackActivated = true;

              // ENHANCED MONITORING: Track final failure and fallback activation
              realtimeConnectionMonitor.trackConnectionFailure(`Status: ${status} - Max retries exceeded`, false);
              realtimeConnectionMonitor.trackFallbackActivation();
              realtimeConnectionMonitor.trackStateTransition(status.toLowerCase(), 'fallback');

              config.onConnectionChange?.(false);
              rejectOnce(new Error(`Connection failed after ${MAX_RETRIES} retries`));
            }
            }
          });
        } catch (subscribeError) {
          rejectOnce(new Error(`Subscription setup failed: ${subscribeError}`));
        }
      });

    } catch (error) {
      connectionMetricsRef.current.failedConnections++;
      widgetDebugger.logRealtime('error', '❌ Connection attempt failed', {
        error,
        retryCount,
        connectionTime: Date.now() - startTime
      });

      if (retryCount < MAX_RETRIES) {
        const backoffDelay = BACKOFF_BASE * Math.pow(2, retryCount);
        setConnectionStatus('retrying');
        setConnectionError(`Connection error, retrying in ${backoffDelay}ms...`);

        retryTimeoutRef.current = setTimeout(() => {
          connectWithRetry(channelName, retryCount + 1);
        }, backoffDelay);
      } else {
        setConnectionStatus('error');
        setConnectionError(error instanceof Error ? error.message : 'Connection failed');
        connectionMetricsRef.current.fallbackActivated = true;
        config.onConnectionChange?.(false);
        throw error;
      }
    }
  }, [config, convertToWidgetMessage, startHeartbeat]);

  // Send message to conversation
  const sendMessage = useCallback(async (content: string, senderType: SenderType = 'visitor') => {
    try {
      const activeConversationId = await initializeConversation();

      const headers = await config.getAuthHeaders?.() || {};
      const response = await fetch('/api/widget/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': config.organizationId,
          ...headers,
        },
        body: JSON.stringify({
          conversationId: activeConversationId,
          content,
          senderType,
          senderName: config.userId || 'Anonymous',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const messageData = await response.json();

      // CRITICAL FIX: Message sending should work even without real-time connection
      // Broadcast message to real-time channel if channel is available
      if (channelRef.current && isConnected) {
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
              organizationId: config.organizationId,
              conversationId: activeConversationId,
            },
          });
        } catch (broadcastError) {
          widgetDebugger.logRealtime('warn', 'Failed to broadcast message', broadcastError);
        }
      } else {
        widgetDebugger.logRealtime('warn', 'Real-time broadcast skipped', {
          hasChannel: !!channelRef.current,
          isConnected,
          reason: !channelRef.current ? 'No channel' : 'Not connected'
        });
        // Message was still sent successfully via API - real-time is optional
      }

      return messageData;
    } catch (error) {
      logWidgetError('Failed to send message', { error, organizationId: config.organizationId });
      throw error;
    }
  }, [config, initializeConversation, isConnected]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!channelRef.current || !isConnected) {
      return;
    }

    try {
      const activeConversationId = await initializeConversation();
      const event = isTyping ? UNIFIED_EVENTS.TYPING_START : UNIFIED_EVENTS.TYPING_STOP;

      await channelRef.current.send({
        type: 'broadcast',
        event,
        payload: {
          userId: config.userId || 'anonymous',
          userName: config.userId || 'Anonymous',
          source: 'widget',
          organizationId: config.organizationId,
          conversationId: activeConversationId,
        },
      });
    } catch (error) {
      widgetDebugger.logRealtime('warn', 'Failed to send typing indicator', error);
    }
  }, [config, initializeConversation, isConnected]);

  // Enhanced connect function using new connection management
  const connect = useCallback(async () => {
    if (!supabaseRef.current) {
      logWidgetError('Cannot connect: Supabase client not initialized');
      return;
    }

    // CRITICAL: Prevent duplicate connection attempts and thrashing
    if (isConnectingRef.current) {
      widgetDebugger.logRealtime('warn', '🔄 Connection already in progress, skipping duplicate attempt');
      return;
    }

    // PERFORMANCE: Check if we already have a healthy connection
    if (channelRef.current && connectionStatus === 'connected') {
      widgetDebugger.logRealtime('info', 'Already connected, skipping connection attempt');
      return;
    }

    // PERFORMANCE: Cleanup any existing connection first to prevent thrashing
    if (channelRef.current) {
      widgetDebugger.logRealtime('info', 'Cleaning up existing connection before reconnecting');
      try {
        await channelRef.current.unsubscribe();
      } catch (error) {
        widgetDebugger.logRealtime('warn', 'Error during connection cleanup', error);
      }
      channelRef.current = null;
    }

    isConnectingRef.current = true;
    setConnectionStatus('connecting');

    try {
      // Ensure we have a conversation
      const convId = await initializeConversation();
      if (!convId) {
        throw new Error('Failed to get conversation ID');
      }

      // Create channel name using unified naming convention
      const channelName = UNIFIED_CHANNELS.conversation(config.organizationId, convId);

      widgetDebugger.logRealtime('info', '🚀 Starting enhanced real-time connection', {
        channelName,
        organizationId: config.organizationId,
        conversationId: convId
      });

      // Simple connection for now - enhanced version will be added later
      const channel = supabaseRef.current.channel(channelName);
      channelRef.current = channel;

      // Set up basic event handlers
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const message = convertToWidgetMessage(payload.new as SupabaseMessage);
            config.onMessage?.(message);
          }
        })
        .on('broadcast', { event: UNIFIED_EVENTS.MESSAGE_CREATED }, (payload: any) => {
          if (payload.payload?.message) {
            const message = convertToWidgetMessage(payload.payload.message);
            config.onMessage?.(message);
          }
        });

      // Subscribe to channel with enhanced error handling
      channel.subscribe((status: string) => {
        widgetDebugger.logRealtime('info', `Channel status: ${status}`);

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionStatus('connected');
          setConnectionError(null);
          config.onConnectionChange?.(true);
          widgetDebugger.logRealtime('info', '✅ Successfully connected to realtime channel');
        } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
          setIsConnected(false);
          setConnectionStatus('error');
          setConnectionError(`Connection failed: ${status}`);
          config.onConnectionChange?.(false);
          widgetDebugger.logRealtime('warn', `❌ Connection closed: ${status}`);
        } else if (status === 'CHANNEL_ERROR') {
          // CRITICAL FIX: Handle errored state to prevent infinite reconnection loops
          setIsConnected(false);
          setConnectionStatus('error');
          setConnectionError('Channel error occurred');
          config.onConnectionChange?.(false);
          widgetDebugger.logRealtime('error', '❌ Channel error - stopping reconnection attempts');

          // Clean up the errored channel
          if (channelRef.current) {
            channelRef.current.unsubscribe();
            channelRef.current = null;
          }
        }
      });

      logWidgetEvent('widget_realtime_connect_success', {
        organizationId: config.organizationId,
        conversationId: convId
      });

    } catch (error) {
      widgetDebugger.logRealtime('error', '❌ Connection failed', { error });
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      config.onConnectionChange?.(false);

      logWidgetError('Widget realtime connection failed', {
        error,
        organizationId: config.organizationId
      });
    } finally {
      isConnectingRef.current = false;
    }
  }, [config, initializeConversation, convertToWidgetMessage]);

  // Disconnect from real-time with robust cleanup
  const disconnect = useCallback(async () => {
    if (channelRef.current) {
      try {
        widgetDebugger.logRealtime('info', '🔄 Disconnecting channel', {
          state: channelRef.current.state,
          topic: channelRef.current.topic
        });

        isIntentionalDisconnectRef.current = true; // Mark as intentional

        // ROBUST FIX: Use supabase.removeChannel() instead of channel.unsubscribe()
        // This prevents recursive unsubscribe loops as documented in Supabase best practices
        if (supabaseRef.current) {
          await supabaseRef.current.removeChannel(channelRef.current);
          widgetDebugger.logRealtime('info', '✅ Channel removed successfully using removeChannel()');
        } else {
          // Fallback to direct unsubscribe if supabase client not available
          widgetDebugger.logRealtime('warn', '⚠️ Using fallback unsubscribe method');
          await channelRef.current.unsubscribe();
        }

        isIntentionalDisconnectRef.current = false; // Reset flag
      } catch (disconnectError) {
        isIntentionalDisconnectRef.current = false; // Reset flag on error
        widgetDebugger.logRealtime('warn', '⚠️ Error during channel disconnect (ignoring)', {
          error: disconnectError,
          channelState: channelRef.current?.state,
          errorType: disconnectError instanceof Error ? disconnectError.name : 'Unknown'
        });

        // Force cleanup even if disconnect failed
        try {
          if (supabaseRef.current && channelRef.current) {
            supabaseRef.current.removeChannel(channelRef.current);
          }
        } catch (forceCleanupError) {
          widgetDebugger.logRealtime('warn', '⚠️ Force cleanup also failed (ignoring)', forceCleanupError);
        }
      }
      channelRef.current = null;
    }
    setIsConnected(false);
    config.onConnectionChange?.(false);
    stopHeartbeat();
  }, [config, stopHeartbeat]);

  // Auto-connect when component mounts
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    connectionError,
    conversationId,
    isInitializing,
    initializationError,
    sendMessage,
    sendTypingIndicator,
    connect,
    disconnect,
  };
}
