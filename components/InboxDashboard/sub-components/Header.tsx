// Header component for inbox dashboard

import { useAuth } from "@/hooks/useAuth";
import { Bell, Funnel, MagnifyingGlass, List, Plus, SortAscending, SortDescending, X } from "@phosphor-icons/react";
import * as React from "react";
import { useRef, useState, memo } from "react";
import { Icon } from "@/lib/ui/Icon";
import type { Conversation } from "../types";
import { STATUS_FILTER_OPTIONS, PRIORITY_FILTER_OPTIONS, CONVERSATION_SORT_OPTIONS } from "@/lib/constants/filter-options";
import { typography, components, padding, colors } from "@/lib/design-system/tokens";

interface HeaderProps {
  conversations: Conversation[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  priorityFilter: string;
  setPriorityFilter: (filter: string) => void;
  setShowShortcuts: (show: boolean) => void;
  setShowAdvancedFilters?: (show: boolean) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  performanceMetrics?: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  connectionStatus: "error" | "connecting" | "connected" | "disconnected";
}

/**
 * Header component with search, filters, and actions - memoized for performance
 */
export const Header: React.FC<HeaderProps> = memo(({
  conversations,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  setShowShortcuts,
  setShowAdvancedFilters,
  searchInputRef,
  performanceMetrics,
  connectionStatus,
}) => {
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Use enum-based filter options for consistency and type safety
  const statusOptions = STATUS_FILTER_OPTIONS.filter(option => option.value !== "");
  const priorityOptions = PRIORITY_FILTER_OPTIONS.filter(option => option.value !== "");

  // Handle search with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setPriorityFilter("");
  };

  // Get filter count
  const activeFilters = [searchQuery, statusFilter, priorityFilter].filter(Boolean).length;

  return (
    <div className={`${colors["surface-primary"]} ${colors["border-primary"]} border-b flex-shrink-0`} data-testid="inbox-header">
      {/* Desktop Header */}
      <div className={`hidden lg:flex items-center justify-between ${padding.header} ${colors["surface-primary"]}`}>
        {/* Left side - Search and filters */}
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlass className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={handleSearchChange}
              className={`${components["input-default"]} ${typography["body-sm"]} w-full pl-10 pr-4 py-2 transition-all duration-200 ease-in-out rounded-lg`}
              aria-label="Search conversations"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-ds-lg border text-sm font-medium transition-colors ${
                showFilters || activeFilters > 0
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-background border-[var(--fl-color-border-strong)] text-foreground hover:bg-background"
              }`}
            >
              <Funnel className="h-4 w-4" />
              Filters
              {activeFilters > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {activeFilters}
                </span>
              )}
            </button>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-ds-lg border border-[var(--fl-color-border-strong)] bg-background text-foreground hover:bg-background active:bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/20 btn-height-lg transition-all duration-200 ease-in-out"
            >
              {sortOrder === "asc" ? (
                <SortAscending className="h-4 w-4" />
              ) : (
                <SortDescending className="h-4 w-4" />
              )}
              Sort
            </button>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {/* Performance indicator */}
          {performanceMetrics && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full ${
                performanceMetrics.responseTime < 100 ? "bg-green-400" :
                performanceMetrics.responseTime < 300 ? "bg-yellow-400" : "bg-red-400"
              }`} />
              <span>{performanceMetrics.responseTime}ms</span>
            </div>
          )}

          {/* Connection status */}
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === "connected" ? "bg-green-400" :
              connectionStatus === "connecting" ? "bg-yellow-400" : "bg-red-400"
            }`} />
            <span className="capitalize">{connectionStatus}</span>
          </div>

          {/* Notifications */}
          <button
            className="relative p-2 text-gray-400 hover:text-foreground transition-colors"
            aria-label="View notifications"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
          </button>

          {/* Advanced Filters */}
          {setShowAdvancedFilters && (
            <button
              onClick={() => setShowAdvancedFilters(true)}
              className="p-2 text-gray-400 hover:text-foreground transition-colors"
              aria-label="Open advanced filters"
              title="Advanced filters"
            >
              <Funnel className="h-5 w-5" />
            </button>
          )}

          {/* Shortcuts */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2 text-gray-400 hover:text-foreground transition-colors"
            aria-label="View keyboard shortcuts"
            title="Keyboard shortcuts"
          >
            <Icon icon={List} className="h-5 w-5" />
          </button>

          {/* New conversation */}
          <button className="btn-primary mobile-friendly-button touch-target" aria-label="Start new conversation">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Conversation</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between border-b border-[var(--fl-color-border)] p-4 bg-background">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 text-gray-400 hover:text-foreground transition-colors"
          >
            <List className="h-6 w-6" />
          </button>
          <h1 className="typography-dashboard-title">Inbox</h1>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-foreground transition-colors touch-target" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </button>
          <button className="mobile-friendly-button inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-ds-lg hover:bg-blue-700 transition-colors touch-target" aria-label="Start new conversation">
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--fl-color-border)] p-4 bg-background">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="inline-flex items-center justify-center rounded-ds-lg p-2 text-gray-400 hover:bg-background hover:text-foreground-muted active:bg-gray-200 btn-height-lg transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto h-full pb-20" data-testid="mobile-menu-content">
              {/* Search Section */}
              <div className="space-y-2" data-testid="mobile-search-section">
                <h3 className="text-sm font-medium text-gray-900">Search</h3>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlass className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-ds-lg text-sm"
                  />
                </div>
              </div>

              {/* Status Filter Section */}
              <div className="space-y-2" data-testid="mobile-status-filter-section">
                <h3 className="text-sm font-medium text-gray-900">Status</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setStatusFilter("")}
                    className={`w-full text-left px-3 py-2 rounded-ds-lg text-sm transition-colors ${
                      statusFilter === "" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                    }`}
                  >
                    All Statuses
                  </button>
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStatusFilter(option.value)}
                      className={`w-full text-left px-3 py-2 rounded-ds-lg text-sm transition-colors ${
                        statusFilter === option.value ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Filter Section */}
              <div className="space-y-2" data-testid="mobile-priority-filter-section">
                <h3 className="text-sm font-medium text-gray-900">Priority</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setPriorityFilter("")}
                    className={`w-full text-left px-3 py-2 rounded-ds-lg text-sm transition-colors ${
                      priorityFilter === "" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                    }`}
                  >
                    All Priorities
                  </button>
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPriorityFilter(option.value)}
                      className={`w-full text-left px-3 py-2 rounded-ds-lg text-sm transition-colors ${
                        priorityFilter === option.value ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilters > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-ds-lg transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-ds-lg text-sm"
              >
                <option value="">All Statuses</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-ds-lg text-sm"
              >
                <option value="">All Priorities</option>
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              {activeFilters > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-ds-lg transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

Header.displayName = "Header";

export default Header;
