"use client";

import { getFeatureFlagConfig } from "@/lib/feature-flags/config";
import { FeatureFlagProvider } from "@/lib/feature-flags/index";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { config } from "./config/env";
import { DefinitiveButton } from "./DefinitiveButton";
import { DefinitiveWidget } from "./DefinitiveWidget";
import { useAuth } from "./hooks/useAuth";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";

interface WidgetContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  organizationId: string;
  conversationId?: string;
  userId?: string;
  debug?: boolean;
}

const WidgetContext = createContext<WidgetContextType | null>(null);

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidget must be used within WidgetProvider");
  }
  return context;
};

interface WidgetProviderProps {
  children: ReactNode;
  organizationId?: string;
  conversationId?: string;
  userId?: string;
  debug?: boolean;
}

export const WidgetProvider: React.FC<WidgetProviderProps> = ({
  children,
  organizationId = config.defaultOrganizationId,
  conversationId,
  userId,
  debug = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isLoading, error } = useAuth(organizationId);

  // Always render the widget, even during loading or errors
  // This ensures the button is always visible and functional

  // Handle close event from SimplePanel
  useEffect(() => {
    const handleClose = () => {
      setIsOpen(false);
    };

    window.addEventListener('widget-close', handleClose);
    return () => {
      window.removeEventListener('widget-close', handleClose);
    };
  }, []);

  // Get feature flag configuration
  const featureFlagConfig = getFeatureFlagConfig(userId, organizationId);

  const contextValue = {
    isOpen,
    setIsOpen,
    organizationId,
    conversationId,
    userId,
    debug,
  };

  return (
    <WidgetErrorBoundary organizationId={organizationId}>
      <FeatureFlagProvider config={featureFlagConfig}>
        <WidgetContext.Provider value={contextValue}>
          {children}

          {/* DEFINITIVE WIDGET - Single Source of Truth */}
          <div className="pointer-events-auto" data-testid="widget-container">
            <DefinitiveButton
              onClick={() => setIsOpen(!isOpen)}
              isOpen={isOpen}
              messageCount={0} // TODO: Get from widget state
            />

            {isOpen && (
              <DefinitiveWidget
                organizationId={organizationId}
                onClose={() => setIsOpen(false)}
              />
            )}
          </div>
        </WidgetContext.Provider>
      </FeatureFlagProvider>
    </WidgetErrorBoundary>
  );
};

// Export the definitive components
export { DefinitiveButton as Button, DefinitiveWidget as Panel };

