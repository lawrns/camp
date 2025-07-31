/**
 * PanelTransition Components
 *
 * Smooth animated transitions between mobile panels with swipe gestures
 * and configurable animation settings.
 */

"use client";

import { OptimizedAnimatePresence, OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { cn } from "@/lib/utils";
import { PanInfo } from "framer-motion";
import * as React from "react";
import { PanelTransitionProps, SwipeablePanelContainerProps, SwipeState } from "./types";

// Animation variants for panel transitions
const panelVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

// Transition configuration
const transitionConfig = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export function PanelTransition({
  children,
  isActive,
  isTransitioning,
  direction,
  duration = 300,
  className,
}: PanelTransitionProps) {
  return (
    <OptimizedMotion.div
      initial="enter"
      animate={isActive ? "center" : "exit"}
      exit="exit"
      variants={panelVariants}
      custom={direction === "left" ? -1 : direction === "right" ? 1 : 0}
      transition={{
        ...transitionConfig,
        duration: duration / 1000,
      }}
      className={cn(
        "absolute inset-0 h-full w-full",
        isTransitioning && "pointer-events-none",
        className
      )}
    >
      {children}
    </OptimizedMotion.div>
  );
}

export function SwipeablePanelContainer({
  panels,
  activePanel,
  isTransitioning,
  enableSwipeGestures = true,
  swipeState,
  onSwipeStart,
  onSwipeProgress,
  onSwipeEnd,
  className,
}: SwipeablePanelContainerProps) {
  return (
    <div className={cn("relative flex-1 overflow-hidden", className)}>
      <OptimizedAnimatePresence mode="wait">
        {panels.map((panel) => {
          const isActive = panel.key === activePanel;
          if (!isActive) return null;

          return (
            <PanelTransition
              key={panel.key}
              isActive={isActive}
              isTransitioning={isTransitioning}
              direction="none"
              className="h-full w-full"
            >
              <div
                className="h-full w-full"
                onTouchStart={enableSwipeGestures ? onSwipeStart : undefined}
                onTouchMove={enableSwipeGestures ? onSwipeProgress : undefined}
                onTouchEnd={enableSwipeGestures ? onSwipeEnd : undefined}
                style={{
                  // Apply swipe progress for visual feedback
                  transform: swipeState?.isSwiping
                    ? `translateX(${swipeState.deltaX * 0.3}px)`
                    : undefined,
                }}
              >
                {panel.content}
              </div>
            </PanelTransition>
          );
        })}
      </OptimizedAnimatePresence>

      {/* Swipe indicator */}
      {swipeState?.isSwiping && Math.abs(swipeState.deltaX) > 50 && (
        <OptimizedMotion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute top-1/2 left-4 z-50 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white"
        >
          <div className="h-6 w-6">
            {swipeState.direction === "left" ? "→" : "←"}
          </div>
        </OptimizedMotion.div>
      )}
    </div>
  );
}

interface PanelWrapperProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function PanelWrapper({ children, className, padding = true }: PanelWrapperProps) {
  return (
    <div
      className={cn(
        "h-full w-full bg-background",
        padding && "p-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function LoadingPanel({ message = "Loading..." }: { message?: string }) {
  return (
    <PanelWrapper>
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    </PanelWrapper>
  );
}

export function ErrorPanel({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <PanelWrapper>
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <p className="mb-4 text-red-600">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </PanelWrapper>
  );
}
