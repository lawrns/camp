"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatCircle,
  X,
  Minus,
  ArrowsOut,
  ArrowsIn
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { WidgetConfig } from './EnhancedWidgetProvider';

// Import existing widget components
import { WidgetComposer } from '../components/WidgetComposer';
import { WelcomeScreen } from '../components/WelcomeScreen';
import { WidgetBottomTabs, WidgetTabType } from '../components/WidgetBottomTabs';
import { HelpTab } from '../components/HelpTab';

// Import enterprise-grade enhanced-messaging components
import { EnhancedMessageList } from '@/components/enhanced-messaging/EnhancedMessageList';
import { MessageData } from '@/components/enhanced-messaging/EnhancedMessageBubble';
import { TypingUser } from '@/components/enhanced-messaging/EnhancedTypingIndicator';

// Import simplified real-time hook
import { useWidgetRealtime } from '../hooks/useWidgetRealtime';

interface EnhancedWidgetProps {
  organizationId: string;
  config: WidgetConfig;
  debug?: boolean;
}

interface WidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  isExpanded: boolean;
  activeTab: WidgetTabType;
  conversationId?: string;
}

export const EnhancedWidget: React.FC<EnhancedWidgetProps> = ({
  organizationId,
  config,
  debug = false
}) => {
  const [state, setState] = useState<WidgetState>({
    isOpen: false,
    isMinimized: false,
    isExpanded: false,
    activeTab: 'home'
  });

  // Use enhanced-messaging data structures
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll functionality
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Auto-scroll utility functions
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  const checkIfUserScrolledUp = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
      setIsUserScrolledUp(!isNearBottom);
      setShouldAutoScroll(isNearBottom);
    }
  }, []);

  // Handle scroll events to detect if user scrolled up
  const handleScroll = useCallback(() => {
    checkIfUserScrolledUp();
  }, [checkIfUserScrolledUp]);

  // Initialize real-time connection
  const realtime = useWidgetRealtime({
    organizationId,
    conversationId: state.conversationId,
    onMessage: (message) => {
      const messageData: MessageData = {
        id: message.id.toString(),
        content: message.content,
        senderType: message.senderType === 'visitor' ? 'user' : 'agent',
        senderName: message.senderName || 'Unknown',
        timestamp: new Date(message.createdAt).toISOString(),
        status: message.status === 'pending' ? 'sending' : (message.status || 'delivered'),
        metadata: message.metadata || {}
      };
      setMessages(prev => [...prev, messageData]);
    },
    onTyping: (isTyping, userName) => {
      if (isTyping && userName) {
        setTypingUsers([{ id: 'agent', name: userName }]);
      } else {
        setTypingUsers([]);
      }
    },
    onConnectionChange: (connected) => {
      console.log('[Widget] Connection status:', connected);
    },
    onMessageStatusUpdate: (messageId, status) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: status as any } : msg
      ));
    }
  });

  // Auto-scroll effects
  useEffect(() => {
    // Auto-scroll when new messages arrive (only if user is near bottom)
    if (shouldAutoScroll && messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages, shouldAutoScroll, scrollToBottom]);

  useEffect(() => {
    // Auto-scroll when switching to messages tab
    if (state.activeTab === 'messages' && messages.length > 0) {
      setTimeout(() => scrollToBottom(false), 100); // Small delay to ensure DOM is ready
    }
  }, [state.activeTab, scrollToBottom, messages.length]);

  useEffect(() => {
    // Auto-scroll when widget opens and has messages
    if (state.isOpen && messages.length > 0) {
      setTimeout(() => scrollToBottom(false), 200); // Delay for animation
    }
  }, [state.isOpen, scrollToBottom, messages.length]);

  // Initialize conversation
  useEffect(() => {
    if (state.isOpen && !state.conversationId) {
      initializeConversation();
    }
  }, [state.isOpen]);

  const initializeConversation = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/widget/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': organizationId,
        },
        body: JSON.stringify({
          organizationId,
          visitorId: `visitor-${Date.now()}`,
          customerName: 'Website Visitor',
          customerEmail: 'visitor@widget.com',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const conversationId = data.conversation?.id || data.conversationId || data.id;
        setState(prev => ({ ...prev, conversationId }));
        
        // Add welcome message using enhanced-messaging format
        if (config.showWelcomeMessage && config.welcomeMessage) {
          const welcomeMessage: MessageData = {
            id: 'welcome',
            content: config.welcomeMessage,
            senderType: 'system',
            senderName: 'System',
            timestamp: new Date().toISOString(),
            status: 'delivered'
          };
          setMessages([welcomeMessage]);
        }
      }
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced message sending with enterprise-grade composer
  const handleSendMessage = async (content: string, attachments?: File[], metadata?: any) => {
    if (!content.trim() || !state.conversationId) return;

    const userMessage: MessageData = {
      id: `msg-${Date.now()}`,
      content,
      senderType: 'user',
      senderName: 'You',
      timestamp: new Date().toISOString(),
      status: 'sending',
      attachments: attachments?.map((file, index) => ({
        id: `att-${Date.now()}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type as 'file' | 'image' | 'video' | 'audio'
      }))
    };

    setMessages(prev => [...prev, userMessage]);

    // Force auto-scroll when user sends a message
    setShouldAutoScroll(true);

    try {
      const response = await fetch('/api/widget/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': organizationId,
        },
        body: JSON.stringify({
          conversationId: state.conversationId,
          content,
          senderType: 'visitor',
          attachments: metadata?.attachments
        }),
      });

      if (response.ok) {
        // Update message status to sent
        setMessages(prev => prev.map(msg => 
          msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
        ));

        // Simulate agent response with enhanced-messaging format
        setTimeout(() => {
          const agentMessage: MessageData = {
            id: `agent-${Date.now()}`,
            content: "Thanks for your message! An agent will respond shortly.",
            senderType: 'agent',
            senderName: 'Support Agent',
            timestamp: new Date().toISOString(),
            status: 'delivered'
          };
          setMessages(prev => [...prev, agentMessage]);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Update message status to failed
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'failed' } : msg
      ));
    }
  };

  // Enhanced typing indicator handling
  const handleTyping = () => {
    realtime.sendTypingIndicator(true);
  };

  const handleStopTyping = () => {
    realtime.sendTypingIndicator(false);
  };

  // Message action handlers for enhanced-messaging
  const handleMessageAction = (action: string, messageId: string, data?: any) => {
    console.log('Message action:', action, messageId, data);
    // Handle reactions, replies, editing, etc.
  };

  const handleReact = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { 
            ...msg, 
            reactions: [...(msg.reactions || []), { 
              emoji, 
              count: 1, 
              users: ['visitor'], 
              hasReacted: true,
              timestamp: new Date().toISOString()
            }]
          }
        : msg
    ));
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    // Could add toast notification here
  };

  const toggleWidget = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const minimizeWidget = useCallback(() => {
    setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  const expandWidget = useCallback(() => {
    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  const closeWidget = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const switchTab = useCallback((tab: WidgetTabType) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  // Get enhanced widget size classes with fluid responsive design
  const getWidgetSizeClasses = () => {
    if (state.isExpanded) {
      return 'w-[90vw] h-[90vh] max-w-4xl max-h-[800px]';
    }
    return cn(
      // Base mobile-first sizing
      'w-96 h-[600px]',
      // Responsive breakpoints with fluid scaling
      'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
      // Tablet sizing
      'md:w-[28rem] md:h-[640px]',
      // Desktop sizing with resize capability
      'lg:w-[clamp(22rem,25vw,28rem)] lg:h-[clamp(32rem,80vh,42rem)]',
      // Desktop resize handles
      'lg:resize lg:overflow-auto lg:min-w-[20rem] lg:min-h-[28rem] lg:max-w-[32rem] lg:max-h-[48rem]'
    );
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

  // Home/Welcome tab with organization-specific content
  const renderHomeTab = () => (
    <div className="h-full pb-16 overflow-y-auto">
      <WelcomeScreen
        organizationId={organizationId}
        onStartChat={() => switchTab('messages')}
        onViewFAQ={() => switchTab('help')}
      />
    </div>
  );

  // Enhanced chat tab using enterprise-grade components
  const renderChatTab = () => (
    <div className="flex flex-col h-full pb-16">
      {/* Enhanced Message List with Auto-scroll */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        <EnhancedMessageList
          messages={messages}
          typingUsers={typingUsers}
          isLoading={isLoading}
          enableVirtualization={messages.length > 50}
          enableAutoScroll={false} // We handle auto-scroll manually
          enableGrouping={true}
          enableLoadMore={false}
          onReact={handleReact}
          onCopy={handleCopy}
          onMessageAction={handleMessageAction}
          className="min-h-full"
        />
      </div>

      {/* Scroll to bottom button (when user scrolled up) */}
      <AnimatePresence>
        {isUserScrolledUp && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-20 right-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors z-10"
            title="Scroll to bottom"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Enhanced Composer - Using existing WidgetComposer */}
      <div className="absolute bottom-16 left-0 right-0 border-t bg-white p-4">
        <WidgetComposer
          onSend={handleSendMessage}
          placeholder="Type your message..."
          onTyping={handleTyping}
          onStopTyping={handleStopTyping}
          className="w-full border-none outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );



  const renderHelpTab = () => (
    <div className="h-full pb-16">
      <HelpTab organizationId={organizationId} />
    </div>
  );

  return (
    <div className={getPositionClasses()}>
      {/* Enhanced Widget Button */}
      <AnimatePresence>
        {!state.isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={toggleWidget}
            className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300"
            style={{ backgroundColor: config.primaryColor }}
            data-testid="widget-button"
            aria-label="Open chat support"
          >
            <ChatCircle size={24} />
            {/* Notification indicator */}
            <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Enhanced Widget Panel */}
      <AnimatePresence>
        {state.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 flex flex-col",
              getWidgetSizeClasses(),
              state.isMinimized && "h-12",
              // Mobile responsive classes
              "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]",
              "sm:w-96 sm:h-[600px] md:w-[28rem] md:h-[640px]"
            )}
            data-testid="widget-panel"
            data-campfire-widget-panel
          >
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🔥</span>
                </div>
                <div>
                  <div className="font-semibold text-sm">{config.organizationName}</div>
                  <div className="text-xs text-blue-100 flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${state.conversationId ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`}></div>
                    {state.conversationId ? 'Connected' : 'Connecting...'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={minimizeWidget}
                  className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  title="Minimize"
                  aria-label="Minimize widget"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={expandWidget}
                  className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  title={state.isExpanded ? "Restore" : "Expand"}
                  aria-label={state.isExpanded ? "Restore widget" : "Expand widget"}
                >
                  {state.isExpanded ? <ArrowsIn className="h-4 w-4" /> : <ArrowsOut className="h-4 w-4" />}
                </button>
                <button
                  onClick={closeWidget}
                  className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  title="Close"
                  aria-label="Close widget"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!state.isMinimized && (
              <>
                {/* Content */}
                <div className="flex-1 overflow-hidden relative">
                  {state.activeTab === 'home' && renderHomeTab()}
                  {state.activeTab === 'messages' && renderChatTab()}
                  {state.activeTab === 'help' && renderHelpTab()}

                  {/* Bottom Tab Navigation - positioned within widget */}
                  <WidgetBottomTabs
                    activeTab={state.activeTab}
                    onTabChange={switchTab}
                  />
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};