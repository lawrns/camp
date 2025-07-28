import { useCallback, useRef } from "react";

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefaultTouchmoveEvent?: boolean;
  trackTouch?: boolean;
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
  isTracking: boolean;
}

export function useSwipeGestures(config: SwipeConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchmoveEvent = false,
    trackTouch = true,
  } = config;

  const touchData = useRef<TouchData>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isTracking: false,
  });

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!trackTouch) return;

      const touch = e.touches[0];
      if (!touch) return;

      touchData.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isTracking: true,
      };
    },
    [trackTouch]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchData.current.isTracking) return;

      if (preventDefaultTouchmoveEvent) {
        e.preventDefault();
      }
    },
    [preventDefaultTouchmoveEvent]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchData.current.isTracking) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchData.current.startX;
      const deltaY = touch.clientY - touchData.current.startY;
      const deltaTime = Date.now() - touchData.current.startTime;

      // Reset tracking
      touchData.current.isTracking = false;

      // Check if it was a quick swipe (less than 300ms)
      if (deltaTime > 300) return;

      // Determine if horizontal or vertical swipe
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Horizontal swipe
      if (absX > absY && absX > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }

      // Vertical swipe
      if (absY > absX && absY > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    },
    [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

// Hook for swipeable list items
export function useSwipeableItem(config: { onSwipeLeft?: () => void; onSwipeRight?: () => void; threshold?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const startXRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0]?.clientX || 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const currentX = e.touches[0]?.clientX || 0;
    const diff = currentX - startXRef.current;

    if (containerRef.current) {
      // Limit swipe distance
      const maxSwipe = 100;
      const offset = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
      offsetRef.current = offset;

      containerRef.current.style.transform = `translateX(${offset}px)`;
      containerRef.current.style.transition = "none";
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (containerRef.current) {
      const threshold = config.threshold || 50;

      if (Math.abs(offsetRef.current) > threshold) {
        if (offsetRef.current > 0) {
          config.onSwipeRight?.();
        } else {
          config.onSwipeLeft?.();
        }
      }

      // Reset position
      containerRef.current.style.transform = "translateX(0)";
      containerRef.current.style.transition = "transform 0.3s ease-out";
      offsetRef.current = 0;
    }
  }, [config]);

  return {
    ref: containerRef,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
