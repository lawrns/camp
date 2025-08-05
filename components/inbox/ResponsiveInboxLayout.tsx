/**
 * ResponsiveInboxLayout Component
 *
 * Provides responsive layout for inbox with mobile, tablet, and desktop layouts.
 * Uses proper Tailwind classes instead of custom CSS classes.
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CaretLeft, CaretRight } from "lucide-react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { Button } from "@/components/ui/button";
import { useCollapsiblePanels } from "@/hooks/useCollapsiblePanels";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useResponsiveLayout } from "@/hooks/useIsMobile";
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
  const [isConversationListCollapsed, setIsConversationListCollapsed] = useState(false);
  const [isDetailsPanelCollapsed, setIsDetailsPanelCollapsed] = useState(false);

  // Use SSR-safe responsive layout hook
  const layoutType = useResponsiveLayout();

  // Default to desktop during SSR/initial render
  const safeLayoutType = layoutType || "desktop";

  // Enhanced mobile detection for better touch support
  const isMobile = safeLayoutType === "mobile";
  const isTablet = safeLayoutType === "tablet";

  // Mobile layout with enhanced touch support
  if (safeLayoutType === "mobile") {
    return (
      <div className="h-full w-full overflow-hidden">
        <MobileInboxLayout
          conversationList={conversationList}
          chatPanel={chatPanel}
          detailsPanel={detailsPanel}
          selectedConversationId={selectedConversationId || ""}
          hasSelectedConversation={hasSelectedConversation}
          onBackToList={onBackToList || (() => {})}
          conversationTitle={conversationTitle || ""}
          unreadCount={unreadCount || 0}
          enableSwipeGestures={true}
        />
      </div>
    );
  }

  // Tablet layout - 2 panels only
  if (layoutType === "tablet") {
    return (
      <div className={cn("flex flex-1 bg-background", className)}>
        {/* Conversation List with collapse toggle */}
        <OptimizedMotion.div
          className="relative flex-shrink-0 bg-background border-r border-border"
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
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 rounded-full border border-border bg-background p-1 shadow-md transition-shadow hover:shadow-lg"
            aria-label={isConversationListCollapsed ? "Expand conversation list" : "Collapse conversation list"}
          >
            {isConversationListCollapsed ? (
              <CaretRight className="h-4 w-4 text-foreground" />
            ) : (
              <CaretLeft className="h-4 w-4 text-foreground" />
            )}
          </button>
        </OptimizedMotion.div>

        {/* Chat Panel - Takes remaining space */}
        <div className="flex-1">{chatPanel}</div>

        {/* Details Panel hidden on tablet to keep it simple */}
      </div>
    );
  }

  // Desktop layout - 3 panels with collapsible panels
  return (
    <div
      className={cn("flex h-full overflow-hidden", className)}
      data-component="ResponsiveInboxLayout"
    >
      {/* Conversation List Panel */}
      <OptimizedMotion.div
        className="relative flex-shrink-0 bg-background border-r border-border"
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
          className="absolute right-0 top-1/2 z-10 h-8 w-8 -translate-y-1/2 translate-x-1/2 rounded-full border border-border bg-background p-0 shadow-md transition-shadow hover:shadow-lg"
          aria-label={isConversationListCollapsed ? "Expand conversation list" : "Collapse conversation list"}
        >
          {isConversationListCollapsed ? (
            <CaretRight className="h-4 w-4 text-foreground" />
          ) : (
            <CaretLeft className="h-4 w-4 text-foreground" />
          )}
        </Button>
      </OptimizedMotion.div>

      {/* Chat Panel */}
      <div className="flex-1 bg-background">{chatPanel}</div>

      {/* Details Panel */}
      {hasSelectedConversation && (
        <OptimizedMotion.div
          className="relative flex-shrink-0 bg-background border-l border-border"
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
            className="absolute left-0 top-1/2 z-10 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-background p-0 shadow-md transition-shadow hover:shadow-lg"
            aria-label={isDetailsPanelCollapsed ? "Expand details panel" : "Collapse details panel"}
          >
            {isDetailsPanelCollapsed ? (
              <CaretLeft className="h-4 w-4 text-foreground" />
            ) : (
              <CaretRight className="h-4 w-4 text-foreground" />
            )}
          </Button>
        </OptimizedMotion.div>
      )}
    </div>
  );
}
