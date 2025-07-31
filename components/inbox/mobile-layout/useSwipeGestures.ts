/**
 * useSwipeGestures Hook
 * 
 * Handles swipe gestures for mobile panel navigation
 */

import { useCallback, useRef, useState } from "react";
import { SwipeState, MobileLayoutConfig } from "./types";

interface UseSwipeGesturesProps {
  activePanel: "list" | "chat" | "details";
  panelOrder: ("list" | "chat" | "details")[];
  hasSelectedConversation: boolean;
  onPanelChange: (panel: "list" | "chat" | "details") => void;
  isTransitioning: boolean;
  config: MobileLayoutConfig["swipe"];
  enableHapticFeedback: boolean;
}

export function useSwipeGestures({
  activePanel,
  panelOrder,
  hasSelectedConversation,
  onPanelChange,
  isTransitioning,
  config,
  enableHapticFeedback,
}: UseSwipeGesturesProps) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    velocity: 0,
    direction: null,
  });

  const startTimeRef = useRef<number>(0);
  const lastMoveTimeRef = useRef<number>(0);

  // Get current panel index
  const getCurrentPanelIndex = useCallback(() => {
    return panelOrder.indexOf(activePanel);
  }, [activePanel, panelOrder]);

  // Get next/previous panel
  const getNextPanel = useCallback(() => {
    const currentIndex = getCurrentPanelIndex();
    if (currentIndex < panelOrder.length - 1) {
      return panelOrder[currentIndex + 1];
    }
    return null;
  }, [getCurrentPanelIndex, panelOrder]);

  const getPreviousPanel = useCallback(() => {
    const currentIndex = getCurrentPanelIndex();
    if (currentIndex > 0) {
      return panelOrder[currentIndex - 1];
    }
    return null;
  }, [getCurrentPanelIndex, panelOrder]);

  // Haptic feedback
  const triggerHapticFeedback = useCallback(() => {
    if (enableHapticFeedback && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [enableHapticFeedback]);

  // Handle swipe start
  const handleSwipeStart = useCallback(
    (e: React.TouchEvent) => {
      if (isTransitioning) return;

      const touch = e.touches[0];
      startTimeRef.current = Date.now();
      lastMoveTimeRef.current = Date.now();

      setSwipeState({
        isSwiping: true,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        deltaX: 0,
        deltaY: 0,
        velocity: 0,
        direction: null,
      });
    },
    [isTransitioning]
  );

  // Handle swipe progress
  const handleSwipeProgress = useCallback(
    (e: React.TouchEvent) => {
      if (!swipeState.isSwiping || isTransitioning) return;

      const touch = e.touches[0];
      const now = Date.now();
      const deltaTime = now - lastMoveTimeRef.current;
      lastMoveTimeRef.current = now;

      const deltaX = touch.clientX - swipeState.startX;
      const deltaY = touch.clientY - swipeState.startY;
      const velocity = deltaTime > 0 ? Math.abs(deltaX) / deltaTime : 0;

      // Determine direction
      let direction: "left" | "right" | "up" | "down" | null = null;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? "right" : "left";
      } else {
        direction = deltaY > 0 ? "down" : "up";
      }

      setSwipeState(prev => ({
        ...prev,
        currentX: touch.clientX,
        currentY: touch.clientY,
        deltaX,
        deltaY,
        velocity,
        direction,
      }));
    },
    [swipeState.isSwiping, swipeState.startX, swipeState.startY, isTransitioning]
  );

  // Handle swipe end
  const handleSwipeEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!swipeState.isSwiping || isTransitioning) return;

      const totalTime = Date.now() - startTimeRef.current;
      const velocity = totalTime > 0 ? Math.abs(swipeState.deltaX) / totalTime : 0;

      // Check if swipe meets threshold
      const meetsThreshold = Math.abs(swipeState.deltaX) > config.threshold;
      const meetsVelocity = velocity > config.velocity;

      if (meetsThreshold || meetsVelocity) {
        // Determine navigation direction
        if (swipeState.direction === "left" && getNextPanel()) {
          // Swipe left - go to next panel
          onPanelChange(getNextPanel()!);
          triggerHapticFeedback();
        } else if (swipeState.direction === "right" && getPreviousPanel()) {
          // Swipe right - go to previous panel
          onPanelChange(getPreviousPanel()!);
          triggerHapticFeedback();
        }
      }

      // Reset swipe state
      setSwipeState({
        isSwiping: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        deltaX: 0,
        deltaY: 0,
        velocity: 0,
        direction: null,
      });
    },
    [
      swipeState.isSwiping,
      swipeState.deltaX,
      swipeState.direction,
      isTransitioning,
      config.threshold,
      config.velocity,
      getNextPanel,
      getPreviousPanel,
      onPanelChange,
      triggerHapticFeedback,
    ]
  );

  return {
    swipeState,
    handleSwipeStart,
    handleSwipeProgress,
    handleSwipeEnd,
  };
} 