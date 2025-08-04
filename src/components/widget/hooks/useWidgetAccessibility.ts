"use client";

import { useEffect, useRef, useCallback } from 'react';

/**
 * Widget Accessibility Hook
 * 
 * Provides accessibility features for the widget including:
 * - Focus management
 * - Keyboard navigation
 * - Screen reader announcements
 * - ARIA live regions
 */

interface UseWidgetAccessibilityOptions {
  isOpen: boolean;
  onClose: () => void;
  announceMessages?: boolean;
}

export function useWidgetAccessibility({
  isOpen,
  onClose,
  announceMessages = true
}: UseWidgetAccessibilityOptions) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Focus management when widget opens/closes
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the widget container
      setTimeout(() => {
        const firstFocusable = widgetRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          widgetRef.current?.focus();
        }
      }, 100);
    } else {
      // Restore focus to previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
        
      case 'Tab':
        // Trap focus within widget
        if (widgetRef.current) {
          const focusableElements = widgetRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement?.focus();
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement?.focus();
            }
          }
        }
        break;
    }
  }, [isOpen, onClose]);

  // Set up keyboard event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Announce messages to screen readers
  const announceMessage = useCallback((message: string) => {
    if (!announceMessages || !liveRegionRef.current) return;
    
    // Clear previous announcement
    liveRegionRef.current.textContent = '';
    
    // Add new announcement after a brief delay
    setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = message;
      }
    }, 100);
  }, [announceMessages]);

  // Create live region for announcements
  useEffect(() => {
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.id = 'widget-live-region';
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    return () => {
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        document.body.removeChild(liveRegionRef.current);
        liveRegionRef.current = null;
      }
    };
  }, []);

  // Announce widget state changes
  useEffect(() => {
    if (isOpen) {
      announceMessage('Chat widget opened. You can now send messages to customer support.');
    } else {
      announceMessage('Chat widget closed.');
    }
  }, [isOpen, announceMessage]);

  // Get ARIA attributes for widget container
  const getWidgetAriaProps = () => ({
    ref: widgetRef,
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'widget-header-title',
    'aria-describedby': 'widget-description',
    tabIndex: -1
  });

  // Get ARIA attributes for messages container
  const getMessagesAriaProps = () => ({
    role: 'log',
    'aria-live': 'polite',
    'aria-label': 'Chat messages'
  });

  // Get ARIA attributes for input
  const getInputAriaProps = () => ({
    'aria-label': 'Type your message',
    'aria-describedby': 'input-help'
  });

  // Get ARIA attributes for send button
  const getSendButtonAriaProps = (disabled: boolean) => ({
    'aria-label': disabled ? 'Send message (disabled)' : 'Send message',
    'aria-disabled': disabled
  });

  return {
    widgetRef,
    announceMessage,
    getWidgetAriaProps,
    getMessagesAriaProps,
    getInputAriaProps,
    getSendButtonAriaProps
  };
}

/**
 * Hook for managing focus within the widget
 */
export function useWidgetFocus() {
  const focusableElementsSelector = 
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const getFocusableElements = (container: HTMLElement) => {
    return Array.from(container.querySelectorAll(focusableElementsSelector)) as HTMLElement[];
  };

  const focusFirst = (container: HTMLElement) => {
    const elements = getFocusableElements(container);
    elements[0]?.focus();
  };

  const focusLast = (container: HTMLElement) => {
    const elements = getFocusableElements(container);
    elements[elements.length - 1]?.focus();
  };

  const focusNext = (container: HTMLElement, currentElement: HTMLElement) => {
    const elements = getFocusableElements(container);
    const currentIndex = elements.indexOf(currentElement);
    const nextIndex = (currentIndex + 1) % elements.length;
    elements[nextIndex]?.focus();
  };

  const focusPrevious = (container: HTMLElement, currentElement: HTMLElement) => {
    const elements = getFocusableElements(container);
    const currentIndex = elements.indexOf(currentElement);
    const previousIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
    elements[previousIndex]?.focus();
  };

  return {
    getFocusableElements,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious
  };
}

/**
 * Hook for managing reduced motion preferences
 */
export function useReducedMotion() {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  return { prefersReducedMotion };
}

/**
 * Hook for managing high contrast preferences
 */
export function useHighContrast() {
  const prefersHighContrast = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-contrast: high)').matches
    : false;

  return { prefersHighContrast };
}
