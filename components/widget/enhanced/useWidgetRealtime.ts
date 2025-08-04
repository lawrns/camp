"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UNIFIED_CHANNELS, UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { logWidgetEvent, logWidgetError } from '@/lib/monitoring/widget-logger';
import { WidgetMessage, SenderType } from '@/types/entities/message';
import type { User } from '../design-system/types';
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
  senderType: 'visitor' | 'agent' | 'ai_assistant';
  sender_name?: string;
  sender_email?: string;
  created_at: string;
  updated_at?: string;
  status?: string;
  metadata?: unknown;
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
const testWebSocketConnection = (client: unknown): Promise<boolean> => {
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
const ensureAuthSession = async (client: unknown, organizationId: string): Promise<string | null> => {
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
  // CRITICAL FIX: Remove internal conversationId state to prevent desynchronization
  // Use config.conversationId directly instead
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
    switch (supabaseMessage.senderType) {
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
      senderName: supabaseMessage.senderName || 'Unknown',
      createdAt: supabaseMessage.created_at || new Date().toISOString(),
      status: (supabaseMessage.status as unknown) || 'sent',
    };
  }, []);

  // Initialize conversation if needed
  const initializeConversation = useCallback(async (): Promise<string> => {
    // CRITICAL FIX: Always use provided conversationId if available
    if (config.conversationId) {
      widgetDebugger.logRealtime('info', '✅ Using provided conversation ID', { conversationId: config.conversationId });
      return config.conversationId;
    }

    // CRITICAL FIX: If no conversation ID provided, return empty string and let UltimateWidget handle auth
    widgetDebugger.logRealtime('warn', '⚠️ No conversation ID provided - UltimateWidget should handle auth first');
    return '';
  }, [config.conversationId, config.organizationId, config.userId, config.getAuthHeaders]);

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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: unknown) => {
          widgetDebugger.logRealtime('info', '📨 Database change received', {
            event: payload.eventType,
            table: payload.table
          });

          if (payload.eventType === 'INSERT' && payload.new) {
            const message = convertToWidgetMessage(payload.new as SupabaseMessage);
            config.onMessage?.(message);
          }
        })
        .on('broadcast', { event: UNIFIED_EVENTS.MESSAGE_CREATED }, (payload: unknown) => {
          console.log('🚨 [WIDGET BROADCAST] MESSAGE_CREATED event received!', {
            event: UNIFIED_EVENTS.MESSAGE_CREATED,
            payload: payload,
            hasMessage: !!payload.payload?.message,
            messageContent: payload.payload?.message?.content,
            senderType: payload.payload?.message?.senderType,
            timestamp: new Date().toISOString()
          });

          widgetDebugger.logRealtime('info', '📡 Broadcast message received', payload);

          if (payload.payload?.message) {
            const message = convertToWidgetMessage(payload.payload.message);
            console.log('🚨 [WIDGET BROADCAST] Converting and processing message:', {
              originalMessage: payload.payload.message,
              convertedMessage: message,
              willCallOnMessage: !!config.onMessage
            });
            // CRITICAL: Ensure UI update happens
            if (config.onMessage) {
              config.onMessage(message);
              console.log('🚨 [WIDGET BROADCAST] ✅ Message processed and UI callback triggered');

              // Additional UI update verification
              setTimeout(() => {
                console.log('🚨 [WIDGET UI DEBUG] Verifying UI update after broadcast reception');
              }, 100);
            } else {
              console.log('🚨 [WIDGET BROADCAST] ❌ No onMessage callback available for UI update');
            }
          } else {
            console.log('🚨 [WIDGET BROADCAST] ❌ No message in payload:', payload);
          }
        })
        .on('broadcast', { event: UNIFIED_EVENTS.TYPING_START }, (payload: unknown) => {
          config.onTyping?.(true, payload.payload?.userName);
        })
        .on('broadcast', { event: UNIFIED_EVENTS.TYPING_STOP }, (payload: unknown) => {
          config.onTyping?.(false, payload.payload?.userName);
        });

      // Add global broadcast listener for debugging ALL events
      channel.on('broadcast', { event: '*' }, (payload: unknown) => {
        console.log('🚨 [WIDGET DEBUG] ALL BROADCAST EVENTS received:', {
          event: payload.event,
          type: payload.type,
          payload: payload.payload,
          channelName,
          timestamp: new Date().toISOString()
        });

        // Store logs globally for test access
        if (typeof window !== 'undefined') {
          (window as unknown).widgetBroadcastLogs = (window as unknown).widgetBroadcastLogs || [];
          (window as unknown).widgetBroadcastLogs.push({
            event: payload.event,
            payload: payload.payload,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Subscribe with robust timeout and enhanced error handling
      console.log('🚨 [WIDGET SUBSCRIPTION] Subscribing to channel:', {
        channelName,
        events: [UNIFIED_EVENTS.MESSAGE_CREATED, UNIFIED_EVENTS.TYPING_START, UNIFIED_EVENTS.TYPING_STOP],
        timestamp: new Date().toISOString()
      });

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
      // CRITICAL FIX: Use provided conversation ID instead of creating new one
      const activeConversationId = config.conversationId;
      if (!activeConversationId) {
        throw new Error('No conversation ID available - UltimateWidget must authenticate first');
      }

      widgetDebugger.logRealtime('info', '📤 Sending message via API:', {
        conversationId: activeConversationId,
        content: content.substring(0, 50) + '...',
        senderType
      });

      const headers = await config.getAuthHeaders?.() || {};
      const response = await fetch('/api/widget/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': config.organizationId, // Use capital X for consistency
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
      // CRITICAL FIX: Use provided conversation ID instead of creating new one
      const convId = config.conversationId;
      if (!convId) {
        widgetDebugger.logRealtime('warn', '⏳ No conversation ID provided - waiting for UltimateWidget auth');
        setConnectionStatus('disconnected');
        isConnectingRef.current = false;
        return;
      }

      widgetDebugger.logRealtime('info', '✅ Using conversation ID from UltimateWidget:', { conversationId: convId });

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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: unknown) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const message = convertToWidgetMessage(payload.new as SupabaseMessage);
            config.onMessage?.(message);
          }
        })
        .on('broadcast', { event: '*' }, (payload: unknown) => {
          console.log('🚨 [WIDGET SIMPLE DEBUG] ALL BROADCAST EVENTS received:', {
            event: payload.event,
            type: payload.type,
            payload: payload.payload,
            channelName,
            timestamp: new Date().toISOString()
          });
        })
        .on('broadcast', { event: UNIFIED_EVENTS.MESSAGE_CREATED }, (payload: unknown) => {
          console.log('🚨 [WIDGET BROADCAST ORG] MESSAGE_CREATED event received on org channel!', {
            event: UNIFIED_EVENTS.MESSAGE_CREATED,
            payload: payload,
            hasMessage: !!payload.payload?.message,
            messageContent: payload.payload?.message?.content,
            senderType: payload.payload?.message?.senderType,
            timestamp: new Date().toISOString()
          });

          if (payload.payload?.message) {
            const message = convertToWidgetMessage(payload.payload.message);
            console.log('🚨 [WIDGET BROADCAST ORG] Converting and processing message:', {
              originalMessage: payload.payload.message,
              convertedMessage: message,
              willCallOnMessage: !!config.onMessage
            });
            // CRITICAL: Ensure UI update happens on org channel
            if (config.onMessage) {
              config.onMessage(message);
              console.log('🚨 [WIDGET BROADCAST ORG] ✅ Message processed and UI callback triggered');

              // Additional UI update verification
              setTimeout(() => {
                console.log('🚨 [WIDGET ORG UI DEBUG] Verifying UI update after org broadcast reception');
              }, 100);
            } else {
              console.log('🚨 [WIDGET BROADCAST ORG] ❌ No onMessage callback available for UI update');
            }
          } else {
            console.log('🚨 [WIDGET BROADCAST ORG] ❌ No message in payload:', payload);
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
          setConnectionStatus('fallback');
          setConnectionError('Channel error - using fallback mode');
          config.onConnectionChange?.(false);
          widgetDebugger.logRealtime('warn', '⚠️ Channel error - switching to fallback mode');

          // Clean up the errored channel using safe method
          if (channelRef.current) {
            try {
              // Use removeChannel instead of unsubscribe to prevent recursive calls
              if (supabaseRef.current) {
                supabaseRef.current.removeChannel(channelRef.current);
              }
            } catch (cleanupError) {
              widgetDebugger.logRealtime('warn', '⚠️ Channel cleanup error (ignoring)', cleanupError);
            }
            channelRef.current = null;
          }

          // Don't throw error, just continue in fallback mode
          connectionMetricsRef.current.fallbackActivated = true;
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

  // Auto-connect removed - UltimateWidget controls connection timing explicitly
  // This prevents the dependency loop where auto-connect triggers on every config change

  return {
    isConnected,
    connectionStatus,
    connectionError,
    conversationId: config.conversationId, // Use config.conversationId directly
    isInitializing,
    initializationError,
    sendMessage,
    sendTypingIndicator,
    connect,
    disconnect,
  };
}
