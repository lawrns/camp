/**
 * PIXEL-PERFECT CHAT INTERFACE
 * 
 * The ultimate chat interface component that combines all design system
 * components into a meticulously crafted, Intercom-quality experience
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MessageContainer } from './MessageContainer';
import { WidgetInput } from './WidgetInput';
import { type MessageBubbleProps } from './MessageBubble';
import { SPACING, COLORS, LAYOUT, ANIMATIONS, SHADOWS, RADIUS } from './tokens';

// ============================================================================
// TYPES
// ============================================================================
export interface PixelPerfectChatInterfaceProps {
  messages: MessageBubbleProps[];
  isLoading?: boolean;
  isConnected?: boolean;
  typingUsers?: Array<{ id: string; name: string }>;
  organizationName?: string;
  className?: string;
  onSendMessage: (message: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onClose?: () => void;
  onMinimize?: () => void;
  onExpand?: () => void;
  showHeader?: boolean; // New prop to control header visibility
  showInput?: boolean;
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================
function ChatHeader({
  organizationName = "Campfire",
  isConnected = true,
  onClose,
  onMinimize,
  onExpand,
}: {
  organizationName?: string;
  isConnected?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onExpand?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: parseFloat(ANIMATIONS.normal) / 1000,
        ease: [0.0, 0.0, 0.2, 1],
      }}
      className="flex items-center justify-between"
      style={{
        height: LAYOUT.header.height,
        padding: LAYOUT.header.padding,
        background: `linear-gradient(135deg, ${COLORS.primary[600]} 0%, ${COLORS.primary[700]} 100%)`,
        color: 'white',
        borderTopLeftRadius: RADIUS.widget,
        borderTopRightRadius: RADIUS.widget,
      }}
    >
      {/* Organization info */}
      <div className="flex items-center space-x-3">
        {/* Logo/Avatar */}
        <div
          className="flex items-center justify-center"
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
          }}
        >
          <span style={{ fontSize: '16px' }}>🔥</span>
        </div>

        {/* Organization details */}
        <div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: '600',
              lineHeight: '20px',
            }}
          >
            {organizationName}
          </div>
          <div
            className="flex items-center gap-1"
            style={{
              fontSize: '12px',
              lineHeight: '16px',
              opacity: 0.9,
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10b981' : '#f59e0b',
              }}
              className={!isConnected ? 'animate-pulse' : ''}
            />
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
      </div>

      {/* Header actions */}
      <div className="flex items-center gap-1">
        {onMinimize && (
          <motion.button
            onClick={onMinimize}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg transition-colors duration-200 hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            aria-label="Minimize"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 12h12" />
            </svg>
          </motion.button>
        )}

        {onExpand && (
          <motion.button
            onClick={onExpand}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg transition-colors duration-200 hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            aria-label="Expand"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </motion.button>
        )}

        {onClose && (
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg transition-colors duration-200 hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// PIXEL-PERFECT CHAT INTERFACE
// ============================================================================
export function PixelPerfectChatInterface({
  messages,
  isLoading = false,
  isConnected = true,
  typingUsers = [],
  organizationName = "Campfire",
  className,
  onSendMessage,
  onTyping,
  onStopTyping,
  onClose,
  onMinimize,
  onExpand,
  showHeader = true,
  showInput = true,
}: PixelPerfectChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle message sending
  const handleSendMessage = useCallback((message: string) => {
    if (!message.trim()) return;
    
    onSendMessage(message.trim());
    setInputValue('');
  }, [onSendMessage]);

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: parseFloat(ANIMATIONS.normal) / 1000,
        ease: [0.0, 0.0, 0.2, 1],
      }}
      className={cn(
        'flex flex-col bg-white overflow-hidden',
        // Only apply fixed dimensions if no className is provided (standalone mode)
        !className && 'w-96 h-[600px]',
        className
      )}
      style={{
        // Only apply fixed styles in standalone mode
        ...((!className) && {
          minWidth: LAYOUT.widget.minWidth,
          maxWidth: LAYOUT.widget.maxWidth,
          minHeight: LAYOUT.widget.minHeight,
          maxHeight: LAYOUT.widget.maxHeight,
          borderRadius: RADIUS.widget,
          boxShadow: SHADOWS.widget,
          border: `1px solid ${COLORS.border}`,
        }),
      }}
    >
      {/* Header - Only show if showHeader is true */}
      {showHeader && (
        <ChatHeader
          organizationName={organizationName}
          isConnected={isConnected}
          onClose={onClose}
          onMinimize={onMinimize}
          onExpand={onExpand}
        />
      )}

      {/* Messages container */}
      <MessageContainer
        messages={messages}
        isLoading={isLoading}
        typingUsers={typingUsers}
        enableAutoScroll={true}
        enableGrouping={true}
        className="flex-1"
      />

      {/* Input area */}
      {showInput !== false && (
        <div
          className="flex-shrink-0 border-t border-gray-200"
          style={{
            minHeight: '60px',
            padding: SPACING.md,
            backgroundColor: '#ffffff'
          }}
        >
          <WidgetInput
            value={inputValue}
            onChange={handleInputChange}
            onSend={handleSendMessage}
            onTyping={onTyping}
            onStopTyping={onStopTyping}
            placeholder="Type your message..."
            disabled={!isConnected}
            autoFocus={true}
          />
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================
export default PixelPerfectChatInterface;
