/**
 * Unified Authentication Widget
 * 
 * Test widget component that uses the new unified Supabase authentication
 * approach to verify message broadcasting and realtime functionality.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWidgetSupabaseAuth } from '@/hooks/useWidgetSupabaseAuth';
import { useWidgetRealtime } from './enhanced/useWidgetRealtime';
import { useReadReceipts } from '../../src/components/widget/hooks/useReadReceipts';
import { WidgetMessage } from '@/src/types/entities/message';
import { WidgetDebugPanel } from './debug/WidgetDebugPanel';
import { widgetDebugger } from '@/lib/utils/widget-debug';

interface UnifiedAuthWidgetProps {
  organizationId: string;
  conversationId?: string;
  className?: string;
  debug?: boolean;
}

export function UnifiedAuthWidget({
  organizationId,
  conversationId: initialConversationId,
  className = '',
  debug = false
}: UnifiedAuthWidgetProps) {
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | undefined>();
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize widget authentication
  const auth = useWidgetSupabaseAuth(organizationId);

  // Auto sign-in as visitor when component mounts
  useEffect(() => {
    if (!auth.isAuthenticated && !auth.isLoading) {
      const metadata = {
        conversationId: conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        visitorId: `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: 'unified-auth-widget',
      };
      
      auth.signInAsVisitor(organizationId, metadata);
      
      if (!conversationId) {
        setConversationId(metadata.conversationId);
      }
    }
  }, [auth.isAuthenticated, auth.isLoading, organizationId, conversationId]);

  // Initialize realtime with auth headers
  const realtime = useWidgetRealtime({
    organizationId,
    conversationId: conversationId || '',
    onMessage: (message) => {
      console.log('[Widget] Received message:', message);
      setMessages(prev => [...prev, message]);
    },
    onTyping: (typing, userName) => {
      setIsTyping(typing);
      setTypingUser(userName);
    },
    onConnectionChange: (connected) => {
      setConnectionStatus(connected ? 'connected' : 'disconnected');
    },
    getAuthHeaders: auth.getAuthHeaders,
  });

  // Initialize read receipts with auth headers
  const readReceipts = useReadReceipts(
    conversationId,
    organizationId,
    auth.user?.visitorId || 'unknown',
    auth.getAuthHeaders
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when they appear
  useEffect(() => {
    if (messages.length > 0) {
      const unreadMessageIds = messages
        .filter(msg => msg.senderType !== 'visitor')
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        readReceipts.markAsRead(unreadMessageIds);
      }
    }
  }, [messages, readReceipts]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !conversationId) return;

    const messageContent = inputValue.trim();
    setInputValue('');

    try {
      await realtime.sendMessage(messageContent);
      console.log('[Widget] Message sent successfully');
    } catch (error) {
      console.error('[Widget] Failed to send message:', error);
      // Re-add message to input on failure
      setInputValue(messageContent);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`flex flex-col h-96 bg-white border border-gray-300 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
        <div>
          <h3 className="font-semibold text-gray-900">Unified Auth Widget</h3>
          <p className="text-sm text-gray-600">Org: {organizationId}</p>
          {conversationId && (
            <p className="text-xs text-gray-500">Conv: {conversationId}</p>
          )}
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${getStatusColor(connectionStatus)}`}>
            {connectionStatus === 'connected' ? '🟢' : connectionStatus === 'connecting' ? '🟡' : '🔴'} {connectionStatus}
          </div>
          {auth.isAuthenticated ? (
            <div className="text-xs text-green-600">✅ Authenticated</div>
          ) : auth.isLoading ? (
            <div className="text-xs text-yellow-600">🔄 Authenticating...</div>
          ) : (
            <div className="text-xs text-red-600">❌ Not authenticated</div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
            No messages yet. Send a message to start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderType === 'visitor' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  message.senderType === 'visitor'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className="text-xs opacity-75 mt-1">
                  {message.senderName} • {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 px-3 py-2 rounded-lg">
              <div className="text-sm">
                {typingUser || 'Someone'} is typing...
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!auth.isAuthenticated || connectionStatus !== 'connected'}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || !auth.isAuthenticated || connectionStatus !== 'connected'}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        
        {/* Status info */}
        <div className="mt-2 text-xs text-gray-500">
          {!auth.isAuthenticated && 'Please wait for authentication...'}
          {auth.isAuthenticated && connectionStatus !== 'connected' && 'Connecting to realtime...'}
          {auth.isAuthenticated && connectionStatus === 'connected' && 'Ready to send messages'}
        </div>
      </div>

      {/* Debug Panel */}
      {debug && (
        <WidgetDebugPanel
          isOpen={isDebugOpen}
          onToggle={() => setIsDebugOpen(!isDebugOpen)}
          className="z-[60]"
        />
      )}
    </div>
  );
}
