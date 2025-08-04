"use client";

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Widget UX Enhancement Hook
 * 
 * Provides Intercom-quality UX features:
 * - Auto-scroll to bottom on new messages
 * - Smooth opening/closing animations
 * - Message read tracking
 * - Typing indicators
 * - Connection status management
 */

interface UseWidgetUXOptions {
  isOpen: boolean;
  messages: unknown[];
  onOpen?: () => void;
  onClose?: () => void;
  autoScroll?: boolean;
}

export function useWidgetUX({
  isOpen,
  messages,
  onOpen,
  onClose,
  autoScroll = true
}: UseWidgetUXOptions) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((smooth = true) => {
    if (!messagesContainerRef.current || isUserScrolling) return;

    const container = messagesContainerRef.current;
    const scrollOptions: ScrollToOptions = {
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    };

    container.scrollTo(scrollOptions);
  }, [isUserScrolling]);

  // Detect user scrolling
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;

    if (!isAtBottom) {
      setIsUserScrolling(true);
      setHasNewMessages(false);
    } else {
      setIsUserScrolling(false);
      setHasNewMessages(false);
    }

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Reset user scrolling after 2 seconds of no scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 2000);
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (!autoScroll || !isOpen) return;

    const timeoutId = setTimeout(() => {
      if (isUserScrolling) {
        setHasNewMessages(true);
      } else {
        scrollToBottom(true);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [messages.length, autoScroll, isOpen, isUserScrolling, scrollToBottom]);

  // Scroll to bottom when widget opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollToBottom(false), 300);
      onOpen?.();
    } else {
      onClose?.();
    }
  }, [isOpen, scrollToBottom, onOpen, onClose]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Force scroll to bottom (for "new messages" button)
  const forceScrollToBottom = useCallback(() => {
    setIsUserScrolling(false);
    setHasNewMessages(false);
    scrollToBottom(true);
  }, [scrollToBottom]);

  return {
    messagesContainerRef,
    isUserScrolling,
    hasNewMessages,
    handleScroll,
    scrollToBottom,
    forceScrollToBottom
  };
}

/**
 * Widget Animation Hook
 * 
 * Handles smooth opening/closing animations
 */
export function useWidgetAnimation(isOpen: boolean) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsAnimating(true);
      
      // Animation complete after 300ms
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setIsAnimating(true);
      
      // Hide after animation completes
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsAnimating(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const animationClasses = {
    enter: 'animate-in slide-in-from-bottom-4 fade-in duration-300',
    exit: 'animate-out slide-out-to-bottom-4 fade-out duration-300'
  };

  return {
    shouldRender,
    isAnimating,
    animationClasses: isOpen ? animationClasses.enter : animationClasses.exit
  };
}

/**
 * Widget Connection Status Hook
 * 
 * Manages connection status and provides visual feedback
 */
export function useWidgetConnection() {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  // Simulate connection status (replace with real WebSocket logic)
  useEffect(() => {
    const timer = setTimeout(() => {
      setConnectionStatus('connected');
      setLastSeen(new Date());
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Update last seen periodically when connected
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const interval = setInterval(() => {
        setLastSeen(new Date());
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [connectionStatus]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-400';
      case 'connecting':
        return 'bg-yellow-400 animate-pulse';
      case 'disconnected':
        return 'bg-gray-400';
      case 'error':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  return {
    connectionStatus,
    lastSeen,
    getStatusColor,
    getStatusText,
    setConnectionStatus
  };
}

/**
 * Widget Typing Indicator Hook
 * 
 * Manages typing indicators for both user and agent
 */
export function useWidgetTyping() {
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const startUserTyping = useCallback(() => {
    setIsUserTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false);
    }, 3000);
  }, []);

  const stopUserTyping = useCallback(() => {
    setIsUserTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isUserTyping,
    isAgentTyping,
    setIsAgentTyping,
    startUserTyping,
    stopUserTyping
  };
}
