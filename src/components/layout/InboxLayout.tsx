"use client";

import React, { useEffect, useState } from "react";
import { List as Menu, MessageCircle as MessageSquare, Users, X } from "lucide-react";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface InboxLayoutProps {
  conversationsList: React.ReactNode;
  messagePanel: React.ReactNode;
  detailsPanel?: React.ReactNode;
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

export function InboxLayout({
  conversationsList,
  messagePanel,
  detailsPanel,
  showDetails = true,
  onToggleDetails,
}: InboxLayoutProps) {
  const [showConversations, setShowConversations] = useState(true);
  const [showDetailsPanel, setShowDetailsPanel] = useState(showDetails);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);

      // Auto-hide panels on mobile
      if (width < 768) {
        setShowConversations(false);
        setShowDetailsPanel(false);
      } else if (width >= 768 && width < 1024) {
        setShowConversations(true);
        setShowDetailsPanel(false);
      } else {
        setShowConversations(true);
        setShowDetailsPanel(showDetails);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [showDetails]);

  useEffect(() => {
    setShowDetailsPanel(showDetails);
  }, [showDetails]);

  const toggleConversations = () => {
    if (isMobile && !showConversations) {
      setShowDetailsPanel(false);
    }
    setShowConversations(!showConversations);
  };

  const toggleDetails = () => {
    if (isMobile && !showDetailsPanel) {
      setShowConversations(false);
    }
    setShowDetailsPanel(!showDetailsPanel);
    onToggleDetails?.();
  };

  return (
    <div className="relative flex h-full overflow-hidden bg-[var(--fl-color-background-subtle)]">
      {/* Conversations Panel */}
      <div
        className={cn(
          "flex flex-shrink-0 flex-col border-r border-[var(--fl-color-border)] bg-white transition-all duration-300",
          isMobile ? "absolute inset-y-0 left-0 z-30 w-full" : "relative",
          isTablet ? "w-80" : "w-80 lg:w-96",
          showConversations ? "translate-x-0" : "-translate-x-full",
          !isMobile && "translate-x-0"
        )}
      >
        {/* Mobile Header */}
        {isMobile && (
          <div className="flex h-14 items-center justify-between border-b border-[var(--fl-color-border)] px-4">
            <h2 className="font-semibold text-gray-900">Conversations</h2>
            <button onClick={toggleConversations} className="hover:bg-background rounded-ds-lg spacing-1.5">
              <Icon icon={X} className="text-foreground h-5 w-5" />
            </button>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-hidden">{conversationsList}</div>
      </div>

      {/* Messages Panel */}
      <div className="bg-background flex min-w-0 flex-1 flex-col">
        {/* Mobile Header */}
        {isMobile && (
          <div className="flex h-14 items-center justify-between border-b border-[var(--fl-color-border)] px-4">
            <button onClick={toggleConversations} className="hover:bg-background rounded-ds-lg spacing-1.5">
              <Icon icon={Menu} className="text-foreground h-5 w-5" />
            </button>

            <h2 className="flex-1 heading-center font-semibold text-gray-900">Messages</h2>

            {detailsPanel && (
              <button onClick={toggleDetails} className="hover:bg-background rounded-ds-lg spacing-1.5">
                <Icon icon={Users} className="text-foreground h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Message Panel Content */}
        <div className="flex-1 overflow-hidden">{messagePanel}</div>
      </div>

      {/* Details Panel */}
      {detailsPanel && (
        <div
          className={cn(
            "flex flex-shrink-0 flex-col border-l border-[var(--fl-color-border)] bg-white transition-all duration-300",
            isMobile ? "absolute inset-y-0 right-0 z-30 w-full" : "relative",
            isTablet ? "absolute inset-y-0 right-0 z-20" : "relative",
            isTablet || isMobile ? "w-full md:w-96" : "w-96 xl:w-[420px]",
            showDetailsPanel ? "translate-x-0" : "translate-x-full",
            !isMobile && !isTablet && "translate-x-0"
          )}
        >
          {/* Mobile/Tablet Header */}
          {(isMobile || isTablet) && (
            <div className="flex h-14 items-center justify-between border-b border-[var(--fl-color-border)] px-4">
              <h2 className="font-semibold text-gray-900">Details</h2>
              <button onClick={toggleDetails} className="hover:bg-background rounded-ds-lg spacing-1.5">
                <Icon icon={X} className="text-foreground h-5 w-5" />
              </button>
            </div>
          )}

          {/* Details Content */}
          <div className="flex-1 overflow-hidden">{detailsPanel}</div>
        </div>
      )}

      {/* Mobile Overlays */}
      {isMobile && (showConversations || showDetailsPanel) && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50"
          onClick={() => {
            setShowConversations(false);
            setShowDetailsPanel(false);
          }}
        />
      )}

      {/* Tablet Overlay for Details */}
      {isTablet && showDetailsPanel && (
        <div className="fixed inset-0 z-10 bg-black bg-opacity-50" onClick={() => setShowDetailsPanel(false)} />
      )}
    </div>
  );
}
