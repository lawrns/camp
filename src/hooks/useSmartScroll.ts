import { useCallback, useEffect, useRef, useState } from "react";

interface UseSmartScrollOptions {
  threshold?: number; // Distance from bottom to consider "at bottom"
  autoScrollDelay?: number; // Delay before auto-scrolling
  smoothScroll?: boolean; // Use smooth scrolling
}

export const useSmartScroll = (options: UseSmartScrollOptions = {}) => {
  const { threshold = 100, autoScrollDelay = 100, smoothScroll = true } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user is near the bottom
  const isNearBottom = useCallback(() => {
    if (!containerRef.current) return false;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollHeight - scrollTop - clientHeight < threshold;
  }, [threshold]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(
    (force = false) => {
      if (!messagesEndRef.current) return;

      if (force || shouldAutoScroll) {
        messagesEndRef.current.scrollIntoView({
          behavior: smoothScroll ? "smooth" : "auto",
          block: "end",
        });
      }
    },
    [shouldAutoScroll, smoothScroll]
  );

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    // Mark user as actively scrolling
    setIsUserScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set timeout to detect when user stops scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 150);

    // Update auto-scroll behavior based on position
    const nearBottom = isNearBottom();
    setShouldAutoScroll(nearBottom);
  }, [isNearBottom]);

  // Auto-scroll when new messages arrive
  const scrollOnNewMessage = useCallback(() => {
    if (shouldAutoScroll && !isUserScrolling) {
      setTimeout(() => {
        scrollToBottom();
      }, autoScrollDelay);
    }
  }, [shouldAutoScroll, isUserScrolling, scrollToBottom, autoScrollDelay]);

  // Force scroll to bottom (for user actions like sending a message)
  const forceScrollToBottom = useCallback(() => {
    setShouldAutoScroll(true);
    setTimeout(() => {
      scrollToBottom(true);
    }, autoScrollDelay);
  }, [scrollToBottom, autoScrollDelay]);

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Initial scroll to bottom
  useEffect(() => {
    scrollToBottom(true);
  }, []);

  return {
    containerRef,
    messagesEndRef,
    shouldAutoScroll,
    isUserScrolling,
    scrollToBottom,
    scrollOnNewMessage,
    forceScrollToBottom,
    isNearBottom: isNearBottom(),
  };
};
