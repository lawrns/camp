import { useCallback, useEffect, useState } from 'react';
import { useMessages } from './useMessages';

interface WidgetState {
  isOpen: boolean;
  conversationId: string | null;
  organizationId: string;
  isInitialized: boolean;
  error: string | null;
  debugMode: boolean;
}

interface UseWidgetStateReturn {
  // State
  state: WidgetState;
  messages: any[];
  isLoading: boolean;

  // Actions
  openWidget: () => void;
  closeWidget: () => void;
  sendMessage: (content: string) => Promise<any>;
  initializeConversation: () => Promise<void>;

  // Debug
  debugInfo: any;
  setDebugMode: (enabled: boolean) => void;
}

export function useWidgetState(
  organizationId: string,
  initialConversationId?: string
): UseWidgetStateReturn {
  console.log('[useWidgetState] Called with:', { organizationId, initialConversationId });
  console.log('[useWidgetState] Expected conversation ID: 48eedfba-2568-4231-bb38-2ce20420900d');
  console.log('[useWidgetState] Received matches expected:', initialConversationId === '48eedfba-2568-4231-bb38-2ce20420900d');

  const [state, setState] = useState<WidgetState>({
    isOpen: false,
    conversationId: initialConversationId || null,
    organizationId,
    isInitialized: !!initialConversationId, // Initialize as true if we have a conversation ID
    error: null,
    debugMode: process.env.NODE_ENV === 'development'
  });

  const [debugInfo, setDebugInfo] = useState<any>({
    apiCalls: [],
    stateChanges: [],
    errors: []
  });

  // Use the messages hook with proper state
  const {
    messages,
    sendMessage: sendMessageViaHook,
    isLoading,
    error: messagesError,
    reload: reloadMessages
  } = useMessages(state.conversationId || undefined, organizationId);

  // Debug logging for conversation ID and messages
  useEffect(() => {
    console.log(`[WidgetState] Conversation ID: ${state.conversationId}, Messages: ${messages.length}`);
  }, [state.conversationId, messages.length]);

  // Debug logging
  const logDebug = useCallback((event: string, data: any) => {
    if (state.debugMode) {
      console.log(`[WidgetState] ${event}:`, data);
      setDebugInfo(prev => ({
        ...prev,
        stateChanges: [...prev.stateChanges.slice(-9), {
          event,
          data,
          timestamp: new Date().toISOString()
        }]
      }));
    }
  }, [state.debugMode]);

  // Initialize conversation if needed
  const initializeConversation = useCallback(async () => {
    if (state.conversationId) {
      logDebug('Conversation already exists', { conversationId: state.conversationId });
      return;
    }

    // If we have an initialConversationId, use it instead of creating a new one
    if (initialConversationId) {
      setState(prev => ({
        ...prev,
        conversationId: initialConversationId,
        isInitialized: true,
        error: null
      }));
      logDebug('Using provided conversation ID', { conversationId: initialConversationId });
      return;
    }

    logDebug('Initializing new conversation', { organizationId });

    try {
      const response = await fetch('/api/widget?action=create-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': organizationId,
        },
        body: JSON.stringify({
          organizationId,
          visitorId: `visitor-${Date.now()}`,
          initialMessage: null
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract conversation ID from response (handle different response formats)
      const conversationId = data.conversationId || data.conversation?.id || data.data?.conversation?.id;

      if (data.success && conversationId) {
        setState(prev => ({
          ...prev,
          conversationId: conversationId,
          isInitialized: true,
          error: null
        }));

        logDebug('Conversation created', { conversationId });
      } else {
        throw new Error('Invalid response from conversation creation');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[WidgetState] Conversation creation error details:', error);
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));

      logDebug('Conversation creation failed', { error: errorMessage });
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors.slice(-4), {
          error: errorMessage,
          timestamp: new Date().toISOString()
        }]
      }));
    }
  }, [state.conversationId, organizationId, logDebug]);

  // Widget actions
  const openWidget = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
    logDebug('Widget opened', {});

    // Initialize conversation when widget opens
    if (!state.conversationId) {
      initializeConversation();
    }
  }, [state.conversationId, initializeConversation, logDebug]);

  const closeWidget = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
    logDebug('Widget closed', {});
  }, [logDebug]);

  // Enhanced send message with debugging
  const sendMessage = useCallback(async (content: string) => {
    if (!state.conversationId) {
      await initializeConversation();
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logDebug('Sending message', { content, conversationId: state.conversationId });

    try {
      const result = await sendMessageViaHook(content);
      logDebug('Message sent successfully', { messageId: result?.id });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logDebug('Message send failed', { error: errorMessage });
      throw error;
    }
  }, [state.conversationId, initializeConversation, sendMessageViaHook, logDebug]);

  // Update error state when messages error changes
  useEffect(() => {
    if (messagesError) {
      setState(prev => ({ ...prev, error: messagesError }));
      logDebug('Messages error', { error: messagesError });
    }
  }, [messagesError, logDebug]);

  // Debug mode setter
  const setDebugMode = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, debugMode: enabled }));
  }, []);

  // Log state changes
  useEffect(() => {
    logDebug('State updated', state);
  }, [state, logDebug]);

  return {
    state,
    messages,
    isLoading,
    openWidget,
    closeWidget,
    sendMessage,
    initializeConversation,
    debugInfo,
    setDebugMode
  };
}
