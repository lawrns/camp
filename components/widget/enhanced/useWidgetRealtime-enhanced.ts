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
const connectionAttempts = new Map<string, number>();

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
 */
const ensureAuthSession = async (client: any): Promise<string | null> => {
  try {
    const { data: { session }, error } = await client.auth.getSession();
    
    if (error) {
      widgetDebugger.logRealtime('warn', 'Auth session error, attempting anonymous sign-in', { error });
      const { data: anonSession, error: anonError } = await client.auth.signInAnonymously();
      if (anonError) throw anonError;
      return anonSession.session?.access_token || null;
    }

    if (!session?.access_token) {
      widgetDebugger.logRealtime('info', 'No session found, creating anonymous session');
      const { data: anonSession, error: anonError } = await client.auth.signInAnonymously();
      if (anonError) throw anonError;
      return anonSession.session?.access_token || null;
    }

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
      id: parseInt(supabaseMessage.id) || Date.now(), // Convert to number as expected by Message interface
      conversationId: parseInt(supabaseMessage.conversation_id) || 0,
      content: supabaseMessage.content || '',
      senderType,
      senderName: supabaseMessage.sender_name || 'Unknown',
      createdAt: supabaseMessage.created_at || new Date().toISOString(),
      status: (supabaseMessage.status as any) || 'sent',
    };
  }, []);

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

      // Ensure authentication
      const accessToken = await ensureAuthSession(supabaseRef.current);
      if (accessToken) {
        supabaseRef.current.realtime.setAuth(accessToken);
        widgetDebugger.logRealtime('info', '🔐 Authentication token set for realtime');
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
          // Clean up stale channel
          existingChannel.unsubscribe();
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

      // Subscribe with timeout and enhanced error handling
      return new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Connection timeout after ${CONNECTION_TIMEOUT}ms`));
        }, CONNECTION_TIMEOUT);

        channel.subscribe((status: string) => {
          clearTimeout(timeoutId);

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
            resolve();
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
              reject(new Error(`Connection failed after ${MAX_RETRIES} retries`));
            }
          }
        });
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

  return {
    isConnected,
    connectionStatus,
    connectionError,
    conversationId,
    isInitializing,
    initializationError,
    connectWithRetry,
    sendMessage: async () => {}, // Placeholder
    sendTypingIndicator: async () => {}, // Placeholder
    connect: async () => {}, // Placeholder
    disconnect: async () => {}, // Placeholder
  };
}
