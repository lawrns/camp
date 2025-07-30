"use client";

import React, { useEffect, useState } from 'react';
import { WidgetDebugger } from './debug/WidgetDebugger';
import { useWidgetState } from './hooks/useWidgetState';
import { useReadReceipts, useAutoMarkAsRead } from './hooks/useReadReceipts';
import { ReadReceiptIndicator } from '../ui/ReadReceiptIndicator';

interface DefinitiveWidgetProps {
  organizationId: string;
  onClose?: () => void;
}

export function DefinitiveWidget({ organizationId, onClose }: DefinitiveWidgetProps) {
  const [messageText, setMessageText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  const {
    state: widgetState,
    messages,
    isLoading,
    agentIsTyping,
    sendMessage,
    openWidget,
    initializeConversation
  } = useWidgetState(organizationId);

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
    enabled: widgetState.isOpen && !isMinimized,
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
  }, [widgetState.conversationId, initializeConversation]);

  // Debug logging for messages
  useEffect(() => {
    console.log("[DefinitiveWidget] Messages updated:", messages.length, messages);
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const messagesContainer = document.getElementById('widget-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DefinitiveWidget] handleSendMessage called with:', messageText);
    console.log('[DefinitiveWidget] isLoading:', isLoading);
    console.log('[DefinitiveWidget] messageText.trim():', messageText.trim());

    if (!messageText.trim() || isLoading) {
      console.log('[DefinitiveWidget] Exiting early - no text or loading');
      return;
    }

    try {
      console.log('[DefinitiveWidget] Calling sendMessage...');
      const result = await sendMessage(messageText.trim());
      console.log('[DefinitiveWidget] sendMessage result:', result);
      setMessageText('');
      stopTyping(); // Stop typing indicator when message is sent
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
      <div className="fixed bottom-4 right-4 z-[9999]">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-primary text-white spacing-3 rounded-ds-full shadow-card-deep hover:bg-blue-700 transition-colors"
          data-testid="widget-minimize-button"
          data-campfire-widget-minimize
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          {messages.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-tiny rounded-ds-full w-6 h-6 flex items-center justify-center">
              {messages.length}
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 w-96 h-[600px] bg-background border rounded-ds-lg shadow-2xl flex flex-col z-[9998] overflow-hidden"
      data-testid="widget-panel"
      data-campfire-widget-panel
    >
      {/* Header */}
      <div
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-spacing-md flex items-center justify-between"
        data-testid="widget-header"
        data-campfire-widget-header
      >
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-ds-full ${widgetState.conversationId ? 'bg-green-400' : 'bg-yellow-400'}`} />
          <div>
            <h3 className="font-semibold text-base">Customer Support</h3>
            <div className="text-tiny opacity-75">
              {widgetState.conversationId ? 'Connected' : 'Connecting...'}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-spacing-sm">
          <button
            onClick={() => {
              // Demo: Toggle agent typing indicator
              setAgentIsTyping(!agentIsTyping);
              if (!agentIsTyping) {
                // Auto-stop after 5 seconds
                setTimeout(() => setAgentIsTyping(false), 5000);
              }
            }}
            className="text-white hover:bg-background hover:bg-opacity-20 spacing-1 rounded transition-colors"
            title="Demo: Toggle agent typing"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4.5L2 13V3a1 1 0 0 1 1-1z" />
              <circle cx="5" cy="6.5" r="0.5" />
              <circle cx="8" cy="6.5" r="0.5" />
              <circle cx="11" cy="6.5" r="0.5" />
            </svg>
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-white hover:bg-background hover:bg-opacity-20 spacing-1 rounded transition-colors"
            title="Minimize"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 8h8v1H4z" />
            </svg>
          </button>
          <button
            onClick={handleClose}
            className="text-white hover:bg-background hover:bg-opacity-20 spacing-1 rounded transition-colors"
            title="Close"
            data-testid="widget-close-button"
            data-campfire-widget-close
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
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
        id="widget-messages"
        className="flex-1 p-spacing-md overflow-y-auto space-y-3 bg-background"
        data-testid="widget-messages"
        data-campfire-widget-messages
      >
        {messages.length === 0 ? (
          <div className="text-center text-foreground-muted mt-16">
            <div className="text-4xl mb-4">👋</div>
            <div className="font-semibold text-base mb-2">Welcome to Support!</div>
            <div className="text-sm">How can we help you today?</div>
            <div className="text-tiny mt-2 opacity-75">
              Conversation ID: {widgetState.conversationId ? '✅ Ready' : '⏳ Creating...'}
            </div>
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
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-ds-lg shadow-sm ${message.senderType === 'visitor'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border rounded-bl-sm'
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
                <div className="text-sm leading-relaxed">
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
                <div className="text-tiny opacity-50 mt-2 flex items-center justify-between">
                  <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
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
            <div className="bg-background border rounded-ds-lg px-4 py-3 shadow-card-base">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-ds-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-ds-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-ds-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
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
      <form onSubmit={handleSendMessage} className="p-spacing-md border-t bg-background">
        <div className="flex space-x-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              // Start typing indicator when user types
              if (e.target.value.length > 0) {
                startTyping();
              } else {
                stopTyping();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                console.log('[DefinitiveWidget] Enter key pressed, submitting form');
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            onBlur={() => {
              // Stop typing when input loses focus
              stopTyping();
            }}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border rounded-ds-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
            data-testid="widget-message-input"
            data-campfire-message-input
          />
          <button
            type="button"
            disabled={!messageText.trim() || isLoading}
            className="px-6 py-3 bg-primary text-white rounded-ds-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            data-testid="widget-send-button"
            data-campfire-send-button
            onClick={(e) => {
              console.log('[DefinitiveWidget] Send button clicked, messageText:', messageText, 'isLoading:', isLoading);
              e.preventDefault();
              handleSendMessage(e);
            }}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-ds-full animate-spin" />
            ) : (
              'Send'
            )}
          </button>
        </div>
      </form>

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
    </div>
  );
}
