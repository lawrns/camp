"use client";

import React, { useEffect, useState, useRef } from 'react';
import { WidgetDebugger } from './debug/WidgetDebugger';
import { useWidgetState } from './hooks/useWidgetState';
import { useReadReceipts, useAutoMarkAsRead } from './hooks/useReadReceipts';
import { ReadReceiptIndicator } from '@/components/ui/ReadReceiptIndicator';
import { useWidget } from './index';
import { WidgetComposer } from './components/WidgetComposer';
import { X, Minus } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DefinitiveWidgetProps {
  organizationId: string;
  onClose?: () => void;
}

export function DefinitiveWidget({ organizationId, onClose }: DefinitiveWidgetProps) {
  console.log('[DefinitiveWidget] Component rendering with organizationId:', organizationId);

  const [messageText, setMessageText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [demoAgentIsTyping, setDemoAgentIsTyping] = useState(false);

  // Refs for auto-scroll functionality
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  console.log('[DefinitiveWidget] About to call useWidget()');

  // Get conversation ID from widget context
  let contextConversationId = null;
  try {
    const widgetContext = useWidget();
    contextConversationId = widgetContext.conversationId;
    console.log('[DefinitiveWidget] Widget context:', widgetContext);
    console.log('[DefinitiveWidget] Context conversation ID:', contextConversationId);
    console.log('[DefinitiveWidget] Expected conversation ID: 48eedfba-2568-4231-bb38-2ce20420900d');
    console.log('[DefinitiveWidget] Context matches expected:', contextConversationId === '48eedfba-2568-4231-bb38-2ce20420900d');
  } catch (error) {
    console.error('[DefinitiveWidget] Error getting widget context:', error);
    contextConversationId = null;
  }

  const {
    state: widgetState,
    messages,
    isLoading,
    agentIsTyping,
    sendMessage,
    openWidget,
    initializeConversation
  } = useWidgetState(organizationId, contextConversationId || undefined);

  // Read receipts functionality
  const readerId = `visitor-${Date.now()}`; // TODO: Get from proper visitor identification
  const {
    readReceipts,
    markAsRead,
    getReadStatus,
    isLoading: readReceiptsLoading,
    error: readReceiptsError
  } = useReadReceipts(widgetState.conversationId, organizationId, readerId);

  // Auto-mark messages as read when they come into view
  const messageIds = messages.map(m => m.id?.toString()).filter(Boolean) as string[];
  useAutoMarkAsRead(messageIds, readerId, markAsRead, {
    enabled: !isMinimized, // Widget is always open when this component is mounted
    delay: 1500, // Wait 1.5 seconds before marking as read
    threshold: 0.6 // 60% of message must be visible
  });

  // Initialize conversation when widget mounts
  useEffect(() => {
    console.log("[DefinitiveWidget] Widget mounted, initializing conversation...");
    // Don't call openWidget() here as it conflicts with WidgetProvider state
    // The widget is already open when this component mounts
    if (!widgetState.conversationId) {
      initializeConversation().catch((error) => {
        console.error('[DefinitiveWidget] Failed to initialize conversation:', error);
        setWidgetError('Failed to initialize conversation');
        // Don't throw the error - just log it and continue
      });
    }
  }, []); // Only run on mount - removed dependencies to prevent infinite re-renders

  // Debug logging for messages
  useEffect(() => {
    console.log("[DefinitiveWidget] Messages updated:", messages.length, messages);
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive or after sending
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Typing indicator functions with real API integration
  const startTyping = async () => {
    if (!isTyping && widgetState.conversationId) {
      setIsTyping(true);
      console.log('[DefinitiveWidget] Started typing');

      // Broadcast typing indicator via API
      try {
        await fetch('/api/widget/typing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Organization-ID': organizationId,
          },
          body: JSON.stringify({
            conversationId: widgetState.conversationId,
            isTyping: true,
            visitorId: `visitor-${Date.now()}`, // TODO: Get from auth
          }),
        });
      } catch (error) {
        console.error('[DefinitiveWidget] Failed to broadcast typing start:', error);
      }
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to stop typing after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      stopTyping();
    }, 3000);

    setTypingTimeout(timeout);
  };

  const stopTyping = async () => {
    if (isTyping && widgetState.conversationId) {
      setIsTyping(false);
      console.log('[DefinitiveWidget] Stopped typing');

      // Broadcast stop typing via API
      try {
        await fetch('/api/widget/typing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Organization-ID': organizationId,
          },
          body: JSON.stringify({
            conversationId: widgetState.conversationId,
            isTyping: false,
            visitorId: `visitor-${Date.now()}`, // TODO: Get from auth
          }),
        });
      } catch (error) {
        console.error('[DefinitiveWidget] Failed to broadcast typing stop:', error);
      }
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    console.log('[DefinitiveWidget] handleSendMessage called with content:', content, 'isLoading:', isLoading);
    
    if (!content.trim() || isLoading) {
      console.log('[DefinitiveWidget] Message empty or loading, returning early');
      return;
    }

    try {
      console.log('[DefinitiveWidget] Calling sendMessage with:', content);
      const result = await sendMessage(content.trim());
      console.log('[DefinitiveWidget] sendMessage result:', result);
      stopTyping(); // Stop typing indicator when message is sent

      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollToBottom();
      }, 100); // Small delay to ensure message is rendered
    } catch (error) {
      console.error('[DefinitiveWidget] Failed to send message:', error);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed bottom-4 right-4 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg flex items-center justify-between p-4 z-[9999] cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => setIsMinimized(false)}
        data-testid="widget-minimized"
        data-campfire-widget-minimized
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">🔥</span>
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-900">Campfire Support</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Click to expand
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          data-testid="widget-close-button-minimized"
          data-campfire-close-button-minimized
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "fixed bottom-4 right-4 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col z-[9999] overflow-hidden",
          "w-96 h-[600px] max-h-[80vh]",
          "sm:w-80 sm:h-[500px]"
        )}
        data-testid="widget-panel"
        data-campfire-widget-panel
      >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">🔥</span>
          </div>
          <div>
            <div className="font-semibold text-sm">Campfire Support</div>
            <div className="text-xs text-blue-100 flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${widgetState.conversationId ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              {widgetState.conversationId ? 'Connected' : 'Connecting...'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            title="Minimize"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            data-testid="widget-close-button"
            data-campfire-widget-close
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-background px-4 py-2 text-tiny text-foreground border-b">
        <div className="flex justify-between items-center">
          <div>
            Messages: {messages.length} |
            {isLoading ? ' Sending...' : ' Ready'}
          </div>
          {(widgetState.error || widgetError) && (
            <div className="text-red-600 font-medium">
              Error: {(widgetState.error || widgetError)?.slice(0, 30)}...
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        id="widget-messages"
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
        data-testid="widget-messages"
        data-campfire-widget-messages
      >
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <div className="font-semibold text-gray-900 mb-2">Hi! How can we help you today?</div>
            <div className="text-sm text-gray-500">Just now</div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.id}-${index}`} // Ensure unique keys
              className={`flex ${message.senderType === 'visitor' ? 'justify-end' : 'justify-start'
                }`}
              data-testid="widget-message"
              data-campfire-message
              data-sender={message.senderType}
              data-message-id={message.id}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${message.senderType === 'visitor'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
                  }`}
              >
                <div className="text-tiny opacity-75 mb-1 font-medium flex items-center space-x-1">
                  <span>
                    {message.senderType === 'visitor' ? 'You' :
                      message.senderType === 'ai' ? '🤖 AI Assistant' : '👤 Agent'}
                  </span>
                  {message.confidence && message.senderType === 'ai' && (
                    <span className="text-tiny bg-green-100 text-green-700 px-1 rounded">
                      {Math.round(message.confidence * 100)}%
                    </span>
                  )}
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.isTyping ? (
                    <div className="flex items-center space-x-spacing-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-ds-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-ds-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-ds-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-tiny text-foreground-muted">Typing...</span>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
                <div className={`text-xs mt-2 flex items-center justify-between ${
                  message.senderType === 'visitor' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  <span>{new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                  {message.id && (
                    <ReadReceiptIndicator
                      receipt={{
                        messageId: message.id.toString(),
                        status: message.read_status === 'sending' ? 'sent' :
                               message.read_status === 'sent' ? 'delivered' : 'read',
                        isRead: getReadStatus(message.id.toString()).isRead,
                        readBy: getReadStatus(message.id.toString()).readBy,
                        lastReadAt: getReadStatus(message.id.toString()).lastReadAt
                      }}
                      variant="widget"
                      size="sm"
                    />
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div
            className="flex justify-start"
            data-testid="widget-typing-indicator"
            data-campfire-typing-indicator
          >
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-500">AI is typing...</span>
              </div>
            </div>
          </div>
        )}

        {/* Messages end marker for auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Agent Typing Indicator */}
      {agentIsTyping && (
        <div
          className="px-4 py-2 border-t bg-background"
          data-testid="widget-agent-typing-indicator"
          data-campfire-agent-typing
        >
          <div className="flex items-center space-x-spacing-sm text-tiny text-foreground-muted">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-ds-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-ds-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-ds-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>👨‍💼 Agent is typing...</span>
          </div>
        </div>
      )}

      {/* Input */}
      <WidgetComposer
         onSend={handleSendMessage}
         onTyping={startTyping}
         onStopTyping={stopTyping}
         placeholder="Type your message..."
         disabled={isLoading}
       />

      {/* Debug Panel - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <WidgetDebugger
          organizationId={organizationId}
          conversationId={widgetState.conversationId || ''}
          messages={messages}
          isLoading={isLoading}
          error={widgetState.error}
        />
      )}
      </motion.div>
    </AnimatePresence>
  );
}
