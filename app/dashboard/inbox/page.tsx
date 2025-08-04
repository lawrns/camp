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
import InboxDashboard from "@/components/InboxDashboard/index";
import { AuthGuard } from "@/components/auth/auth-guard";
import { InboxHeader } from "@/components/inbox/InboxHeader";

interface InboxPageProps {}

export default React.memo(function InboxPage(): JSX.Element {
  // State for connecting InboxHeader to InboxDashboard
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showShortcuts, setShowShortcuts] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilter = () => {
    setShowAdvancedFilters(true);
  };

  const handleNotifications = () => {
    setShowNotifications(true);
  };

  const handleShortcuts = () => {
    setShowShortcuts(true);
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

  return (
    <AuthGuard>
      <div className="h-screen flex flex-col bg-gradient-to-br from-neutral-50 via-white to-blue-50">
        {/* Consolidated Header Section */}
        <InboxHeader
          onSearch={handleSearch}
          onFilter={handleFilter}
          onNotifications={handleNotifications}
          onShortcuts={handleShortcuts}
          onSettings={handleSettings}
        />

        {/* Inbox Dashboard Component */}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<div className="flex items-center justify-center h-full">Loading inbox...</div>}>
            <InboxDashboard
              className="h-full w-full"
              initialSearchQuery={searchQuery}
              showAdvancedFilters={showAdvancedFilters}
              setShowAdvancedFilters={setShowAdvancedFilters}
              showShortcuts={showShortcuts}
              setShowShortcuts={setShowShortcuts}
            />
          </Suspense>
        </div>
      </div>
    </AuthGuard>
  );
});
