"use client";

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";

interface AccessibilityContextType {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: number;
  announceMessage: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    // Return default values if not in provider
    return {
      reducedMotion: false,
      highContrast: false,
      fontSize: 16,
      announceMessage: () => {},
    };
  }
  return context;
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Announce messages to screen readers
  const announceMessage = (message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = "";
        }
      }, 1000);
    }
  };

  // Detect user preferences
  useEffect(() => {
    // Reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    // High contrast preference
    const contrastQuery = window.matchMedia("(prefers-contrast: high)");
    setHighContrast(contrastQuery.matches);

    const handleContrastChange = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    contrastQuery.addEventListener("change", handleContrastChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      contrastQuery.removeEventListener("change", handleContrastChange);
    };
  }, []);

  const value: AccessibilityContextType = {
    reducedMotion,
    highContrast,
    fontSize,
    announceMessage,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      {/* Screen reader announcements */}
      <div ref={announcementRef} aria-live="polite" aria-atomic="true" className="sr-only" />
    </AccessibilityContext.Provider>
  );
};

/**
 * Accessible Button Component for Widget
 */
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  children: React.ReactNode;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = "primary",
  size = "medium",
  loading = false,
  disabled,
  children,
  className = "",
  onClick,
  ...props
}) => {
  const { reducedMotion, announceMessage } = useAccessibility();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;

    // Announce action to screen readers
    announceMessage(`Button ${children} activated`);

    if (onClick) {
      onClick(e);
    }
  };

  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-ds-lg
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
    transition-colors duration-150
    ${reducedMotion ? "" : "transform hover:scale-105 active:scale-95"}
    min-h-[44px] min-w-[44px]
  `;

  const variantClasses = {
    primary: "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600",
    secondary: "bg-white text-gray-700 border border-[var(--fl-color-border-strong)] hover:bg-gray-50",
    ghost: "text-gray-600 hover:text-gray-800 hover:bg-gray-100",
  };

  const sizeClasses = {
    small: "px-3 py-2 text-sm",
    medium: "px-4 py-3 text-base",
    large: "px-6 py-4 text-lg",
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading && (
        <svg
          className="-ml-1 mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      <span className={loading ? "sr-only" : ""}>{children}</span>
      {loading && <span aria-live="polite">Loading...</span>}
    </button>
  );
};

/**
 * Focus Trap Hook for Widget Modal
 */
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Let parent handle escape
        const escapeEvent = new CustomEvent("widget-escape");
        container.dispatchEvent(escapeEvent);
      }
    };

    document.addEventListener("keydown", handleTabKey);
    document.addEventListener("keydown", handleEscapeKey);

    // Focus first element when trap becomes active
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleTabKey);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isActive]);

  return containerRef;
};

/**
 * Keyboard Navigation Hook
 */
export const useKeyboardNavigation = () => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        // Activate button/link
        if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) {
          e.target.click();
        }
        break;
      case "Escape":
        // Close widget
        const escapeEvent = new CustomEvent("widget-escape");
        document.dispatchEvent(escapeEvent);
        break;
    }
  };

  return { handleKeyDown };
};

/**
 * Screen Reader Utilities
 */
export const screenReaderUtils = {
  // Hide decorative elements from screen readers
  hideFromScreenReader: { "aria-hidden": "true" },

  // Mark as live region for announcements
  liveRegion: { "aria-live": "polite", "aria-atomic": "true" },

  // Mark as alert for urgent announcements
  alertRegion: { "aria-live": "assertive", "aria-atomic": "true" },

  // Screen reader only text
  srOnly: "sr-only",
};
