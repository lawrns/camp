"use client";

/**
 * Widget Launcher - Micro-Frontend Core
 *
 * Ultra-lightweight launcher component (<5KB) that loads the widget button
 * and manages the lazy loading of all advanced features.
 *
 * Architecture:
 * - Core: Button + basic state management (this file)
 * - Features: Lazy-loaded chunks for advanced functionality
 * - Target: <30KB total bundle size with <5KB initial load
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import { WidgetButton } from "./WidgetButton";

// Minimal types for core functionality
interface WidgetCoreState {
  isOpen: boolean;
  organizationId: string;
  conversationId?: string;
  userId?: string;
  debug?: boolean;
}

interface WidgetCoreActions {
  openWidget: () => void;
  closeWidget: () => void;
  toggleWidget: () => void;
}

interface WidgetCoreContext extends WidgetCoreState, WidgetCoreActions {}

const WidgetContext = createContext<WidgetCoreContext | null>(null);

export const useWidgetCore = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidgetCore must be used within WidgetLauncher");
  }
  return context;
};

// Lazy-load the full widget panel only when needed
const LazyWidgetPanel = React.lazy(() =>
  import("../features/WidgetPanel").then((module) => ({
    default: module.WidgetPanel,
  }))
);

interface WidgetLauncherProps {
  organizationId: string;
  conversationId?: string;
  userId?: string;
  debug?: boolean;
  className?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export const WidgetLauncher: React.FC<WidgetLauncherProps> = ({
  organizationId,
  conversationId,
  userId,
  debug = false,
  className = "",
  position = "bottom-right",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Optimized state management - no external dependencies
  const openWidget = useCallback(() => setIsOpen(true), []);
  const closeWidget = useCallback(() => setIsOpen(false), []);
  const toggleWidget = useCallback(() => setIsOpen((prev) => !prev), []);

  const contextValue: WidgetCoreContext = {
    isOpen,
    organizationId,
    conversationId,
    userId,
    debug,
    openWidget,
    closeWidget,
    toggleWidget,
  };

  // Position classes for the widget container
  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  return (
    <WidgetContext.Provider value={contextValue}>
      <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
        {/* Core launcher button - always loaded */}
        <WidgetButton onClick={toggleWidget} isOpen={isOpen} />

        {/* Advanced features - lazy loaded only when widget opens */}
        {isOpen && (
          <React.Suspense
            fallback={
              <div className="bg-background border-ds-border mt-2 h-96 w-80 animate-pulse rounded-ds-lg border shadow-card-deep">
                <div className="space-y-3 spacing-3">
                  <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                  <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                  <div className="h-32 rounded bg-gray-200"></div>
                  <div className="h-4 w-2/3 rounded bg-gray-200"></div>
                </div>
              </div>
            }
          >
            <LazyWidgetPanel />
          </React.Suspense>
        )}
      </div>
    </WidgetContext.Provider>
  );
};

// Export core utilities for advanced features
export { WidgetContext };
export type { WidgetCoreContext, WidgetCoreState, WidgetCoreActions };
