"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatCircle, 
  Question, 
  Phone, 
  X, 
  Minus,
  ArrowsOut,
  ArrowsIn
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { sanitizeInput } from '@/lib/security/input-sanitization';
import { logWidgetEvent } from '@/lib/monitoring/widget-logger';
import { useWidgetRealtime } from './useWidgetRealtime';
import { WidgetMessageList, WidgetWelcomeMessage } from './WidgetMessageList';
import { WidgetMessageComposer } from './WidgetMessageComposer';
import { WidgetMessage } from './WidgetMessageBubble';
import { WidgetFAQTab } from './WidgetFAQTab';
import { WidgetHelpTab } from './WidgetHelpTab';

// Widget configuration interface
export interface WidgetConfig {
  organizationName: string;
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  welcomeMessage?: string;
  showWelcomeMessage?: boolean;
  enableFAQ?: boolean;
  enableHelp?: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    businessHours?: any;
  };
}

// Widget state interface
interface WidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  isExpanded: boolean;
  activeTab: 'chat' | 'faq' | 'help';
  messages: WidgetMessage[];
  isTyping: boolean;
  unreadCount: number;
}

interface EnhancedWidgetProps {
  config: WidgetConfig;
  organizationId: string;
  onSendMessage?: (content: string, attachments?: File[]) => Promise<void>;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  className?: string;
}

export function EnhancedWidget({
  config,
  organizationId,
  onSendMessage,
  onStartTyping,
  onStopTyping,
  className,
}: EnhancedWidgetProps) {
  const [state, setState] = useState<WidgetState>({
    isOpen: false,
    isMinimized: false,
    isExpanded: false,
    activeTab: 'chat',
    messages: [],
    isTyping: false,
    unreadCount: 0,
  });

  // Real-time messaging integration
  const {
    isConnected,
    conversationId,
    isInitializing,
    initializationError,
    sendMessage: sendRealtimeMessage,
    sendTypingIndicator,
  } = useWidgetRealtime({
    organizationId,
    onMessage: (message) => {
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, message],
        unreadCount: prev.isOpen ? 0 : prev.unreadCount + 1,
      }));
    },
    onTyping: (isTyping, userName) => {
      setState(prev => ({ ...prev, isTyping }));
    },
    onConnectionChange: (connected) => {
      logWidgetEvent('widget_connection_status', { connected });
    },
    onMessageStatusUpdate: (messageId, status) => {
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === messageId ? { ...msg, status: status as any } : msg
        ),
      }));
    },
  });

  // Initialize with welcome message
  useEffect(() => {
    if (config.showWelcomeMessage !== false) {
      const welcomeMessage: WidgetMessage = {
        id: 'welcome',
        content: config.welcomeMessage || `Hi! 👋 Welcome to ${config.organizationName}. How can we help you today?`,
        senderType: 'agent',
        senderName: 'Support Team',
        timestamp: new Date().toISOString(),
        status: 'sent',
      };
      setState(prev => ({ ...prev, messages: [welcomeMessage] }));
    }
  }, [config.welcomeMessage, config.organizationName, config.showWelcomeMessage]);

  // Handle widget toggle
  const toggleWidget = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
      unreadCount: prev.isOpen ? prev.unreadCount : 0, // Clear unread when opening
    }));
  }, []);

  // Handle minimize/restore
  const toggleMinimize = useCallback(() => {
    setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  // Handle expand/collapse
  const toggleExpand = useCallback(() => {
    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  // Handle tab change
  const changeTab = useCallback((tab: 'chat' | 'faq' | 'help') => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  // Handle message send with security and monitoring
  const handleSendMessage = useCallback(async (content: string, attachments?: File[]) => {
    try {
      // Sanitize input content
      const sanitizedContent = sanitizeInput(content);

      // Log widget event
      logWidgetEvent('message_sent', {
        organizationName: config.organizationName,
        messageLength: content.length,
        hasAttachments: (attachments?.length || 0) > 0,
        timestamp: new Date().toISOString(),
      });

      const newMessage: WidgetMessage = {
        id: `msg-${Date.now()}`,
        content: sanitizedContent,
        senderType: 'user',
        senderName: 'You',
        timestamp: new Date().toISOString(),
        status: 'sending',
        attachments: attachments?.map((file, index) => ({
          id: `att-${index}`,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
        })) || [],
      };

      // Add optimistic message to UI
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage],
      }));

      // Send via real-time system
      const sentMessage = await sendRealtimeMessage(sanitizedContent, attachments);

      // Replace optimistic message with real message
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === newMessage.id
            ? { ...newMessage, id: sentMessage.id, status: 'sent' }
            : msg
        ),
      }));

      // Also call the optional callback
      await onSendMessage?.(content, attachments);

    } catch (error) {
      // Update message status to failed
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.status === 'sending' ? { ...msg, status: 'failed' } : msg
        ),
      }));
      throw error;
    }
  }, [sendRealtimeMessage, onSendMessage, config.organizationName]);

  // Handle start chat from other tabs
  const handleStartChat = useCallback(() => {
    changeTab('chat');
  }, [changeTab]);

  // Handle typing indicators
  const handleStartTyping = useCallback(() => {
    sendTypingIndicator(true);
    onStartTyping?.();
  }, [sendTypingIndicator, onStartTyping]);

  const handleStopTyping = useCallback(() => {
    sendTypingIndicator(false);
    onStopTyping?.();
  }, [sendTypingIndicator, onStopTyping]);

  // Get widget size classes
  const getWidgetSizeClasses = () => {
    if (state.isExpanded) {
      return 'w-[90vw] h-[90vh] max-w-4xl max-h-[800px]';
    }
    return 'w-80 h-96 sm:w-96 sm:h-[500px]';
  };

  // Get position classes
  const getPositionClasses = () => {
    const base = 'fixed z-50';
    switch (config.position) {
      case 'bottom-left':
        return `${base} bottom-4 left-4`;
      default:
        return `${base} bottom-4 right-4`;
    }
  };

  return (
    <div className={cn(getPositionClasses(), className)}>
      {/* Widget Button */}
      <AnimatePresence>
        {!state.isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="relative"
          >
            <Button
              onClick={toggleWidget}
              className={cn(
                'h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200',
                'bg-blue-600 hover:bg-blue-700 text-white'
              )}
              style={{ backgroundColor: config.primaryColor }}
            >
              <ChatCircle className="h-6 w-6" />
            </Button>
            
            {/* Unread badge */}
            {state.unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
              >
                {state.unreadCount > 9 ? '9+' : state.unreadCount}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Panel */}
      <AnimatePresence>
        {state.isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              'bg-white rounded-lg shadow-2xl border overflow-hidden flex flex-col',
              getWidgetSizeClasses(),
              state.isMinimized && 'h-12'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <div 
                  className="h-2 w-2 rounded-full bg-green-500"
                  style={{ backgroundColor: config.primaryColor }}
                />
                <span className="font-medium text-gray-900 text-sm">
                  {config.organizationName}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleExpand}
                  className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                >
                  {state.isExpanded ? (
                    <ArrowsIn className="h-4 w-4" />
                  ) : (
                    <ArrowsOut className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMinimize}
                  className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleWidget}
                  className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content (hidden when minimized) */}
            {!state.isMinimized && (
              <>
                {/* Tab Navigation */}
                <div className="flex border-b bg-gray-50">
                  <button
                    onClick={() => changeTab('chat')}
                    className={cn(
                      'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                      state.activeTab === 'chat'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    <ChatCircle className="h-4 w-4 mx-auto mb-1" />
                    Chat
                  </button>
                  
                  {config.enableFAQ !== false && (
                    <button
                      onClick={() => changeTab('faq')}
                      className={cn(
                        'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                        state.activeTab === 'faq'
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      <Question className="h-4 w-4 mx-auto mb-1" />
                      FAQ
                    </button>
                  )}
                  
                  {config.enableHelp !== false && (
                    <button
                      onClick={() => changeTab('help')}
                      className={cn(
                        'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                        state.activeTab === 'help'
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      <Phone className="h-4 w-4 mx-auto mb-1" />
                      Help
                    </button>
                  )}
                </div>

                {/* Tab Content */}
                <div className="flex-1 flex flex-col min-h-0">
                  <AnimatePresence mode="wait">
                    {state.activeTab === 'chat' && (
                      <motion.div
                        key="chat"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex-1 flex flex-col"
                      >
                        <WidgetMessageList
                          messages={state.messages}
                          isTyping={state.isTyping}
                          className="flex-1"
                        />
                        <div className="p-3 border-t">
                          {/* Connection Status */}
                          {(isInitializing || initializationError) && (
                            <div className="mb-3 p-2 rounded text-sm">
                              {isInitializing && (
                                <div className="flex items-center gap-2 text-blue-600">
                                  <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                  Connecting...
                                </div>
                              )}
                              {initializationError && (
                                <div className="text-red-600">
                                  Connection failed: {initializationError}
                                </div>
                              )}
                            </div>
                          )}

                          <WidgetMessageComposer
                            onSend={handleSendMessage}
                            onTyping={handleStartTyping}
                            onStopTyping={handleStopTyping}
                            disabled={isInitializing || !!initializationError}
                            placeholder={
                              isInitializing
                                ? "Connecting..."
                                : initializationError
                                  ? "Connection failed"
                                  : "Type your message..."
                            }
                          />
                        </div>
                      </motion.div>
                    )}

                    {state.activeTab === 'faq' && (
                      <motion.div
                        key="faq"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex-1"
                      >
                        <WidgetFAQTab onStartChat={handleStartChat} />
                      </motion.div>
                    )}

                    {state.activeTab === 'help' && (
                      <motion.div
                        key="help"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex-1"
                      >
                        <WidgetHelpTab 
                          onStartChat={handleStartChat}
                          organizationConfig={{
                            name: config.organizationName,
                            ...config.contactInfo,
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
