/**
 * Inbox Management Dashboard
 *
 * Comprehensive interface for managing customer conversations:
 * - Real-time conversation listing and management
 * - Message threading and conversation history
 * - AI-powered response suggestions and automation
 * - Agent assignment and handover functionality
 * - Status indicators and priority management
 * - Search and filtering capabilities
 */

"use client";

import React, { Suspense } from "react";
import { OptimizedInboxDashboard } from "@/components/InboxDashboard/OptimizedInboxDashboard";
import { AuthGuard } from "@/components/auth/auth-guard";

export default React.memo(function InboxPage(): React.ReactElement {
  // State for connecting InboxDashboard
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [showShortcuts, setShowShortcuts] = React.useState(false);
  const handleNotifications = () => {};

  React.useEffect(() => {
    // Dev-only UX guards scoped to the inbox root without mutating Location API
    if (process.env.NODE_ENV !== "development") return;
    const submitInterceptor = (e: Event) => {
      const root = document.getElementById("inbox-root");
      if (root && (e.target as HTMLElement) && root.contains(e.target as Node)) {
        // avoid accidental full-page form submits in dev
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const clickGuard = (e: MouseEvent) => {
      const root = document.getElementById("inbox-root");
      if (!root) return;
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (anchor && root.contains(anchor) && (!anchor.getAttribute("href") || anchor.getAttribute("href") === "#")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("submit", submitInterceptor, true);
    document.addEventListener("click", clickGuard, true);
    return () => {
      document.removeEventListener("submit", submitInterceptor, true);
      document.removeEventListener("click", clickGuard, true);
    };
  }, []);

  return (
    <AuthGuard>
      <div id="inbox-root" className="h-screen flex flex-col overflow-hidden">
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading inbox...</div>}>
          <OptimizedInboxDashboard
            className="h-full w-full"
          />
        </Suspense>
      </div>
    </AuthGuard>
  );
});
