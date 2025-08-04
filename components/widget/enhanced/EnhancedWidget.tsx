"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatCircle,
  X,
  Minus,
  ArrowsOut,
  ArrowsIn,
  Robot
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { WidgetConfig } from './EnhancedWidgetProvider';

// Import existing widget components
import { WelcomeScreen } from '../components/WelcomeScreen';
import { WidgetBottomTabs, WidgetTabType } from '../components/WidgetBottomTabs';
import { HelpTab } from '../components/HelpTab';

// Import enterprise-grade enhanced-messaging components
import { EnhancedMessageList } from '@/components/enhanced-messaging/EnhancedMessageList';
import { MessageData } from '@/components/enhanced-messaging/EnhancedMessageBubble';
import { TypingUser } from '@/components/enhanced-messaging/EnhancedTypingIndicator';

// Import pixel-perfect design system
import { PixelPerfectChatInterface } from '../design-system';

// Import simplified real-time hook
import { useWidgetRealtime } from '../hooks/useWidgetRealtime';

// Import AI handover functionality
import { useAIHandover } from '@/hooks/useAIHandover';

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

  // AI handover functionality
  const aiHandover = useAIHandover(
    state.conversationId || '',
    organizationId,
    'widget-user'
  );

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

  // DON'T initialize conversation immediately - wait for first message
  // This prevents empty conversations from cluttering the inbox

  // Create conversation with first message atomically
  const createConversationWithFirstMessage = async (content: string, attachments?: File[], metadata?: any): Promise<string | null> => {
    try {
      setIsLoading(true);

      // Create conversation and send first message in one API call
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
          initialMessage: content, // Include first message
          metadata: {
            source: 'widget',
            hasInitialMessage: true,
            ...metadata
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const conversationId = data.conversation?.id || data.conversationId || data.id;
        setState(prev => ({ ...prev, conversationId }));

        // Add welcome message if configured
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

        return conversationId;
      }

      console.error('Failed to create conversation:', response.statusText);
      return null;
    } catch (error) {
      console.error('Failed to create conversation with first message:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced message sending with enterprise-grade composer
  const handleSendMessage = async (content: string, attachments?: File[], metadata?: any) => {
    if (!content.trim()) return;

    // Create conversation lazily if it doesn't exist
    let conversationId = state.conversationId;
    let isFirstMessage = false;

    if (!conversationId) {
      const newConversationId = await createConversationWithFirstMessage(content, attachments, metadata);
      if (!newConversationId) return; // Failed to create conversation
      conversationId = newConversationId;
      isFirstMessage = true;
    }

    const userMessage: MessageData = {
      id: `msg-${Date.now()}`,
      content,
      senderType: 'user',
      senderName: 'You',
      timestamp: new Date().toISOString(),
      status: isFirstMessage ? 'sent' : 'sending', // First message is already sent via conversation creation
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

    // If this is the first message, it was already sent during conversation creation
    if (isFirstMessage) {
      return; // Skip sending the message again
    }

    try {
      const response = await fetch('/api/widget/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': organizationId,
        },
        body: JSON.stringify({
          conversationId: conversationId,
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

  // Get position classes with 8px grid spacing
  const getPositionClasses = () => {
    const base = 'fixed z-50';
    switch (config.position) {
      case 'bottom-left':
        return `${base} bottom-4 left-4`; // 16px from edges (follows 8px grid)
      default:
        return `${base} bottom-4 right-4`; // 16px from edges (follows 8px grid)
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

  // Enhanced chat tab using pixel-perfect design system
  const renderChatTab = () => {
    // Convert messages to pixel-perfect format
    const pixelPerfectMessages = messages.map((message) => ({
      id: message.id,
      content: message.content,
      senderType: message.senderType === "user" ? "visitor" as const :
                  message.senderType === "ai" ? "agent" as const :
                  message.senderType as "agent" | "system",
      senderName: message.senderName,
      timestamp: message.timestamp,
      isOwn: message.senderType === "user",
      showAvatar: true,
      showTimestamp: true,
      showStatus: message.senderType === "user",
    }));

    // Add AI handover status message if AI is active
    const messagesWithAIStatus = aiHandover.isAIActive
      ? [
          {
            id: 'ai-status',
            content: '🤖 AI Assistant is now helping with this conversation',
            senderType: 'system' as const,
            senderName: 'System',
            timestamp: new Date().toISOString(),
            status: 'delivered' as const,
            metadata: { isSystemMessage: true }
          },
          ...pixelPerfectMessages
        ]
      : pixelPerfectMessages;

    return (
      <div className="h-full">
        <PixelPerfectChatInterface
          messages={messagesWithAIStatus}
          isConnected={!!state.conversationId}
          typingUsers={typingUsers}
          organizationName={config.organizationName}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onStopTyping={handleStopTyping}
          className="h-full"
          showHeader={false}
        />
      </div>
    );
  };



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
            {/* Notification indicator - 8px grid aligned */}
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
            {/* Enhanced Header - Using 8px grid spacing */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🔥</span>
                </div>
                <div>
                  <div className="font-semibold text-sm">{config.organizationName}</div>
                  <div className="text-xs text-blue-100 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${state.conversationId ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`}></div>
                    {state.conversationId ? 'Connected' : 'Connecting...'}
                    {aiHandover.isAIActive && (
                      <div className="flex items-center gap-1 ml-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                        <span>AI Active</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* AI Handover Button */}
                {state.conversationId && (
                  <button
                    onClick={() => aiHandover.isAIActive ? aiHandover.stopHandover() : aiHandover.startHandover()}
                    className={`p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                      aiHandover.isAIActive
                        ? 'bg-green-500 bg-opacity-20 text-green-100 hover:bg-green-500 hover:bg-opacity-30'
                        : 'hover:bg-white hover:bg-opacity-20'
                    }`}
                    title={aiHandover.isAIActive ? "Stop AI Assistant" : "Start AI Assistant"}
                    aria-label={aiHandover.isAIActive ? "Stop AI Assistant" : "Start AI Assistant"}
                    disabled={aiHandover.isProcessing}
                  >
                    <Robot className={`h-4 w-4 ${aiHandover.isProcessing ? 'animate-pulse' : ''}`} />
                  </button>
                )}
                <button
                  onClick={minimizeWidget}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  title="Minimize"
                  aria-label="Minimize widget"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={expandWidget}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  title={state.isExpanded ? "Restore" : "Expand"}
                  aria-label={state.isExpanded ? "Restore widget" : "Expand widget"}
                >
                  {state.isExpanded ? <ArrowsIn className="h-4 w-4" /> : <ArrowsOut className="h-4 w-4" />}
                </button>
                <button
                  onClick={closeWidget}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
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
                <div className="flex-1 overflow-hidden relative pb-14">
                  {state.activeTab === 'home' && renderHomeTab()}
                  {state.activeTab === 'messages' && renderChatTab()}
                  {state.activeTab === 'help' && renderHelpTab()}
                </div>
                
                {/* Bottom Tab Navigation - positioned outside content */}
                <WidgetBottomTabs
                  activeTab={state.activeTab}
                  onTabChange={switchTab}
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};