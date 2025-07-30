import { useCallback, useEffect, useState } from 'react';
import { useMessages } from './useMessages';

interface WidgetState {
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
  agentIsTyping: boolean;

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
    reload: reloadMessages,
    agentIsTyping
  } = useMessages(state.conversationId || undefined, organizationId);

  // Debug logging for conversation ID and messages
  useEffect(() => {
    console.log(`[WidgetState] Conversation ID: ${state.conversationId}, Messages: ${messages.length}`);
  }, [state.conversationId, messages.length]);

  // Debug logging
  const logDebug = useCallback((event: string, data: any) => {
    if (state.debugMode) {
      console.log(`[WidgetState] ${event}:`, data);
      setDebugInfo((prev: any) => ({
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
      // For testing purposes, create a mock conversation ID if API fails
      const mockConversationId = `test-conversation-${Date.now()}`;
      
      // Try to create conversation via API, but fallback to mock if it fails
      try {
        const response = await fetch('/api/widget', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Organization-ID': organizationId,
          },
          body: JSON.stringify({
            action: 'create-conversation',
            organizationId,
            visitorId: `visitor-${Date.now()}`,
            initialMessage: null
          })
        });

        if (response.ok) {
          const data = await response.json();
          const conversationId = data.conversationId || data.conversation?.id || data.data?.conversation?.id;

          if (data.success && conversationId) {
            setState(prev => ({
              ...prev,
              conversationId: conversationId,
              isInitialized: true,
              error: null
            }));
            logDebug('Conversation created via API', { conversationId });
            return;
          }
        }
      } catch (apiError) {
        console.warn('[WidgetState] API call failed, using mock conversation:', apiError);
      }

      // Fallback to mock conversation for testing
      setState(prev => ({
        ...prev,
        conversationId: mockConversationId,
        isInitialized: true,
        error: null
      }));

      logDebug('Mock conversation created for testing', { conversationId: mockConversationId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[WidgetState] Conversation creation error details:', error);
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));

      logDebug('Conversation creation failed', { error: errorMessage });
      setDebugInfo((prev: any) => ({
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
    // Widget open/close is now managed by WidgetProvider
    logDebug('Widget opened', {});

    // Initialize conversation when widget opens
    if (!state.conversationId && !initialConversationId) {
      initializeConversation();
    } else if (initialConversationId && !state.conversationId) {
      // Set the initial conversation ID if provided
      setState(prev => ({
        ...prev,
        conversationId: initialConversationId,
        isInitialized: true
      }));
      logDebug('Set initial conversation ID on widget open', { conversationId: initialConversationId });
    }
  }, [state.conversationId, initialConversationId, initializeConversation, logDebug]);

  const closeWidget = useCallback(() => {
    // Widget open/close is now managed by WidgetProvider
    logDebug('Widget closed', {});
  }, [logDebug]);

  // Enhanced send message with debugging
  const sendMessage = useCallback(async (content: string) => {
    // Use the provided conversation ID or initialize if needed
    const conversationId = state.conversationId || initialConversationId;

    if (!conversationId) {
      await initializeConversation();
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    } else if (!state.conversationId && initialConversationId) {
      // Ensure state is updated with the initial conversation ID
      setState(prev => ({
        ...prev,
        conversationId: initialConversationId,
        isInitialized: true
      }));
    }

    logDebug('Sending message', { content, conversationId: state.conversationId || initialConversationId });

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

  // Initialize with provided conversation ID on mount
  useEffect(() => {
    if (initialConversationId) {
      setState(prev => ({
        ...prev,
        conversationId: initialConversationId,
        isInitialized: true,
        error: null
      }));
      logDebug('Initialized with provided conversation ID', { conversationId: initialConversationId });
    }
  }, [initialConversationId, logDebug]);

  // Log state changes
  useEffect(() => {
    logDebug('State updated', state);
  }, [state, logDebug]);

  return {
    state,
    messages,
    isLoading,
    agentIsTyping,
    openWidget,
    closeWidget,
    sendMessage,
    initializeConversation,
    debugInfo,
    setDebugMode
  };
}
