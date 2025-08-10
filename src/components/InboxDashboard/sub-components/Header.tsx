// Header component for inbox dashboard

import { Icon, Icons } from '@/lib/icons/standardized-icons';
import * as React from "react";
import { useState } from "react";
import type { HeaderProps } from "../types";
import { StatusDropdown } from '@/components/dashboard/StatusDropdown';


/**
 * Header component with search, filters, and shortcuts
 */
export const Header: React.FC<HeaderProps> = ({
  conversations,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  setShowShortcuts,
  searchInputRef,
  performanceMetrics,
  connectionStatus,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex-shrink-0 border-b border-[var(--fl-color-border)] bg-background component-padding" data-testid="inbox-header">
      {/* Mobile menu button */}
      <div className="flex items-center justify-between lg:hidden mb-4" data-testid="mobile-header">
        <h1 className="component-header text-gray-900 truncate mr-4" data-testid="mobile-inbox-title">Inbox ({conversations.length})</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-menu-toggle inline-flex items-center justify-center rounded-ds-lg border border-[var(--fl-color-border-strong)] bg-background spacing-3 text-foreground hover:bg-background active:bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/20 btn-height-lg transition-all duration-200 ease-in-out"
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
          data-testid="mobile-menu-button"
        >
          <div className={`transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
            {isMobileMenuOpen ? <Icon icon={Icons.close} className="h-6 w-6" /> : <Icon icon={Icons.menu} className="h-6 w-6" />}
          </div>
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu fixed inset-0 z-50 lg:hidden" data-testid="mobile-menu">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          />

          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-background shadow-xl transform transition-transform duration-300 ease-in-out animate-slide-in-right">
            <div className="flex items-center justify-between border-b border-[var(--fl-color-border)] p-spacing-md bg-background">
              <h2 className="text-base font-semibold text-gray-900">Filters & Search</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-ds-lg p-spacing-sm text-gray-400 hover:bg-background hover:text-foreground-muted active:bg-gray-200 btn-height-lg transition-colors duration-200"
                aria-label="Close menu"
              >
                <Icon icon={Icons.close} className="h-6 w-6" />
              </button>
            </div>
            <div className="p-spacing-md space-y-6 overflow-y-auto h-full pb-20" data-testid="mobile-menu-content">
              {/* Mobile search */}
              <div className="space-y-spacing-sm" data-testid="mobile-search-section">
                <label className="block text-sm font-medium text-foreground" data-testid="mobile-search-label">Search Conversations</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Icon icon={Icons.search} className="h-5 w-5 text-gray-400" data-testid="mobile-search-icon" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full rounded-ds-lg border border-[var(--fl-color-border-strong)] bg-background py-4 pl-10 pr-3 text-base placeholder-gray-500 focus:border-[var(--fl-color-brand)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 input-height-lg transition-colors duration-200"
                    data-testid="mobile-search-input"
                  />
                </div>
              </div>

              {/* Mobile filters */}
              <div className="space-y-spacing-sm" data-testid="mobile-status-filter-section">
                <label className="block text-sm font-medium text-foreground" data-testid="mobile-status-filter-label">Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full rounded-ds-lg border border-[var(--fl-color-border-strong)] bg-background px-4 py-4 text-base focus:border-[var(--fl-color-brand)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 input-height-lg transition-colors duration-200"
                  data-testid="mobile-status-filter"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>

              <div className="space-y-spacing-sm" data-testid="mobile-priority-filter-section">
                <label className="block text-sm font-medium text-foreground" data-testid="mobile-priority-filter-label">Priority Filter</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="block w-full rounded-ds-lg border border-[var(--fl-color-border-strong)] bg-background px-4 py-4 text-base focus:border-[var(--fl-color-brand)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[48px] transition-colors duration-200"
                  data-testid="mobile-priority-filter"
                >
                  <option value="">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Mobile shortcuts button */}
              <div className="pt-4 border-t border-[var(--fl-color-border)]" data-testid="mobile-shortcuts-section">
                <button
                  onClick={() => {
                    setShowShortcuts(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center rounded-ds-lg border border-[var(--fl-color-border-strong)] bg-background px-4 py-4 text-base font-medium text-foreground transition-all hover:bg-background active:bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[48px]"
                  data-testid="mobile-shortcuts-button"
                >
                  <Icon icon={Icons.settings} className="mr-3 h-5 w-5" data-testid="mobile-shortcuts-icon" />
                  Keyboard Shortcuts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop layout */}
      <div className="hidden lg:flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="component-header text-gray-900">Inbox ({conversations.length})</h1>

          {/* Performance Indicator */}
          {performanceMetrics && (
            <div className="flex items-center space-x-2 text-sm">
              <div
                className={`flex items-center space-x-1 rounded-ds-full px-2 py-1 ${connectionStatus === "connected"
                  ? "bg-green-100 text-green-700"
                  : connectionStatus === "connecting"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                  }`}
              >
                <div
                  className={`h-2 w-2 rounded-ds-full ${connectionStatus === "connected"
                    ? "bg-green-500"
                    : connectionStatus === "connecting"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                    }`}
                />
                <span className="text-xs font-medium">
                  {connectionStatus === "connected"
                    ? "Connected"
                    : connectionStatus === "connecting"
                      ? "Connecting"
                      : "Disconnected"}
                </span>
              </div>
              {connectionStatus === "connected" && (
                <div className="text-gray-600">
                  <span className="text-xs font-medium">{performanceMetrics.averageLatency.toFixed(1)}ms</span>
                </div>
              )}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Icon icon={Icons.search} className="h-4 w-4 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-64 rounded-ds-lg border border-[var(--fl-color-border-strong)] bg-background py-3 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-[var(--fl-color-brand)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 input-height-md"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Agent Presence Status Dropdown for E2E */}
          <StatusDropdown
            currentStatus="online"
            onStatusChange={(status) => {
              // Stored in localStorage by StatusDropdown for widget to pick up
              console.log('[Inbox Header] Agent status now:', status);
            }}
          />

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-ds-lg border border-[var(--fl-color-border-strong)] bg-background px-3 py-3 pr-8 text-sm focus:border-[var(--fl-color-brand)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 input-height-md"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
              <Icon icon={Icons.chevronDown} className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="appearance-none rounded-ds-lg border border-[var(--fl-color-border-strong)] bg-background px-3 py-3 pr-8 text-sm focus:border-[var(--fl-color-brand)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 input-height-md"
            >
              <option value="">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
              <Icon icon={Icons.chevronDown} className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Shortcuts Button */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="inline-flex items-center rounded-ds-lg border border-[var(--fl-color-border-strong)] bg-background px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[44px]"
            aria-label="Show keyboard shortcuts"
          >
            <Icon icon={Icons.settings} className="mr-2 h-5 w-5" />
            Shortcuts
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
