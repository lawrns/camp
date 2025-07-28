/**
 * Accessibility React Hooks
 * Provides hooks for common accessibility patterns
 */

import { RefObject, useCallback, useEffect, useRef, useState } from "react";

/**
 * Trap focus within an element (useful for modals, dialogs)
 */
export function useFocusTrap(isActive: boolean = true): RefObject<HTMLDivElement> {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element on mount
    firstFocusable?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Emit custom event for parent to handle
        container.dispatchEvent(new CustomEvent("escape"));
      }
    };

    container.addEventListener("keydown", handleTabKey);
    container.addEventListener("keydown", handleEscapeKey);

    return () => {
      container.removeEventListener("keydown", handleTabKey);
      container.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Announce messages to screen readers
 */
export function useAnnounce() {
  const [announcement, setAnnouncement] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout>();

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set the announcement
    setAnnouncement(`${priority === "assertive" ? "Alert: " : ""}${message}`);

    // Clear after 1 second to allow re-announcement of same message
    timeoutRef.current = setTimeout(() => {
      setAnnouncement("");
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { announcement, announce };
}

/**
 * Keyboard navigation for lists and grids
 */
export function useKeyboardNavigation<T extends HTMLElement>(
  items: T[],
  options: {
    orientation?: "horizontal" | "vertical" | "grid";
    loop?: boolean;
    onSelect?: (index: number, item: T) => void;
  } = {}
) {
  const { orientation = "vertical", loop = true, onSelect } = options;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const { key } = e;
      let newIndex = activeIndex;

      switch (key) {
        case "ArrowUp":
          if (orientation !== "horizontal") {
            e.preventDefault();
            newIndex = activeIndex - 1;
            if (newIndex < 0) {
              newIndex = loop ? items.length - 1 : 0;
            }
          }
          break;

        case "ArrowDown":
          if (orientation !== "horizontal") {
            e.preventDefault();
            newIndex = activeIndex + 1;
            if (newIndex >= items.length) {
              newIndex = loop ? 0 : items.length - 1;
            }
          }
          break;

        case "ArrowLeft":
          if (orientation !== "vertical") {
            e.preventDefault();
            newIndex = activeIndex - 1;
            if (newIndex < 0) {
              newIndex = loop ? items.length - 1 : 0;
            }
          }
          break;

        case "ArrowRight":
          if (orientation !== "vertical") {
            e.preventDefault();
            newIndex = activeIndex + 1;
            if (newIndex >= items.length) {
              newIndex = loop ? 0 : items.length - 1;
            }
          }
          break;

        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;

        case "End":
          e.preventDefault();
          newIndex = items.length - 1;
          break;

        case "Enter":
        case " ":
          e.preventDefault();
          if (onSelect && items[activeIndex]) {
            onSelect(activeIndex, items[activeIndex]);
          }
          return;

        default:
          return;
      }

      if (newIndex !== activeIndex && items[newIndex]) {
        setActiveIndex(newIndex);
        items[newIndex].focus();
      }
    },
    [activeIndex, items, orientation, loop, onSelect]
  );

  useEffect(() => {
    const activeItem = items[activeIndex];
    if (activeItem) {
      activeItem.addEventListener("keydown", handleKeyDown);
      return () => {
        activeItem.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [activeIndex, items, handleKeyDown]);

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
  };
}

/**
 * Manage ARIA live regions
 */
export function useLiveRegion(
  mode: "polite" | "assertive" = "polite",
  relevant: "additions" | "removals" | "text" | "all" = "additions"
) {
  const [content, setContent] = useState("");
  const regionRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string) => {
    setContent(message);
    // Clear after announcement to allow re-announcement
    setTimeout(() => setContent(""), 100);
  }, []);

  useEffect(() => {
    if (regionRef.current) {
      regionRef.current.setAttribute("aria-live", mode);
      regionRef.current.setAttribute("aria-relevant", relevant);
      regionRef.current.setAttribute("aria-atomic", "true");
    }
  }, [mode, relevant]);

  return { regionRef, announce, content };
}

/**
 * Skip to main content link
 */
export function useSkipLink(mainContentId: string = "main-content") {
  const [isVisible, setIsVisible] = useState(false);

  const handleFocus = useCallback(() => setIsVisible(true), []);
  const handleBlur = useCallback(() => setIsVisible(false), []);

  const skipToMain = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();
      const mainContent = document.getElementById(mainContentId);
      if (mainContent) {
        mainContent.tabIndex = -1;
        mainContent.focus();
        mainContent.scrollIntoView();
      }
    },
    [mainContentId]
  );

  return {
    isVisible,
    handleFocus,
    handleBlur,
    skipToMain,
  };
}

/**
 * Reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * High contrast mode detection
 */
export function useHighContrast(): boolean {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: high)");
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isHighContrast;
}

/**
 * Color scheme preference
 */
export function useColorScheme(): "light" | "dark" {
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setColorScheme(mediaQuery.matches ? "dark" : "light");

    const handleChange = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return colorScheme;
}

/**
 * Click outside handler (with accessibility considerations)
 */
export function useClickOutside<T extends HTMLElement>(
  handler: () => void,
  excludeElements?: RefObject<HTMLElement>[]
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Check if click is inside ref element
      if (ref.current && ref.current.contains(target)) {
        return;
      }

      // Check if click is inside any excluded elements
      if (excludeElements?.some((excludeRef) => excludeRef.current?.contains(target))) {
        return;
      }

      handler();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handler();
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handler, excludeElements]);

  return ref;
}

/**
 * Manage ARIA expanded state
 */
export function useAriaExpanded(initialState: boolean = false) {
  const [isExpanded, setIsExpanded] = useState(initialState);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return {
    isExpanded,
    setIsExpanded,
    toggle,
    "aria-expanded": isExpanded,
  };
}

/**
 * Focus visible state management
 */
export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsFocusVisible(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setIsFocusVisible(false);
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsFocusVisible(false);
  }, []);

  return {
    isFocusVisible,
    isFocused,
    handleFocus,
    handleBlur,
    handleMouseDown,
  };
}

/**
 * Skip links functionality
 */
export function useSkipLinks() {
  const skipToMain = useCallback(() => {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  }, []);

  const skipToNavigation = useCallback(() => {
    const navigation = document.getElementById("navigation");
    if (navigation) {
      navigation.focus();
      navigation.scrollIntoView();
    }
  }, []);

  return {
    skipToMain,
    skipToNavigation,
  };
}
