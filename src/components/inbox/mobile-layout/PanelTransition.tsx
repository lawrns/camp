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
import { ActivePanel, SwipeGestureState } from "./types";

interface PanelTransitionProps {
  activePanel: ActivePanel;
  children: React.ReactNode;
  isTransitioning: boolean;
  enableSwipeGestures?: boolean;
  swipeState?: SwipeGestureState;
  onSwipeStart?: () => void;
  onSwipeProgress?: (info: PanInfo) => void;
  onSwipeEnd?: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  className?: string;
}

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
  activePanel,
  children,
  isTransitioning,
  enableSwipeGestures = true,
  swipeState,
  onSwipeStart,
  onSwipeProgress,
  onSwipeEnd,
  className,
}: PanelTransitionProps) {
  return (
    <div className={cn("relative flex-1 overflow-hidden", className)}>
      <OptimizedAnimatePresence mode="wait" custom={1}>
        <OptimizedMotion.div
          key={activePanel}
          custom={1}
          variants={panelVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transitionConfig}
          drag={enableSwipeGestures ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={onSwipeStart}
          onDrag={(event, info) => onSwipeProgress?.(info)}
          onDragEnd={onSwipeEnd}
          className={cn(
            "absolute inset-0 h-full w-full",
            isTransitioning && "pointer-events-none",
            swipeState?.isDragging && "cursor-grabbing"
          )}
          style={{
            // Apply swipe progress for visual feedback
            transform: swipeState?.isDragging
              ? `translateX(${swipeState.swipeProgress * 20 * (swipeState.swipeDirection === "right" ? 1 : -1)}px)`
              : undefined,
          }}
        >
          {children}
        </OptimizedMotion.div>
      </OptimizedAnimatePresence>

      {/* Swipe indicator */}
      {swipeState?.isDragging && swipeState.swipeProgress > 0.3 && (
        <OptimizedMotion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "absolute inset-y-0 z-10 w-1 bg-brand-blue-500",
            swipeState.swipeDirection === "right" ? "left-0" : "right-0"
          )}
          style={{
            scaleY: swipeState.swipeProgress,
          }}
        />
      )}
    </div>
  );
}

interface SwipeablePanelContainerProps {
  panels: Array<{
    key: ActivePanel;
    content: React.ReactNode;
  }>;
  activePanel: ActivePanel;
  isTransitioning: boolean;
  enableSwipeGestures?: boolean;
  swipeState?: SwipeGestureState;
  onSwipeStart?: () => void;
  onSwipeProgress?: (info: PanInfo) => void;
  onSwipeEnd?: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  className?: string;
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
  const activeIndex = panels.findIndex((panel) => panel.key === activePanel);
  const activeContent = panels[activeIndex]?.content;

  if (!activeContent) {
    return (
      <div className={cn("flex flex-1 items-center justify-center", className)}>
        <div className="text-[var(--fl-color-text-muted)]">Panel not found</div>
      </div>
    );
  }

  return (
    <PanelTransition
      activePanel={activePanel}
      isTransitioning={isTransitioning}
      enableSwipeGestures={enableSwipeGestures}
      swipeState={swipeState}
      onSwipeStart={onSwipeStart}
      onSwipeProgress={onSwipeProgress}
      onSwipeEnd={onSwipeEnd}
      className={className}
    >
      {activeContent}
    </PanelTransition>
  );
}

interface PanelWrapperProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function PanelWrapper({ children, className, padding = true }: PanelWrapperProps) {
  return <div className={cn("h-full w-full overflow-auto", padding && "spacing-4", className)}>{children}</div>;
}

// Loading panel component
export function LoadingPanel({ message = "Loading..." }: { message?: string }) {
  return (
    <PanelWrapper className="flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
        <p className="text-foreground">{message}</p>
      </div>
    </PanelWrapper>
  );
}

// Error panel component
export function ErrorPanel({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <PanelWrapper className="flex items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="text-brand-mahogany-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-base font-medium text-gray-900">Something went wrong</h3>
        <p className="text-foreground mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-primary rounded-ds-md px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Try Again
          </button>
        )}
      </div>
    </PanelWrapper>
  );
}
