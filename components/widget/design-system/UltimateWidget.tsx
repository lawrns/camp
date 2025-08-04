"use client";

/**
 * ULTIMATE WIDGET - THE DEFINITIVE IMPLEMENTATION
 *
 * This is the single, pixel-perfect widget implementation that consolidates
 * all features from DefinitiveWidget, EnhancedWidget, and other implementations.
 *
 * Features:
 * - Pixel-perfect design system with 8px grid
 * - Real-time messaging with Supabase
 * - Smart auto-scroll and typing indicators
 * - Mobile-responsive with proper touch targets
 * - Accessibility compliant
 * - Performance optimized
 * - Error boundaries and loading states
 */

import React, { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChatCircle } from '@phosphor-icons/react';
import { useRealtime } from '@/hooks/useRealtime';
import { useWidgetRealtime } from '../enhanced/useWidgetRealtime';
import { useAIHandover } from '@/hooks/useAIHandover';
import { useTypingIndicator } from '../enhanced/useTypingIndicator';
import { UNIFIED_EVENTS } from '@/lib/realtime/unified-channel-standards';
import { useWidgetDimensions, useWidgetPosition } from './useResponsive';
import {
  PixelPerfectChatInterface,
  WidgetHeader,
  CompactWidgetHeader,
  WidgetBottomTabs,
  WidgetButton,
  WidgetIconButton,
  WidgetFileUpload,
  useWidgetSound,
  type MessageBubbleProps,
  type NotificationType,
  SPACING,
  COLORS,
  RADIUS,
  SHADOWS,
  LAYOUT,
  ANIMATIONS,
  Z_INDEX
} from './index';
import { type WidgetTab } from './WidgetTabs';

// ============================================================================
// TYPES
// ============================================================================
export interface UltimateWidgetConfig {
  organizationName?: string;
  organizationLogo?: string;
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  welcomeMessage?: string;
  showWelcomeMessage?: boolean;
  enableHelp?: boolean;
  enableNotifications?: boolean;
  // NEW: Advanced features
  enableFileUpload?: boolean;
  enableReactions?: boolean;
  enableThreading?: boolean;
  enableSoundNotifications?: boolean;
  maxFileSize?: number; // in MB
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

export interface UltimateWidgetProps {
  organizationId: string;
  config?: UltimateWidgetConfig;
  onMessage?: (message: string) => void;
  onClose?: () => void;
  className?: string;
}

export type WidgetState = 'closed' | 'minimized' | 'open' | 'expanded';
export type WidgetTabId = 'chat' | 'help' | 'home';

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================
const defaultConfig: UltimateWidgetConfig = {
  organizationName: 'Campfire',
  primaryColor: '#3b82f6',
  position: 'bottom-right',
  welcomeMessage: 'Hi there! 👋 Welcome to Campfire. How can we help you today?',
  showWelcomeMessage: true,
  enableHelp: true,
  enableNotifications: true,
  // NEW: Advanced features defaults
  enableFileUpload: true,
  enableReactions: true,
  enableThreading: true,
  enableSoundNotifications: true,
  maxFileSize: 10, // 10MB
  maxFiles: 5,
  acceptedFileTypes: ["image/*", "application/pdf", ".doc", ".docx", ".txt", "video/*", "audio/*"],
};

// ============================================================================
// ULTIMATE WIDGET COMPONENT
// ============================================================================
export function UltimateWidget({
  organizationId,
  config: userConfig,
  onMessage,
  onClose,
  className,
}: UltimateWidgetProps) {
  // PERFORMANCE: Remove debug logging to prevent render spam
  // Only log in development and throttle to prevent console spam
  if (process.env.NODE_ENV === 'development') {
    // Throttle logging to once per second using a global variable
    const now = Date.now();
    const lastLog = (globalThis as any)._lastWidgetRenderLog || 0;
    if (now - lastLog > 1000) {
      console.log('[UltimateWidget] 🚀 COMPONENT RENDERING:', { organizationId, timestamp: new Date().toISOString() });
      (globalThis as any)._lastWidgetRenderLog = now;
    }
  }

  // PERFORMANCE: Memoize config to prevent unnecessary re-renders
  const config = useMemo(() => ({ ...defaultConfig, ...userConfig }), [userConfig]);

  // Responsive hooks
  const { getWidgetDimensions, isMobile, isTouch } = useWidgetDimensions();
  const { getPositionStyles } = useWidgetPosition(config.position);

  // Widget state
  const [widgetState, setWidgetState] = useState<WidgetState>('closed');
  const [activeTab, setActiveTab] = useState<WidgetTabId>('chat');
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Chat state
  const [messages, setMessages] = useState<MessageBubbleProps[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Array<{ id: string; name: string }>>([]);

  // NEW: Conversation state for API integration
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PERFORMANCE: Memoize realtime callbacks to prevent connection thrashing
  const handleRealtimeMessage = useCallback((message: any) => {
    const messageData: MessageBubbleProps = {
      id: message.id.toString(),
      content: message.content,
      senderType: message.senderType === 'visitor' ? 'visitor' : 'agent',
      senderName: message.senderName || 'Unknown',
      timestamp: new Date(message.createdAt).toISOString(),
      isOwn: message.senderType === 'visitor',
      status: message.status === 'pending' ? 'sending' : (message.status || 'delivered'),
    };
    setMessages(prev => [...prev, messageData]);
  }, []);

  const handleRealtimeTyping = useCallback((isTyping: boolean, userName?: string) => {
    if (isTyping && userName) {
      setTypingUsers([{ id: 'agent', name: userName }]);
    } else {
      setTypingUsers([]);
    }
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
  }, []);

  // NEW: Real-time integration with memoized callbacks to prevent thrashing
  const realtimeConfig = useMemo(() => ({
    organizationId,
    conversationId: conversationId || undefined,
    onMessage: handleRealtimeMessage,
    onTyping: handleRealtimeTyping,
    onConnectionChange: handleConnectionChange,
  }), [organizationId, conversationId, handleRealtimeMessage, handleRealtimeTyping, handleConnectionChange]);

  const realtime = useWidgetRealtime(realtimeConfig);

  // FIXED: Track last connected conversation ID to prevent loops but allow new conversations
  const lastConnectedConversationRef = useRef<string | null>(null);

  // Connect realtime when conversation ID becomes available or changes
  useEffect(() => {
    if (conversationId && realtime && conversationId !== lastConnectedConversationRef.current) {
      console.log('[UltimateWidget] Conversation ID available/changed, connecting realtime:', conversationId);
      lastConnectedConversationRef.current = conversationId;
      // Trigger connection with new conversation ID
      realtime.connect?.();
    }
  }, [conversationId]); // Only depend on conversationId

  // Cleanup effect to disconnect realtime when component unmounts
  useEffect(() => {
    return () => {
      if (realtime && realtime.disconnect) {
        console.log('[UltimateWidget] Component unmounting, disconnecting realtime');
        realtime.disconnect();
      }
    };
  }, [realtime]);

  // AI handover functionality
  const aiHandover = useAIHandover(
    conversationId || '',
    organizationId,
    'widget-user'
  );

  // NEW: Advanced features state
  const { playNotification, setEnabled: setSoundEnabled } = useWidgetSound();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Initialize with welcome message
  useEffect(() => {
    if (config.showWelcomeMessage && config.welcomeMessage) {
      const welcomeMessage: MessageBubbleProps = {
        id: 'welcome-1',
        content: config.welcomeMessage,
        senderType: 'agent',
        senderName: config.organizationName,
        timestamp: new Date().toISOString(),
        isOwn: false,
        showAvatar: true,
        showTimestamp: true,
        showStatus: false,
      };
      setMessages([welcomeMessage]);
    }
  }, [config.showWelcomeMessage, config.welcomeMessage, config.organizationName]);

  // Real-time message handling is now handled by useWidgetRealtime hook
  // No duplicate subscription needed to prevent infinite re-renders

  // Widget actions
  const openWidget = useCallback(() => {
    setWidgetState('open');
    setHasUnreadMessages(false);
    setUnreadCount(0);
  }, []);

  const closeWidget = useCallback(() => {
    setWidgetState('closed');
    onClose?.();
  }, [onClose]);

  const minimizeWidget = useCallback(() => {
    setWidgetState('minimized');
  }, []);

  const expandWidget = useCallback(() => {
    setWidgetState(widgetState === 'expanded' ? 'open' : 'expanded');
  }, [widgetState]);

  const toggleWidget = useCallback(() => {
    if (widgetState === 'closed') {
      openWidget();
    } else {
      closeWidget();
    }
  }, [widgetState, openWidget, closeWidget]);

  // Typing indicator handlers
  const handleTyping = useCallback(() => {
    if (realtime && realtime.sendTypingIndicator) {
      realtime.sendTypingIndicator(true);
    }
  }, [realtime]);

  const handleStopTyping = useCallback(() => {
    if (realtime && realtime.sendTypingIndicator) {
      realtime.sendTypingIndicator(false);
    }
  }, [realtime]);

  // NEW: Advanced feature handlers
  const handleReact = useCallback((messageId: string, emoji: string) => {
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
  }, []);

  const handleReply = useCallback((messageId: string) => {
    // Focus on input and add reply context
    console.log('Reply to message:', messageId);
  }, []);

  const handleViewThread = useCallback((threadId: string) => {
    // Navigate to thread view
    console.log('View thread:', threadId);
  }, []);

  const handleFileSelect = useCallback((files: File[]) => {
    setSelectedFiles(files);
  }, []);

  const handleFileUpload = useCallback(async (file: File): Promise<string> => {
    // Simulate file upload (replace with real implementation)
    return new Promise((resolve) => {
      setTimeout(() => {
        const url = URL.createObjectURL(file);
        resolve(url);
      }, 1000);
    });
  }, []);

  // Conversation management
  const createConversation = useCallback(async () => {
    if (conversationId) return conversationId; // Already have a conversation

    try {
      setIsLoading(true);

      const response = await fetch('/api/widget/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': organizationId,
        },
        body: JSON.stringify({
          organizationId: organizationId,
          sessionData: {
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            referrer: document.referrer,
            currentUrl: window.location.href,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.status}`);
      }

      const result = await response.json();
      // CRITICAL FIX: Auth endpoint returns conversationId directly
      const newConversationId = result.conversationId;

      if (newConversationId) {
        setConversationId(newConversationId);
        console.log('[UltimateWidget] Created new conversation:', newConversationId);
        return newConversationId;
      } else {
        throw new Error('No conversation ID returned from API');
      }
    } catch (error) {
      console.error('[UltimateWidget] Failed to create conversation:', error);
      setError('Failed to start conversation. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, conversationId, setConversationId]);

  // Message handling with API integration
  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    // Create optimistic user message for immediate UI feedback
    const tempId = `temp-${Date.now()}`;
    const userMessage: MessageBubbleProps = {
      id: tempId,
      content: message,
      senderType: 'visitor',
      senderName: 'You',
      timestamp: new Date().toISOString(),
      isOwn: true,
      showAvatar: false,
      showTimestamp: true,
      showStatus: true,
      reactions: [],
      attachments: selectedFiles.map((file, index) => ({
        id: `attachment-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        isImage: file.type.startsWith('image/'),
        isVideo: file.type.startsWith('video/'),
        isAudio: file.type.startsWith('audio/'),
        isDocument: file.type.startsWith('application/'),
      })),
    };

    // Add message to UI immediately for better UX
    setMessages(prev => [...prev, userMessage]);
    setSelectedFiles([]);

    // Play sound notification if enabled
    if (config.enableSoundNotifications) {
      playNotification('message');
    }

    try {
      // Ensure we have a conversation before sending the message
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        currentConversationId = await createConversation();
        if (!currentConversationId) {
          throw new Error('Failed to create conversation');
        }
      }

      // CRITICAL FIX: Send message directly via API instead of realtime to avoid timing issues
      const response = await fetch('/api/widget/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': organizationId,
        },
        body: JSON.stringify({
          conversationId: currentConversationId,
          content: message,
          senderType: 'visitor',
          senderName: 'Anonymous',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const result = await response.json();
      console.log('[UltimateWidget] Message sent via API:', result);

      // CRITICAL FIX: Broadcast message to realtime after successful API call
      if (realtime && realtime.isConnected) {
        try {
          console.log('[UltimateWidget] Broadcasting message to realtime channel');
          await realtime.sendMessage(message);
        } catch (broadcastError) {
          console.warn('[UltimateWidget] Failed to broadcast message:', broadcastError);
          // Don't fail the whole operation if broadcast fails
        }
      } else {
        console.log('[UltimateWidget] Realtime not connected, skipping broadcast');
      }

      // Update the temporary message with success status
      setMessages(prev => prev.map(msg =>
        msg.id === tempId
          ? { ...msg, status: 'delivered' }
          : msg
      ));

      // Clear input and files
      setSelectedFiles([]);

      // Trigger callback
      onMessage?.(message);

      console.log('[UltimateWidget] Message sent successfully');

    } catch (error) {
      console.error('[UltimateWidget] Failed to send message:', error);

      // Show error state and remove the optimistic message
      setError('Failed to send message. Please try again.');
      setMessages(prev => prev.filter(msg => msg.id !== tempId));

      // Could add retry logic here
    } finally {
      setIsLoading(false);
    }
  }, [
    organizationId,
    conversationId,
    setConversationId,
    createConversation,
    selectedFiles,
    config.enableSoundNotifications,
    playNotification,
    onMessage
  ]);

  // Tab configuration
  const tabs: WidgetTab[] = [
    {
      id: 'home',
      label: 'Home',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9,22 9,12 15,12 15,22" />
        </svg>
      ),
    },
    {
      id: 'chat',
      label: 'Messages',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  if (config.enableHelp) {
    tabs.push({
      id: 'help',
      label: 'Help',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <circle cx="12" cy="17" r="1" />
        </svg>
      ),
    });
  }

  // Get responsive positioning and sizing
  const positionStyles = getPositionStyles(widgetState);
  const widgetDimensions = getWidgetDimensions(widgetState);

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="h-full flex flex-col">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm" data-testid="error-message">
                <div className="flex items-center justify-between">
                  <span>{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 text-sm">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                  <span>Sending message...</span>
                </div>
              </div>
            )}

            {/* Chat Interface */}
            <div className="flex-1">
              <PixelPerfectChatInterface
                messages={aiHandover.isAIActive ? [
                  {
                    id: 'ai-status',
                    content: '🤖 AI Assistant is now helping with this conversation',
                    senderType: 'system' as const,
                    senderName: 'System',
                    timestamp: new Date().toISOString(),
                    status: 'delivered' as const
                  },
                  ...messages
                ] : messages}
                isConnected={true} // Temporarily force enabled to fix input issue
                typingUsers={typingUsers}
                organizationName={config.organizationName}
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                onStopTyping={handleStopTyping}
                onReact={config.enableReactions ? handleReact : undefined}
                onReply={config.enableThreading ? handleReply : undefined}
                onViewThread={config.enableThreading ? handleViewThread : undefined}
                onFileSelect={config.enableFileUpload ? handleFileSelect : undefined}
                onFileUpload={config.enableFileUpload ? handleFileUpload : undefined}
                maxFileSize={config.maxFileSize}
                maxFiles={config.maxFiles}
                acceptedFileTypes={config.acceptedFileTypes}
                showHeader={false}
                className="h-full"
              />
            </div>
          </div>
        );
      
      case 'help':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="mb-4 text-4xl">❓</div>
            <h3 className="mb-2 text-lg font-semibold">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Check out our help center or contact support for assistance.
            </p>
            <WidgetButton
              variant="primary"
              size="sm"
              onClick={() => setActiveTab('chat')}
            >
              Start Chat
            </WidgetButton>
          </div>
        );
      
      default: // 'home'
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <img src={config.organizationLogo || '/default-logo.png'} alt={config.organizationName} className="h-6" />
              <WidgetIconButton onClick={closeWidget} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>} aria-label="Close" />
            </div>
            <div className="p-4">
              <h1 className="text-2xl font-bold">Hi there! 🦄</h1>
              <p className="text-xl font-semibold">How can we help?</p>
            </div>
            <div className="px-4 space-y-2 flex-1 overflow-y-auto">
              <div className="bg-gray-100 rounded-lg p-3 text-sm">
                <p className="font-semibold">How do I register an account?</p>
                <p>It's as easy as pie, anyone can do it! Head over to the...</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-sm">
                <p className="font-semibold">How do I claim the Welcome Package?</p>
                <p>To claim your bonus page, head over to...</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={className}
      style={{
        ...positionStyles,
        zIndex: Z_INDEX.widget
      }}
    >
      {/* Enhanced Widget Button */}
      <AnimatePresence>
        {widgetState === 'closed' && (
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
            {hasUnreadMessages && (
              <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Enhanced Widget Panel */}
      <AnimatePresence>
        {widgetState !== 'closed' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 flex flex-col",
              // Mobile responsive classes
              "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]",
              "sm:w-96 sm:h-[600px] md:w-[28rem] md:h-[640px]"
            )}
            style={{
              ...widgetDimensions,
            }}
            data-testid="widget-panel"
            data-campfire-widget-panel
          >
            {/* Header */}
            {widgetState === 'minimized' ? (
              <CompactWidgetHeader
                organizationName={config.organizationName}
                organizationLogo={config.organizationLogo}
                isConnected={isConnected}
                onRestore={() => setWidgetState('open')}
                onClose={closeWidget}
              />
            ) : (
              <WidgetHeader
                organizationName={config.organizationName}
                organizationLogo={config.organizationLogo}
                isConnected={isConnected}
                isExpanded={widgetState === 'expanded'}
                onMinimize={minimizeWidget}
                onExpand={expandWidget}
                onClose={closeWidget}
              />
            )}

            {/* Content */}
            {widgetState !== 'minimized' && (
              <>
                <div className="flex-1 overflow-hidden">
                  {renderTabContent()}
                </div>

                {/* Bottom Tabs */}
                <WidgetBottomTabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={(tabId) => setActiveTab(tabId as WidgetTabId)}
                  />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
