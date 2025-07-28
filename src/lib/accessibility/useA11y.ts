/**
 * Improved accessibility hook
 * Provides accessibility features for improved input components
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface A11yOptions {
  announceChanges?: boolean;
  focusManagement?: boolean;
  keyboardNavigation?: boolean;
}

export interface A11yState {
  isScreenReaderActive: boolean;
  announceMessage: (message: string) => void;
  setFocusTarget: (element: HTMLElement | null) => void;
  handleKeyboardNavigation: (event: KeyboardEvent) => boolean;
}

export function useA11y(options: A11yOptions = {}): A11yState {
  const { announceChanges = true, focusManagement = true, keyboardNavigation = true } = options;

  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  const announcementRef = useRef<HTMLDivElement | null>(null);
  const focusTargetRef = useRef<HTMLElement | null>(null);

  // Detect screen reader activity
  useEffect(() => {
    const detectScreenReader = () => {
      // Check for common screen reader indicators
      const hasScreenReader = !!(
        window.navigator.userAgent.match(/NVDA|JAWS|VoiceOver|ORCA|ChromeVox/i) ||
        window.speechSynthesis ||
        document.querySelector("[aria-live]")
      );
      setIsScreenReaderActive(hasScreenReader);
    };

    detectScreenReader();
  }, []);

  // Create announcement element for screen readers
  useEffect(() => {
    if (announceChanges && !announcementRef.current) {
      const announcer = document.createElement("div");
      announcer.setAttribute("aria-live", "polite");
      announcer.setAttribute("aria-atomic", "true");
      announcer.style.position = "absolute";
      announcer.style.left = "-10000px";
      announcer.style.width = "1px";
      announcer.style.height = "1px";
      announcer.style.overflow = "hidden";
      document.body.appendChild(announcer);
      announcementRef.current = announcer;
    }

    return () => {
      if (announcementRef.current) {
        document.body.removeChild(announcementRef.current);
        announcementRef.current = null;
      }
    };
  }, [announceChanges]);

  const announceMessage = useCallback((message: string) => {
    if (announcementRef.current && message) {
      announcementRef.current.textContent = message;
      // Clear after announcement to allow repeated announcements
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = "";
        }
      }, 1000);
    }
  }, []);

  const setFocusTarget = useCallback(
    (element: HTMLElement | null) => {
      if (focusManagement) {
        focusTargetRef.current = element;
        if (element) {
          element.focus();
        }
      }
    },
    [focusManagement]
  );

  const handleKeyboardNavigation = useCallback(
    (event: KeyboardEvent): boolean => {
      if (!keyboardNavigation) return false;

      const { key, ctrlKey, metaKey, altKey, shiftKey } = event;

      // Common keyboard navigation patterns
      switch (key) {
        case "Escape":
          // Handle escape key - could close modals, clear selections, etc.
          return true;

        case "Enter":
        case " ":
          // Handle activation keys
          if (
            event.target instanceof HTMLElement &&
            (event.target.tagName === "BUTTON" || event.target.getAttribute("role") === "button")
          ) {
            event.target.click();
            return true;
          }
          break;

        case "Tab":
          // Tab navigation is handled by browser, but we can track it
          return false;

        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
          // Arrow key navigation - could be used for custom components
          return false;

        default:
          return false;
      }

      return false;
    },
    [keyboardNavigation]
  );

  return {
    isScreenReaderActive,
    announceMessage,
    setFocusTarget,
    handleKeyboardNavigation,
  };
}
