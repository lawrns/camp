"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  List as Menu,
  Sidebar as PanelLeft,
  SidebarSimple as PanelLeftClose,
  Columns as PanelRight,
  Rows as PanelRightClose,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

// import { useImprovedLayout } from "@/lib/hooks/useLayout"; // Hook doesn't exist
// import { LAYOUT_CONFIG } from "@/lib/layout/config"; // Config doesn't exist

// Mock layout config
const LAYOUT_CONFIG = {
  breakpoints: { mobile: 768, tablet: 1024 },
  defaultPanelSizes: { sidebar: 240, main: 400 },
};

interface FourPanelLayoutProps {
  children: React.ReactNode;
  className?: string;

  // Panel content - primary naming convention
  iconSidebar?: React.ReactNode;
  navigationPanel?: React.ReactNode;
  detailsPanel?: React.ReactNode;

  // Panel props (legacy compatibility)
  iconSidebarContent?: React.ReactNode;
  navigationPanelContent?: React.ReactNode;
  detailsPanelContent?: React.ReactNode;

  // Alternative panel naming (for test compatibility)
  sidebar?: React.ReactNode;
  navigation?: React.ReactNode;
  content?: React.ReactNode;
  details?: React.ReactNode;

  // Legacy props for test compatibility
  listPanel?: React.ReactNode;
  contentPanel?: React.ReactNode;

  // Configuration
  sidebarTitle?: string;
  navigationTitle?: string;
  detailsTitle?: string;

  showIconSidebar?: boolean;
  showNavigationPanel?: boolean;
  showDetailsPanel?: boolean;

  defaultCollapsed?: {
    sidebar?: boolean;
    navigation?: boolean;
    details?: boolean;
  };

  // Animation options
  enableAnimations?: boolean;
  animationDuration?: string;
}

// Layout context for child components
interface LayoutContextType {
  sidebarVisible: boolean;
  navigationVisible: boolean;
  detailsVisible: boolean;
  toggleSidebar: () => void;
  toggleNavigation: () => void;
  toggleDetails: () => void;
  isMobile: boolean;
  isTablet: boolean;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayoutContext must be used within FourPanelLayout");
  }
  return context;
};

/**
 * FourPanelLayout - Main layout component for Campfire
 * Provides responsive four-panel layout with sidebar, navigation, content, and details panels
 */
export function FourPanelLayout({
  children,
  className,

  // Content props (multiple naming conventions for compatibility)
  iconSidebar,
  iconSidebarContent,
  sidebar,

  navigationPanel,
  navigationPanelContent,
  navigation,

  detailsPanel,
  detailsPanelContent,
  details,

  // Legacy compatibility
  content,
  listPanel,
  contentPanel,

  // Configuration
  sidebarTitle = "Campfire",
  navigationTitle = "Navigation",
  detailsTitle = "Details",

  showIconSidebar = true,
  showNavigationPanel = true,
  showDetailsPanel = true,

  defaultCollapsed,

  enableAnimations = true,
  animationDuration = "var(--duration-normal)",

  ...props
}: FourPanelLayoutProps) {
  // Mock layout hook implementation
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [navigationVisible, setNavigationVisible] = useState(true);
  const [detailsVisible, setDetailsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const layout = {
    isMobile,
    isTablet,
    panelSizes: LAYOUT_CONFIG.defaultPanelSizes,
    sidebarVisible,
    navigationVisible,
    detailsVisible,
    setSidebarVisible,
    setNavigationVisible,
    setDetailsVisible,
    toggleSidebar: () => setSidebarVisible(!sidebarVisible),
    toggleNavigation: () => setNavigationVisible(!navigationVisible),
    toggleDetails: () => setDetailsVisible(!detailsVisible),
    resetLayout: () => {
      setSidebarVisible(true);
      setNavigationVisible(true);
      setDetailsVisible(true);
    },
    sidebarWidth: 20,
    navigationWidth: 30,
    detailsWidth: 25,
  };
  const [isInitialized, setIsInitialized] = useState(false);

  // Apply default collapsed states
  useEffect(() => {
    if (!isInitialized && defaultCollapsed) {
      if (defaultCollapsed.sidebar !== undefined) {
        setSidebarVisible(!defaultCollapsed.sidebar);
      }
      if (defaultCollapsed.navigation !== undefined) {
        setNavigationVisible(!defaultCollapsed.navigation);
      }
      if (defaultCollapsed.details !== undefined) {
        setDetailsVisible(!defaultCollapsed.details);
      }
      setIsInitialized(true);
    }
  }, [defaultCollapsed, isInitialized]);

  // Handle responsive behavior and screen size detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const newIsMobile = width < LAYOUT_CONFIG.breakpoints.mobile;
      const newIsTablet = width >= LAYOUT_CONFIG.breakpoints.mobile && width < LAYOUT_CONFIG.breakpoints.tablet;

      setIsMobile(newIsMobile);
      setIsTablet(newIsTablet);

      if (newIsMobile) {
        // On mobile, collapse all side panels by default
        setSidebarVisible(false);
        setNavigationVisible(false);
        setDetailsVisible(false);
      } else if (newIsTablet) {
        // On tablet, show sidebar but collapse others
        setSidebarVisible(true);
        setNavigationVisible(false);
        setDetailsVisible(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Resolve content with multiple naming conventions
  const resolvedSidebar = iconSidebar || iconSidebarContent || sidebar;
  const resolvedNavigation = navigationPanel || navigationPanelContent || navigation;
  const resolvedDetails = detailsPanel || detailsPanelContent || details;
  const resolvedContent = children || content || contentPanel || listPanel;

  const contextValue: LayoutContextType = {
    sidebarVisible: layout.sidebarVisible,
    navigationVisible: layout.navigationVisible,
    detailsVisible: layout.detailsVisible,
    toggleSidebar: layout.toggleSidebar,
    toggleNavigation: layout.toggleNavigation,
    toggleDetails: layout.toggleDetails,
    isMobile: layout.isMobile,
    isTablet: layout.isTablet,
  };

  const animationClasses = enableAnimations ? "transition-all duration-300 ease-out" : "";

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className={cn("flex h-full w-full overflow-hidden bg-slate-50", layout.isMobile ? '' : 'gap-4 spacing-4', className)} {...props}>
        {/* Icon Sidebar */}
        {showIconSidebar && resolvedSidebar && (
          <div
            className={cn(
              "relative rounded-ds-xl border border-border bg-card shadow-sm",
              animationClasses,
              layout.sidebarVisible ? "w-16" : "w-0",
              layout.isMobile && "absolute z-30 h-full shadow-lg",
              layout.isMobile && layout.sidebarVisible ? 'p-0' : ''
            )}
            style={{
              width: layout.sidebarVisible ? `${layout.sidebarWidth}%` : "0%",
              transition: enableAnimations ? `width ${animationDuration}, opacity ${animationDuration}` : undefined,
            }}
          >
            <div className={cn("h-full overflow-hidden", !layout.sidebarVisible && "pointer-events-none opacity-0")}>
              {resolvedSidebar}
            </div>
          </div>
        )}

        {/* Navigation Panel */}
        {showNavigationPanel && resolvedNavigation && (
          <div
            className={cn(
              "relative rounded-ds-xl border border-border bg-card shadow-sm",
              animationClasses,
              layout.navigationVisible ? "flex" : "hidden",
              layout.isMobile && "absolute z-20 h-full shadow-lg",
              layout.isTablet && "absolute z-20 h-full shadow-lg",
              layout.isMobile && layout.navigationVisible ? 'p-0' : ''
            )}
            style={{
              width: layout.navigationVisible ? `${layout.navigationWidth}%` : "0%",
              transition: enableAnimations ? `width ${animationDuration}, opacity ${animationDuration}` : undefined,
            }}
          >
            <div className="h-full w-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-border spacing-3">
                <h2 className="text-sm font-semibold">{navigationTitle}</h2>
                <Button variant="ghost" size="sm" onClick={layout.toggleNavigation} className="h-6 w-6 p-0">
                  <Icon icon={PanelLeftClose} className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto">{resolvedNavigation}</div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-ds-xl border border-border bg-card shadow-card-base">
          {/* Content Header with Panel Controls */}
          <div className="flex items-center justify-between border-b border-border bg-background/50 p-spacing-sm backdrop-blur-sm">
            <div className="flex items-center gap-ds-2">
              {/* Mobile Menu Toggle */}
              {layout.isMobile && (
                <Button variant="ghost" size="sm" onClick={layout.toggleNavigation} className="h-8 w-8 p-0 md:hidden">
                  <Icon icon={Menu} className="h-4 w-4" />
                </Button>
              )}

              {/* Panel Toggles for Desktop */}
              {!layout.isMobile && (
                <>
                  {showIconSidebar && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={layout.toggleSidebar}
                      className="h-8 w-8 p-0"
                      title="Toggle Sidebar"
                    >
                      {layout.sidebarVisible ? (
                        <Icon icon={PanelLeftClose} className="h-4 w-4" />
                      ) : (
                        <Icon icon={PanelLeft} className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  {showNavigationPanel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={layout.toggleNavigation}
                      className="h-8 w-8 p-0"
                      title="Toggle Navigation"
                    >
                      {layout.navigationVisible ? (
                        <Icon icon={PanelLeftClose} className="h-4 w-4" />
                      ) : (
                        <Icon icon={PanelLeft} className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  {showDetailsPanel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={layout.toggleDetails}
                      className="h-8 w-8 p-0"
                      title="Toggle Details"
                    >
                      {layout.detailsVisible ? (
                        <Icon icon={PanelRightClose} className="h-4 w-4" />
                      ) : (
                        <Icon icon={PanelRight} className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Layout Reset */}
            <Button variant="ghost" size="sm" onClick={layout.resetLayout} className="text-tiny text-muted-foreground">
              Reset Layout
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">{resolvedContent}</div>
        </div>

        {/* Details Panel */}
        {showDetailsPanel && resolvedDetails && (
          <div
            className={cn(
              "relative rounded-ds-xl border border-border bg-card shadow-sm",
              animationClasses,
              layout.detailsVisible ? "flex" : "hidden",
              layout.isMobile && "absolute right-0 z-20 h-full shadow-lg",
              layout.isTablet && "absolute right-0 z-20 h-full shadow-lg"
            )}
            style={{
              width: layout.detailsVisible ? `${layout.detailsWidth}%` : "0%",
              transition: enableAnimations ? `width ${animationDuration}, opacity ${animationDuration}` : undefined,
            }}
          >
            <div className="h-full w-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-border spacing-3">
                <h2 className="text-sm font-semibold">{detailsTitle}</h2>
                <Button variant="ghost" size="sm" onClick={layout.toggleDetails} className="h-6 w-6 p-0">
                  <Icon icon={X} className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto">{resolvedDetails}</div>
            </div>
          </div>
        )}

        {/* Mobile Overlay */}
        {layout.isMobile && (layout.navigationVisible || layout.detailsVisible) && (
          <div
            className="absolute inset-0 z-10 bg-black/50"
            onClick={() => {
              layout.setNavigationVisible(false);
              layout.setDetailsVisible(false);
            }}
          />
        )}
      </div>
    </LayoutContext.Provider>
  );
}

export default FourPanelLayout;
