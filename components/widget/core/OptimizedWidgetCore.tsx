/**
 * Optimized Widget Core - <30KB Bundle Target
 * 
 * Ultra-lightweight core widget that loads instantly and progressively
 * enhances with advanced features. Designed for <1s mobile load times.
 * 
 * Architecture:
 * - Core: Button + basic chat (this file) - <30KB
 * - Features: Lazy-loaded on interaction - chunked
 * - Edge: Optimized for Vercel Edge Functions
 */

"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Paperclip, Smile } from 'lucide-react';
import { 
  LazyChatInterface,
  LazyFileUpload,
  LazyEmojiPicker,
  useIntelligentPreloader,
  useBundleSizeMonitor 
} from '../performance/LazyWidgetLoader';

// ============================================================================
// TYPES
// ============================================================================

interface OptimizedWidgetProps {
  organizationId: string;
  conversationId?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  welcomeMessage?: string;
  className?: string;
  onMessage?: (message: string) => void;
  onClose?: () => void;
}

interface CoreMessage {
  id: string;
  content: string;
  senderType: 'visitor' | 'agent' | 'ai';
  timestamp: string;
}

// ============================================================================
// CORE WIDGET BUTTON (Always Loaded)
// ============================================================================

interface WidgetButtonProps {
  onClick: () => void;
  isOpen: boolean;
  primaryColor: string;
  unreadCount?: number;
}

const WidgetButton = React.memo(({ onClick, isOpen, primaryColor, unreadCount }: WidgetButtonProps) => (
  <motion.button
    onClick={onClick}
    className="relative h-14 w-14 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    style={{ backgroundColor: primaryColor }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 260, damping: 20 }}
  >
    <AnimatePresence mode="wait">
      {isOpen ? (
        <motion.div
          key="close"
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <X className="h-6 w-6 text-white mx-auto" />
        </motion.div>
      ) : (
        <motion.div
          key="message"
          initial={{ rotate: 90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: -90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <MessageCircle className="h-6 w-6 text-white mx-auto" />
        </motion.div>
      )}
    </AnimatePresence>
    
    {/* Unread count badge */}
    {unreadCount && unreadCount > 0 && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center"
      >
        <span className="text-xs font-bold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      </motion.div>
    )}
  </motion.button>
));

WidgetButton.displayName = 'WidgetButton';

// ============================================================================
// MINIMAL CHAT INTERFACE (Core Bundle)
// ============================================================================

interface MinimalChatProps {
  messages: CoreMessage[];
  onSendMessage: (message: string) => void;
  onShowFileUpload: () => void;
  onShowEmojiPicker: () => void;
  isLoading?: boolean;
}

const MinimalChat = React.memo(({ 
  messages, 
  onSendMessage, 
  onShowFileUpload, 
  onShowEmojiPicker,
  isLoading 
}: MinimalChatProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);

  const handleSend = useCallback(() => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  }, [inputValue, onSendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Show advanced features after user starts typing
  useEffect(() => {
    if (inputValue.length > 0 && !showAdvancedFeatures) {
      setShowAdvancedFeatures(true);
    }
  }, [inputValue, showAdvancedFeatures]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Start a conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.senderType === 'visitor' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  message.senderType === 'visitor'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.content}
              </div>
            </motion.div>
          ))
        )}
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 px-3 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          {/* Advanced feature buttons - only show after interaction */}
          <AnimatePresence>
            {showAdvancedFeatures && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex space-x-1"
              >
                <button
                  onClick={onShowFileUpload}
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  title="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  onClick={onShowEmojiPicker}
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  title="Add emoji"
                >
                  <Smile className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

MinimalChat.displayName = 'MinimalChat';

// ============================================================================
// OPTIMIZED WIDGET CORE
// ============================================================================

export function OptimizedWidgetCore({
  organizationId,
  conversationId,
  position = 'bottom-right',
  primaryColor = '#3b82f6',
  welcomeMessage = 'Hi! How can we help you today?',
  className,
  onMessage,
  onClose,
}: OptimizedWidgetProps) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Performance hooks
  const { preloadComponent } = useIntelligentPreloader();
  const bundleMetrics = useBundleSizeMonitor();

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  // Initialize with welcome message
  useEffect(() => {
    if (welcomeMessage) {
      setMessages([{
        id: 'welcome',
        content: welcomeMessage,
        senderType: 'agent',
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [welcomeMessage]);

  // Preload components when widget opens
  useEffect(() => {
    if (isOpen) {
      // Preload file upload after 1 second
      setTimeout(() => preloadComponent('FileUpload'), 1000);
      // Preload emoji picker after 2 seconds
      setTimeout(() => preloadComponent('EmojiPicker'), 2000);
    }
  }, [isOpen, preloadComponent]);

  // Handle widget toggle
  const toggleWidget = useCallback(() => {
    setIsOpen(prev => {
      const newState = !prev;
      if (newState) {
        setUnreadCount(0); // Clear unread count when opening
      }
      return newState;
    });
  }, []);

  // Handle sending messages
  const handleSendMessage = useCallback((content: string) => {
    const newMessage: CoreMessage = {
      id: `msg_${Date.now()}`,
      content,
      senderType: 'visitor',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);
    onMessage?.(content);

    // Simulate response (in real app, this would come from realtime)
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const response: CoreMessage = {
        id: `response_${Date.now()}`,
        content: "Thanks for your message! An agent will respond shortly.",
        senderType: 'agent',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, response]);
      
      // Increment unread count if widget is closed
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    }, 1500);
  }, [onMessage, isOpen]);

  // Handle file upload
  const handleShowFileUpload = useCallback(() => {
    setShowFileUpload(true);
    preloadComponent('FileUpload');
  }, [preloadComponent]);

  // Handle emoji picker
  const handleShowEmojiPicker = useCallback(() => {
    setShowEmojiPicker(true);
    preloadComponent('EmojiPicker');
  }, [preloadComponent]);

  // Log performance metrics in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[OptimizedWidget] Bundle metrics:', bundleMetrics);
    }
  }, [bundleMetrics]);

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      {/* Widget Button */}
      <WidgetButton
        onClick={toggleWidget}
        isOpen={isOpen}
        primaryColor={primaryColor}
        unreadCount={unreadCount}
      />

      {/* Widget Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mb-4 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div 
              className="px-4 py-3 text-white flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <h3 className="font-semibold text-sm">Chat with us</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Interface */}
            <div className="h-full">
              <MinimalChat
                messages={messages}
                onSendMessage={handleSendMessage}
                onShowFileUpload={handleShowFileUpload}
                onShowEmojiPicker={handleShowEmojiPicker}
                isLoading={isLoading}
              />
            </div>

            {/* Lazy-loaded overlays */}
            <AnimatePresence>
              {showFileUpload && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white z-10"
                >
                  <Suspense fallback={<div className="p-4">Loading file upload...</div>}>
                    <LazyFileUpload onClose={() => setShowFileUpload(false)} />
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-16 right-4 z-10"
                >
                  <Suspense fallback={<div className="p-2">Loading emojis...</div>}>
                    <LazyEmojiPicker 
                      onSelect={(emoji) => {
                        // Handle emoji selection
                        setShowEmojiPicker(false);
                      }}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default OptimizedWidgetCore;
