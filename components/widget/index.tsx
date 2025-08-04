"use client";

import { getFeatureFlagConfig } from "@/lib/feature-flags/config";
import { FeatureFlagProvider } from "@/lib/feature-flags/index";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { config } from "./config/env";
import { UltimateWidget } from "./design-system";
import { useAuth } from "./hooks/useAuth";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
// Deprecated components removed - using UltimateWidget instead

// Extend window interface for widget configuration
declare global {
  interface Window {
    CampfireWidgetConfig?: {
      organizationId: string;
      debug?: boolean;
    };
  }
}

interface WidgetContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  organizationId: string;
  conversationId?: string | undefined;
  userId?: string | undefined;
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
  const [widgetError, setWidgetError] = useState<string | null>(null);
  
  // Set widget configuration on window for auth provider detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.CampfireWidgetConfig = {
        organizationId,
        debug,
      };
      console.log('[WidgetProvider] Set CampfireWidgetConfig on window:', window.CampfireWidgetConfig);
    }
  }, [organizationId, debug]);

  // Add logging for widget state changes
  useEffect(() => {
    console.log('[WidgetProvider] Widget state changed:', { isOpen, organizationId });
  }, [isOpen, organizationId]);
  
  // Use auth hook but handle errors gracefully
  let authResult;
  try {
    authResult = useAuth(organizationId);
  } catch (error) {
    console.warn('[WidgetProvider] Auth hook failed, using fallback:', error);
    authResult = {
      isAuthenticated: false,
      isLoading: false,
      error: null,
      user: null,
      token: null,
      conversationId: null,
    };
  }

  const { isAuthenticated, isLoading, error } = authResult;

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

  // DEBUG: Track widget rendering
  console.log('[WidgetProvider] 🔥 RENDERING UltimateWidget:', {
    organizationId,
    isAuthenticated,
    isLoading,
    error: error?.message,
    timestamp: new Date().toISOString()
  });

  return (
    <WidgetErrorBoundary organizationId={organizationId}>
      <FeatureFlagProvider config={featureFlagConfig}>
        <WidgetContext.Provider value={contextValue}>
          {children}

          {/* ULTIMATE WIDGET - Single Source of Truth */}
          <UltimateWidget
            organizationId={organizationId}
            conversationId={conversationId} // Pass conversationId as prop to avoid context dependency
            config={{
              organizationName: "Campfire",
              primaryColor: "#6366F1",
              position: "bottom-right",
              welcomeMessage: "Hi there! 👋 Welcome to Campfire. This is the UltimateWidget with all advanced features! Try uploading files, reacting to messages, and more!",
              showWelcomeMessage: true,
              enableHelp: true,
              enableNotifications: true,
              // Advanced features - ALL ENABLED
              enableFileUpload: true,
              enableReactions: true,
              enableThreading: true,
              enableSoundNotifications: true,
              maxFileSize: 10, // 10MB
              maxFiles: 5,
              acceptedFileTypes: ["image/*", "application/pdf", ".doc", ".docx", ".txt", "video/*", "audio/*"],
            }}
            onMessage={(message) => {
              console.log('UltimateWidget: Message sent:', message);
            }}
            onClose={() => {
              console.log('UltimateWidget: Widget closed');
            }}
          />
        </WidgetContext.Provider>
      </FeatureFlagProvider>
    </WidgetErrorBoundary>
  );
};

// Export UltimateWidget components
export { UltimateWidget as Panel };

// Export Widget as an alias for WidgetProvider for convenience
export { WidgetProvider as Widget };

