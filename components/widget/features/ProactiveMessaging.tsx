"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProactiveMessage {
  id: string;
  title: string;
  content: string;
  trigger: 'time_on_page' | 'scroll_depth' | 'exit_intent' | 'page_view';
  conditions: {
    timeOnPage?: number; // seconds
    scrollDepth?: number; // percentage
    pageViews?: number;
    delay?: number; // seconds before showing
  };
  actions: {
    primary?: {
      text: string;
      action: 'start_chat' | 'open_widget' | 'custom';
      customAction?: () => void;
    };
    secondary?: {
      text: string;
      action: 'dismiss' | 'custom';
      customAction?: () => void;
    };
  };
  style?: {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    theme?: 'light' | 'dark';
    primaryColor?: string;
  };
}

interface ProactiveMessagingProps {
  organizationId: string;
  messages: ProactiveMessage[];
  onStartChat?: () => void;
  onOpenWidget?: () => void;
  onDismiss?: (messageId: string) => void;
  enabled?: boolean;
  debug?: boolean;
}

export const ProactiveMessaging: React.FC<ProactiveMessagingProps> = ({
  organizationId,
  messages,
  onStartChat,
  onOpenWidget,
  onDismiss,
  enabled = true,
  debug = false
}) => {
  const [activeMessage, setActiveMessage] = useState<ProactiveMessage | null>(null);
  const [dismissedMessages, setDismissedMessages] = useState<Set<string>>(new Set());
  const [pageStartTime] = useState<number>(Date.now());
  const [scrollDepth, setScrollDepth] = useState<number>(0);
  const [pageViews, setPageViews] = useState<number>(1);
  
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const scrollListenerRef = useRef<(() => void) | null>(null);
  const exitIntentListenerRef = useRef<(() => void) | null>(null);

  // Track scroll depth
  const trackScrollDepth = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);
    setScrollDepth(scrollPercent);
  }, []);

  // Track exit intent
  const trackExitIntent = useCallback((e: MouseEvent) => {
    if (e.clientY <= 0) {
      triggerMessagesByType('exit_intent');
    }
  }, []);

  // Check if message conditions are met
  const checkMessageConditions = useCallback((message: ProactiveMessage): boolean => {
    if (dismissedMessages.has(message.id)) {
      return false;
    }

    const timeOnPage = (Date.now() - pageStartTime) / 1000;

    switch (message.trigger) {
      case 'time_on_page':
        return message.conditions.timeOnPage ? timeOnPage >= message.conditions.timeOnPage : false;
      
      case 'scroll_depth':
        return message.conditions.scrollDepth ? scrollDepth >= message.conditions.scrollDepth : false;
      
      case 'exit_intent':
        return true; // Exit intent is handled separately
      
      case 'page_view':
        return message.conditions.pageViews ? pageViews >= message.conditions.pageViews : false;
      
      default:
        return false;
    }
  }, [dismissedMessages, pageStartTime, scrollDepth, pageViews]);

  // Trigger messages by type
  const triggerMessagesByType = useCallback((triggerType: ProactiveMessage['trigger']) => {
    const eligibleMessages = messages.filter(msg => 
      msg.trigger === triggerType && checkMessageConditions(msg)
    );

    if (eligibleMessages.length > 0) {
      const message = eligibleMessages[0]; // Show first eligible message
      showMessage(message);
    }
  }, [messages, checkMessageConditions]);

  // Show a proactive message
  const showMessage = useCallback((message: ProactiveMessage) => {
    if (activeMessage || dismissedMessages.has(message.id)) {
      return;
    }

    const delay = message.conditions.delay || 0;
    
    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        setActiveMessage(message);
        if (debug) {
          console.log('[ProactiveMessaging] Showing message:', message.id);
        }
      }, delay * 1000);
      
      timeoutRefs.current.set(message.id, timeoutId);
    } else {
      setActiveMessage(message);
      if (debug) {
        console.log('[ProactiveMessaging] Showing message:', message.id);
      }
    }
  }, [activeMessage, dismissedMessages, debug]);

  // Handle message actions
  const handleAction = useCallback((action: string, customAction?: () => void) => {
    switch (action) {
      case 'start_chat':
        onStartChat?.();
        break;
      case 'open_widget':
        onOpenWidget?.();
        break;
      case 'dismiss':
        // Handled by dismiss function
        break;
      case 'custom':
        customAction?.();
        break;
    }
  }, [onStartChat, onOpenWidget]);

  // Dismiss message
  const dismissMessage = useCallback((messageId: string) => {
    setActiveMessage(null);
    setDismissedMessages(prev => new Set([...prev, messageId]));
    onDismiss?.(messageId);
    
    // Clear any pending timeout
    const timeoutId = timeoutRefs.current.get(messageId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(messageId);
    }
  }, [onDismiss]);

  // Set up scroll tracking
  useEffect(() => {
    if (!enabled) return;

    scrollListenerRef.current = trackScrollDepth;
    window.addEventListener('scroll', trackScrollDepth, { passive: true });
    
    return () => {
      if (scrollListenerRef.current) {
        window.removeEventListener('scroll', scrollListenerRef.current);
      }
    };
  }, [enabled, trackScrollDepth]);

  // Set up exit intent tracking
  useEffect(() => {
    if (!enabled) return;

    exitIntentListenerRef.current = trackExitIntent;
    document.addEventListener('mouseleave', trackExitIntent);
    
    return () => {
      if (exitIntentListenerRef.current) {
        document.removeEventListener('mouseleave', exitIntentListenerRef.current);
      }
    };
  }, [enabled, trackExitIntent]);

  // Check for time-based messages
  useEffect(() => {
    if (!enabled) return;

    const checkTimeBasedMessages = () => {
      triggerMessagesByType('time_on_page');
    };

    const interval = setInterval(checkTimeBasedMessages, 1000);
    
    return () => clearInterval(interval);
  }, [enabled, triggerMessagesByType]);

  // Check for scroll-based messages
  useEffect(() => {
    if (!enabled) return;

    triggerMessagesByType('scroll_depth');
  }, [enabled, scrollDepth, triggerMessagesByType]);

  // Check for page view messages
  useEffect(() => {
    if (!enabled) return;

    triggerMessagesByType('page_view');
  }, [enabled, pageViews, triggerMessagesByType]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutRefs.current.clear();
    };
  }, []);

  if (!enabled || !activeMessage) {
    return null;
  }

  const message = activeMessage;
  const position = message.style?.position || 'bottom-right';
  const theme = message.style?.theme || 'light';
  const primaryColor = message.style?.primaryColor || '#3b82f6';

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const getThemeClasses = () => {
    return theme === 'dark' 
      ? 'bg-gray-800 text-white border-gray-700' 
      : 'bg-white text-gray-900 border-gray-200 shadow-lg';
  };

  return (
    <div className={cn('fixed z-50', getPositionClasses())}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={cn(
            'max-w-sm rounded-lg border p-4',
            getThemeClasses()
          )}
          style={{ borderColor: primaryColor }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="font-medium text-sm">Need help?</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissMessage(message.id)}
              className="h-6 w-6 p-0"
            >
              <X size={14} />
            </Button>
          </div>

          {/* Content */}
          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-1">{message.title}</h3>
            <p className="text-sm opacity-80">{message.content}</p>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            {message.actions.primary && (
              <Button
                size="sm"
                onClick={() => {
                  handleAction(message.actions.primary!.action, message.actions.primary!.customAction);
                  dismissMessage(message.id);
                }}
                style={{ backgroundColor: primaryColor }}
                className="flex-1"
              >
                {message.actions.primary.text}
              </Button>
            )}
            
            {message.actions.secondary && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleAction(message.actions.secondary!.action, message.actions.secondary!.customAction);
                  dismissMessage(message.id);
                }}
                className="flex-1"
              >
                {message.actions.secondary.text}
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}; 