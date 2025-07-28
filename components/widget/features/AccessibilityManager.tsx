/**
 * Accessibility Manager for Widget Consolidation
 *
 * Comprehensive WCAG 2.1 AA compliance implementation:
 * - Focus trap management
 * - Keyboard navigation
 * - Screen reader announcements
 * - High contrast support
 * - Reduced motion support
 */

import React, { useEffect, useRef, useCallback } from "react";

interface AccessibilityManagerProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

// Focus trap implementation
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const getFocusableElements = () => {
      const focusableSelectors = [
        "button:not([disabled])",
        "input:not([disabled])",
        "textarea:not([disabled])",
        "select:not([disabled])",
        "a[href]",
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
      ].join(", ");

      return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: move to previous element
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: move to next element
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        // Focus will be restored when the trap is deactivated
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      }
    };

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keydown", handleEscape);

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", handleEscape);

      // Restore focus to the previously active element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

// Screen reader announcements
export function useScreenReaderAnnouncements() {
  const announceRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    if (!announceRef.current) return;

    // Clear previous announcement
    announceRef.current.textContent = "";
    announceRef.current.setAttribute("aria-live", priority);

    // Add new announcement after a brief delay to ensure it's read
    setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = message;
      }
    }, 100);
  }, []);

  const AnnouncementRegion = () => (
    <div
      ref={announceRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      data-testid="screen-reader-announcements"
    />
  );

  return { announce, AnnouncementRegion };
}

// Keyboard navigation helpers
export function useKeyboardNavigation(onClose: () => void) {
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Global keyboard shortcuts
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          onClose();
          break;

        // Add more global shortcuts as needed
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [onClose]);
}

// High contrast detection
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  useEffect(() => {
    const checkHighContrast = () => {
      // Check for Windows high contrast mode
      const isWindowsHighContrast = window.matchMedia("(prefers-contrast: high)").matches;

      // Check for forced colors (Windows high contrast)
      const isForcedColors = window.matchMedia("(forced-colors: active)").matches;

      setIsHighContrast(isWindowsHighContrast || isForcedColors);
    };

    checkHighContrast();

    // Listen for changes
    const contrastQuery = window.matchMedia("(prefers-contrast: high)");
    const forcedColorsQuery = window.matchMedia("(forced-colors: active)");

    contrastQuery.addEventListener("change", checkHighContrast);
    forcedColorsQuery.addEventListener("change", checkHighContrast);

    return () => {
      contrastQuery.removeEventListener("change", checkHighContrast);
      forcedColorsQuery.removeEventListener("change", checkHighContrast);
    };
  }, []);

  return isHighContrast;
}

// Reduced motion detection
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    handleChange(); // Set initial value
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

// Main Accessibility Manager component
export function AccessibilityManager({ children, isOpen, onClose }: AccessibilityManagerProps) {
  const focusTrapRef = useFocusTrap(isOpen);
  const { announce, AnnouncementRegion } = useScreenReaderAnnouncements();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();

  useKeyboardNavigation(onClose);

  // Announce when widget opens/closes
  useEffect(() => {
    if (isOpen) {
      announce("Chat widget opened. Use Tab to navigate, Enter to send messages, Escape to close.");
    } else {
      announce("Chat widget closed.");
    }
  }, [isOpen, announce]);

  return (
    <div
      ref={focusTrapRef}
      className={` ${isHighContrast ? "high-contrast" : ""} ${prefersReducedMotion ? "reduced-motion" : ""} `}
      data-high-contrast={isHighContrast}
      data-reduced-motion={prefersReducedMotion}
    >
      <AnnouncementRegion />
      {children}
    </div>
  );
}

// Utility function for accessible button props
export function getAccessibleButtonProps(
  label: string,
  description?: string,
  isPressed?: boolean,
  isExpanded?: boolean
) {
  return {
    "aria-label": label,
    "aria-describedby": description ? `${label.toLowerCase().replace(/\s+/g, "-")}-description` : undefined,
    "aria-pressed": isPressed,
    "aria-expanded": isExpanded,
    role: "button",
    tabIndex: 0,
  };
}

// Utility function for accessible form field props
export function getAccessibleFieldProps(
  label: string,
  id: string,
  description?: string,
  error?: string,
  required?: boolean
) {
  return {
    id,
    "aria-label": label,
    "aria-describedby":
      [description ? `${id}-description` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined,
    "aria-invalid": error ? "true" : undefined,
    "aria-required": required,
    required,
  };
}

// CSS classes for accessibility states
export const accessibilityClasses = {
  // Screen reader only content
  srOnly: "sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",

  // Focus visible styles
  focusVisible:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2",

  // High contrast mode styles
  highContrast: "high-contrast:border-2 high-contrast:border-solid high-contrast:border-current",

  // Reduced motion styles
  reducedMotion: "motion-reduce:transition-none motion-reduce:animate-none",

  // Skip link styles
  skipLink: "absolute -top-10 left-6 bg-purple-600 text-white px-4 py-2 rounded-ds-md z-50 focus:top-6 transition-all",
};

export default AccessibilityManager;
