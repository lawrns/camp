import { useCallback, useRef } from 'react';
import { SwipeGestureConfig } from './types';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useSwipeGestures(
  handlers: SwipeHandlers,
  config: SwipeGestureConfig = {
    threshold: 50,
    velocity: 0.3,
    direction: 'horizontal',
  }
) {
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches[0]) {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      startTime.current = Date.now();
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!e.changedTouches[0]) return;
    
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const endTime = Date.now();

    const deltaX = endX - startX.current;
    const deltaY = endY - startY.current;
    const deltaTime = endTime - startTime.current;

    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;

    if (config.direction === 'horizontal') {
      if (Math.abs(deltaX) > config.threshold && velocityX > config.velocity) {
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      }
    } else {
      if (Math.abs(deltaY) > config.threshold && velocityY > config.velocity) {
        if (deltaY > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        }
      }
    }
  }, [handlers, config]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
} 