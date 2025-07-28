"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { Button } from "@/components/ui/Button-unified";
import { useCollapsiblePanels } from "@/hooks/useCollapsiblePanels";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { MobileInboxLayout } from "./MobileInboxLayout";

interface ResponsiveInboxLayoutProps {
  // Desktop layout props
  conversationList: React.ReactNode;
  chatPanel: React.ReactNode;
  detailsPanel: React.ReactNode;

  // Mobile-specific props
  selectedConversationId?: string;
  hasSelectedConversation: boolean;
  onBackToList?: () => void;
  conversationTitle?: string;
  unreadCount?: number;

  // Layout widths for desktop/tablet
  conversationListWidth?: number;
  sidebarWidth?: number;

  // Additional classes
  className?: string;
}

export function ResponsiveInboxLayout({
  conversationList,
  chatPanel,
  detailsPanel,
  selectedConversationId,
  hasSelectedConversation,
  onBackToList,
  conversationTitle,
  unreadCount,
  conversationListWidth = 320,
  sidebarWidth = 320,
  className,
}: ResponsiveInboxLayoutProps) {
  const [windowWidth, setWindowWidth] = useState(() => {
    // Set initial width to avoid loading state on client
    if (typeof window !== "undefined") {
      return window.innerWidth;
    }
    return 1200; // Default to desktop size during SSR
  });
  const [isConversationListCollapsed, setIsConversationListCollapsed] = useState(false);
  const [isDetailsPanelCollapsed, setIsDetailsPanelCollapsed] = useState(false);

  // Single source of truth for screen size
  useEffect(() => {
    const updateWidth = () => setWindowWidth(window.innerWidth);
    updateWidth(); // Set initial value

    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Determine layout based on window width
  const layoutType = useMemo(() => {
    if (windowWidth <= 768) return "mobile";
    if (windowWidth <= 1024) return "tablet";
    return "desktop";
  }, [windowWidth]);

  // Mobile layout
  if (layoutType === "mobile") {
    return (
      <MobileInboxLayout
        conversationList={conversationList}
        chatPanel={chatPanel}
        detailsPanel={detailsPanel}
        selectedConversationId={selectedConversationId || ""}
        hasSelectedConversation={hasSelectedConversation}
        onBackToList={onBackToList || (() => {})}
        conversationTitle={conversationTitle || ""}
        unreadCount={unreadCount || 0}
      />
    );
  }

  // Tablet layout - 2 panels only
  if (layoutType === "tablet") {
    return (
      <div className={cn("viewport-locked flex flex-1 bg-background", className)}>
        {/* Conversation List with collapse toggle */}
        <OptimizedMotion.div
          className="panel-separator inbox-panel-layout relative flex-shrink-0 bg-background"
          initial={false}
          animate={{
            width: isConversationListCollapsed ? 60 : Math.min(conversationListWidth * 0.85, 280),
          }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <OptimizedAnimatePresence mode="wait">
            {!isConversationListCollapsed && (
              <OptimizedMotion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {conversationList}
              </OptimizedMotion.div>
            )}
          </OptimizedAnimatePresence>

          {/* Collapse toggle button */}
          <button
            onClick={() => setIsConversationListCollapsed(!isConversationListCollapsed)}
            className="bg-background absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 rounded-ds-full border border-[var(--fl-color-border)] spacing-1 shadow-card-hover transition-shadow hover:shadow-card-deep dark:border-gray-700 dark:bg-neutral-800"
            aria-label={isConversationListCollapsed ? "Expand conversation list" : "Collapse conversation list"}
          >
            {isConversationListCollapsed ? (
              <CaretRight className="text-foreground h-4 w-4 dark:text-gray-400" />
            ) : (
              <CaretLeft className="text-foreground h-4 w-4 dark:text-gray-400" />
            )}
          </button>
        </OptimizedMotion.div>

        {/* Chat Panel - Takes remaining space */}
        <div className="inbox-panel-layout flex-1">{chatPanel}</div>

        {/* Details Panel hidden on tablet to keep it simple */}
      </div>
    );
  }

  // Desktop layout - 3 panels with collapsible panels

  return (
    <div
      className={cn("inbox-container inbox-three-panel-layout viewport-locked", className)}
      data-component="ResponsiveInboxLayout"
    >
      {/* Conversation List Panel */}
      <OptimizedMotion.div
        className="inbox-panel inbox-panel-conversations"
        initial={false}
        animate={{
          width: isConversationListCollapsed ? 60 : conversationListWidth,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <OptimizedAnimatePresence mode="wait">
          {!isConversationListCollapsed && (
            <OptimizedMotion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {conversationList}
            </OptimizedMotion.div>
          )}
        </OptimizedAnimatePresence>

        {/* Collapse toggle button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsConversationListCollapsed(!isConversationListCollapsed)}
          className="absolute right-0 top-1/2 z-10 h-8 w-8 -translate-y-1/2 translate-x-1/2 rounded-ds-full border-fl-border bg-fl-surface p-0 shadow-card-hover transition-shadow hover:shadow-card-deep"
          aria-label={isConversationListCollapsed ? "Expand conversation list" : "Collapse conversation list"}
        >
          {isConversationListCollapsed ? (
            <CaretRight className="h-4 w-4 text-fl-text-muted" />
          ) : (
            <CaretLeft className="h-4 w-4 text-fl-text-muted" />
          )}
        </Button>
      </OptimizedMotion.div>

      {/* Chat Panel */}
      <div className="inbox-panel inbox-panel-messages">{chatPanel}</div>

      {/* Details Panel */}
      {hasSelectedConversation && (
        <OptimizedMotion.div
          className="inbox-panel inbox-panel-details"
          initial={false}
          animate={{
            width: isDetailsPanelCollapsed ? 60 : sidebarWidth,
          }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <OptimizedAnimatePresence mode="wait">
            {!isDetailsPanelCollapsed && (
              <OptimizedMotion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {detailsPanel}
              </OptimizedMotion.div>
            )}
          </OptimizedAnimatePresence>

          {/* Collapse toggle button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDetailsPanelCollapsed(!isDetailsPanelCollapsed)}
            className="absolute left-0 top-1/2 z-10 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-ds-full border-fl-border bg-fl-surface p-0 shadow-card-hover transition-shadow hover:shadow-card-deep"
            aria-label={isDetailsPanelCollapsed ? "Expand details panel" : "Collapse details panel"}
          >
            {isDetailsPanelCollapsed ? (
              <CaretLeft className="h-4 w-4 text-fl-text-muted" />
            ) : (
              <CaretRight className="h-4 w-4 text-fl-text-muted" />
            )}
          </Button>
        </OptimizedMotion.div>
      )}
    </div>
  );
}
