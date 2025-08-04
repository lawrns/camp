/**
 * Comprehensive Keyboard Navigation Hook
 *
 * WCAG 2.1 AA compliant keyboard navigation for widget consolidation:
 * - Tab navigation with focus trapping
 * - Arrow key navigation for lists
 * - Enter/Space activation
 * - Escape key handling
 * - Custom keyboard shortcuts
 */

import { useEffect, useCallback, useRef } from "react";

interface KeyboardNavigationOptions {
  isActive?: boolean;
  onEscape?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (direction: "forward" | "backward") => void;
  customShortcuts?: Record<string, () => void>;
  trapFocus?: boolean;
  autoFocus?: boolean;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    isActive = true,
    onEscape,
    onEnter,
    onSpace,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    customShortcuts = {},
    trapFocus = false,
    autoFocus = false,
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'button:not([disabled]):not([aria-hidden="true"])',
      'input:not([disabled]):not([aria-hidden="true"])',
      'textarea:not([disabled]):not([aria-hidden="true"])',
      'select:not([disabled]):not([aria-hidden="true"])',
      'a[href]:not([aria-hidden="true"])',
      '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
      '[contenteditable="true"]:not([aria-hidden="true"])',
      '[role="button"]:not([disabled]):not([aria-hidden="true"])',
      '[role="menuitem"]:not([disabled]):not([aria-hidden="true"])',
      '[role="tab"]:not([disabled]):not([aria-hidden="true"])',
    ].join(", ");

    return Array.from(containerRef.current.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }, []);

  // Focus trap implementation
  const handleFocusTrap = useCallback(
    (event: KeyboardEvent) => {
      if (!trapFocus || event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const currentElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab: move to previous element
        if (currentElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: move to next element
        if (currentElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [trapFocus, getFocusableElements]
  );

  // Main keyboard event handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive) return;

      // Handle focus trap first
      handleFocusTrap(event);

      // Handle standard navigation keys
      switch (event.key) {
        case "Escape":
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;

        case "Enter":
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;

        case " ":
        case "Space":
          if (onSpace) {
            event.preventDefault();
            onSpace();
          }
          break;

        case "ArrowUp":
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;

        case "ArrowDown":
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;

        case "ArrowLeft":
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;

        case "ArrowRight":
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;

        case "Tab":
          if (onTab) {
            const direction = event.shiftKey ? "backward" : "forward";
            onTab(direction);
          }
          break;

        default:
          // Handle custom shortcuts
          const shortcutKey =
            event.ctrlKey || event.metaKey ? `${event.ctrlKey ? "Ctrl+" : "Cmd+"}${event.key}` : event.key;

          if (customShortcuts[shortcutKey]) {
            event.preventDefault();
            customShortcuts[shortcutKey]();
          }
          break;
      }
    },
    [
      isActive,
      handleFocusTrap,
      onEscape,
      onEnter,
      onSpace,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onTab,
      customShortcuts,
    ]
  );

  // Auto-focus management
  useEffect(() => {
    if (!isActive || !autoFocus) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the first focusable element in the container
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      // Restore focus to the previously active element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, autoFocus, getFocusableElements]);

  // Event listener management
  useEffect(() => {
    if (!isActive) return;

    const element = containerRef.current || document;
    element.addEventListener("keydown", handleKeyDown);

    return () => {
      element.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive, handleKeyDown]);

  // Utility functions for programmatic navigation
  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [getFocusableElements]);

  const focusNext = useCallback(() => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1].focus();
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus(); // Wrap to first
    }
  }, [getFocusableElements]);

  const focusPrevious = useCallback(() => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    if (currentIndex > 0) {
      focusableElements[currentIndex - 1].focus();
    } else if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus(); // Wrap to last
    }
  }, [getFocusableElements]);

  const focusElement = useCallback((selector: string) => {
    if (!containerRef.current) return false;

    const element = containerRef.current.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      return true;
    }
    return false;
  }, []);

  return {
    containerRef,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    focusElement,
    getFocusableElements,
  };
}

// Specialized hook for list navigation (e.g., FAQ items, menu items)
export function useListNavigation(items: unknown[], onSelect?: (index: number) => void, isActive: boolean = true) {
  const currentIndex = useRef(0);

  const handleArrowUp = useCallback(() => {
    currentIndex.current = currentIndex.current > 0 ? currentIndex.current - 1 : items.length - 1;

    // Focus the new item
    const element = document.querySelector(`[data-list-index="${currentIndex.current}"]`) as HTMLElement;
    if (element) {
      element.focus();
    }
  }, [items.length]);

  const handleArrowDown = useCallback(() => {
    currentIndex.current = currentIndex.current < items.length - 1 ? currentIndex.current + 1 : 0;

    // Focus the new item
    const element = document.querySelector(`[data-list-index="${currentIndex.current}"]`) as HTMLElement;
    if (element) {
      element.focus();
    }
  }, [items.length]);

  const handleEnter = useCallback(() => {
    if (onSelect) {
      onSelect(currentIndex.current);
    }
  }, [onSelect]);

  const { containerRef } = useKeyboardNavigation({
    isActive,
    onArrowUp: handleArrowUp,
    onArrowDown: handleArrowDown,
    onEnter: handleEnter,
    onSpace: handleEnter, // Space also selects
  });

  return {
    containerRef,
    currentIndex: currentIndex.current,
    setCurrentIndex: (index: number) => {
      currentIndex.current = Math.max(0, Math.min(index, items.length - 1));
    },
  };
}

// Hook for managing roving tabindex pattern
export function useRovingTabindex(itemSelector: string, isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);
  const currentIndex = useRef(0);

  const updateTabindex = useCallback(() => {
    if (!containerRef.current) return;

    const items = Array.from(containerRef.current.querySelectorAll(itemSelector)) as HTMLElement[];

    items.forEach((item, index) => {
      item.setAttribute("tabindex", index === currentIndex.current ? "0" : "-1");
    });
  }, [itemSelector]);

  const moveToIndex = useCallback(
    (index: number) => {
      if (!containerRef.current) return;

      const items = Array.from(containerRef.current.querySelectorAll(itemSelector)) as HTMLElement[];

      if (index >= 0 && index < items.length) {
        currentIndex.current = index;
        updateTabindex();
        items[index].focus();
      }
    },
    [itemSelector, updateTabindex]
  );

  const handleArrowKeys = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive) return;

      const items = Array.from(containerRef.current?.querySelectorAll(itemSelector) || []) as HTMLElement[];

      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          moveToIndex((currentIndex.current + 1) % items.length);
          break;

        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          moveToIndex(currentIndex.current === 0 ? items.length - 1 : currentIndex.current - 1);
          break;

        case "Home":
          event.preventDefault();
          moveToIndex(0);
          break;

        case "End":
          event.preventDefault();
          moveToIndex(items.length - 1);
          break;
      }
    },
    [isActive, itemSelector, moveToIndex]
  );

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("keydown", handleArrowKeys);
    updateTabindex();

    return () => {
      container.removeEventListener("keydown", handleArrowKeys);
    };
  }, [isActive, handleArrowKeys, updateTabindex]);

  return {
    containerRef,
    currentIndex: currentIndex.current,
    moveToIndex,
    updateTabindex,
  };
}
