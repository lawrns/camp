"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Screen reader announcements
export function ScreenReaderAnnouncement({ 
  message, 
  priority = 'polite' 
}: { 
  message: string; 
  priority?: 'polite' | 'assertive';
}) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Live region for dynamic content updates
export function LiveRegion({
  children,
  priority = 'polite',
  atomic = true,
  className
}: {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}) {
  return (
    <div
      role="log"
      aria-live={priority}
      aria-atomic={atomic}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
}

// Keyboard navigation helper
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: {
    enableArrowKeys?: boolean;
    enableHomeEnd?: boolean;
    enablePageUpDown?: boolean;
    onEscape?: () => void;
    onEnter?: () => void;
  } = {}
) {
  const {
    enableArrowKeys = true,
    enableHomeEnd = true,
    enablePageUpDown = false,
    onEscape,
    onEnter,
  } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const focusableArray = Array.from(focusableElements) as HTMLElement[];
      const currentIndex = focusableArray.indexOf(document.activeElement as HTMLElement);

      switch (event.key) {
        case 'ArrowDown':
          if (enableArrowKeys && currentIndex < focusableArray.length - 1) {
            event.preventDefault();
            focusableArray[currentIndex + 1]?.focus();
          }
          break;

        case 'ArrowUp':
          if (enableArrowKeys && currentIndex > 0) {
            event.preventDefault();
            focusableArray[currentIndex - 1]?.focus();
          }
          break;

        case 'Home':
          if (enableHomeEnd && focusableArray.length > 0) {
            event.preventDefault();
            focusableArray[0]?.focus();
          }
          break;

        case 'End':
          if (enableHomeEnd && focusableArray.length > 0) {
            event.preventDefault();
            focusableArray[focusableArray.length - 1]?.focus();
          }
          break;

        case 'PageUp':
          if (enablePageUpDown && currentIndex > 0) {
            event.preventDefault();
            const newIndex = Math.max(0, currentIndex - 5);
            focusableArray[newIndex]?.focus();
          }
          break;

        case 'PageDown':
          if (enablePageUpDown && currentIndex < focusableArray.length - 1) {
            event.preventDefault();
            const newIndex = Math.min(focusableArray.length - 1, currentIndex + 5);
            focusableArray[newIndex]?.focus();
          }
          break;

        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;

        case 'Enter':
          if (onEnter && document.activeElement === container) {
            event.preventDefault();
            onEnter();
          }
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, enableArrowKeys, enableHomeEnd, enablePageUpDown, onEscape, onEnter]);
}

// Focus trap for modals and overlays
export function FocusTrap({
  children,
  isActive = true,
  restoreFocus = true,
  className
}: {
  children: React.ReactNode;
  isActive?: boolean;
  restoreFocus?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Focus the first focusable element
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
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
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, restoreFocus]);

  if (!isActive) return <>{children}</>;

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// Skip link for keyboard navigation
export function SkipLink({
  href,
  children = "Skip to main content",
  className
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
        'bg-blue-600 text-white px-4 py-2 rounded-md z-50',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        className
      )}
    >
      {children}
    </a>
  );
}

// Accessible button with proper ARIA attributes
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaPressed,
  className,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaPressed?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
      aria-busy={loading}
      className={cn(
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        className
      )}
      {...props}
    >
      {children}
      {loading && (
        <span className="sr-only">Loading...</span>
      )}
    </button>
  );
}

// Accessible form field with proper labeling
export function AccessibleFormField({
  id,
  label,
  description,
  error,
  required = false,
  children,
  className
}: {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const ariaDescribedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {description && (
        <p id={descriptionId} className="text-sm text-gray-600">
          {description}
        </p>
      )}

      <div>
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-describedby': ariaDescribedBy,
          'aria-invalid': error ? 'true' : undefined,
          'aria-required': required,
        })}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// High contrast mode detection
export function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
}

// Reduced motion detection
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Accessible tooltip with proper ARIA
export function AccessibleTooltip({
  children,
  content,
  id,
  className
}: {
  children: React.ReactNode;
  content: string;
  id: string;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-describedby={isVisible ? id : undefined}
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            id={id}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            className={cn(
              'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2',
              'bg-gray-900 text-white text-sm px-2 py-1 rounded',
              'pointer-events-none z-50',
              className
            )}
          >
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Accessible progress indicator
export function AccessibleProgress({
  value,
  max = 100,
  label,
  description,
  className
}: {
  value: number;
  max?: number;
  label: string;
  description?: string;
  className?: string;
}) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{percentage}%</span>
      </div>
      
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        aria-describedby={description ? `${label}-description` : undefined}
        className="w-full bg-gray-200 rounded-full h-2"
      >
        <motion.div
          className="bg-blue-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      
      {description && (
        <p id={`${label}-description`} className="text-xs text-gray-600">
          {description}
        </p>
      )}
    </div>
  );
}
