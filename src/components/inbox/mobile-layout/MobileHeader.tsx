/**
 * MobileHeader Component
 *
 * Mobile-optimized header with search, filters, navigation controls,
 * and pull-to-refresh functionality.
 */

"use client";

import React, { useCallback, useState } from "react";
// Mobile header styles now handled by design-system.css
import { Button } from "@/components/ui/Button-unified";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Checkbox } from "@/components/unified-ui/components/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/unified-ui/components/drawer";
import { Input } from "@/components/unified-ui/components/input";
import { OptimizedAnimatePresence, OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Funnel as Filter,
  Plus,
  ArrowClockwise as RefreshCw,
  MagnifyingGlass as Search
} from "@phosphor-icons/react";
import { ActivePanel, MobileHeaderState } from "./types";

interface MobileHeaderProps {
  // Navigation
  activePanel: ActivePanel;
  onNavigateBack?: () => void;
  canNavigateBack: boolean;

  // Title and metadata
  title: string;
  unreadCount?: number;

  // Search and filters
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: string[]) => void;
  availableFilters?: Array<{ value: string; label: string; count?: number }>;

  // Actions
  onRefresh?: () => void;
  onNewConversation?: () => void;
  isRefreshing?: boolean;

  // Customization
  showSearch?: boolean;
  showFilters?: boolean;
  showActions?: boolean;
  className?: string;
}

const DEFAULT_FILTERS = [
  { value: "unread", label: "Unread", count: 12 },
  { value: "urgent", label: "Urgent", count: 3 },
  { value: "assigned", label: "Assigned to me", count: 8 },
  { value: "escalated", label: "Escalated", count: 2 },
  { value: "pending", label: "Pending", count: 15 },
];

export function MobileHeader({
  activePanel,
  onNavigateBack,
  canNavigateBack,
  title,
  unreadCount = 0,
  onSearch,
  onFilterChange,
  availableFilters = DEFAULT_FILTERS,
  onRefresh,
  onNewConversation,
  isRefreshing = false,
  showSearch = true,
  showFilters = true,
  showActions = true,
  className,
}: MobileHeaderProps) {
  const [headerState, setHeaderState] = useState<MobileHeaderState>({
    isSearchOpen: false,
    isFilterOpen: false,
    searchQuery: "",
    activeFilters: [],
    isRefreshing: false,
    showNewConversationHint: true,
  });

  // Handle search functionality
  const handleSearchToggle = useCallback(() => {
    setHeaderState((prev) => ({
      ...prev,
      isSearchOpen: !prev.isSearchOpen,
      searchQuery: prev.isSearchOpen ? "" : prev.searchQuery,
    }));
  }, []);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch?.(headerState.searchQuery);
    },
    [headerState.searchQuery, onSearch]
  );

  const handleSearchChange = useCallback((value: string) => {
    setHeaderState((prev) => ({ ...prev, searchQuery: value }));
  }, []);

  // Handle filter functionality
  const handleFilterToggle = useCallback(() => {
    setHeaderState((prev) => ({ ...prev, isFilterOpen: !prev.isFilterOpen }));
  }, []);

  const handleFilterChange = useCallback(
    (filterValue: string, checked: boolean) => {
      setHeaderState((prev) => {
        const newFilters = checked
          ? [...prev.activeFilters, filterValue]
          : prev.activeFilters.filter((f) => f !== filterValue);

        onFilterChange?.(newFilters);
        return { ...prev, activeFilters: newFilters };
      });
    },
    [onFilterChange]
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setHeaderState((prev) => ({ ...prev, isRefreshing: true }));
    await onRefresh?.();

    // Add haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate([10, 5, 10]);
    }

    setTimeout(() => {
      setHeaderState((prev) => ({ ...prev, isRefreshing: false }));
    }, 1000);
  }, [isRefreshing, onRefresh]);

  // Handle new conversation
  const handleNewConversation = useCallback(() => {
    onNewConversation?.();
    setHeaderState((prev) => ({ ...prev, showNewConversationHint: false }));
  }, [onNewConversation]);



  return (
    <>
      <header className={cn("mobile-header", className)}>
        {/* Main header bar */}
        <div className="mobile-header-content">
          {/* Left section - Back button or panel icon */}
          <div className="mobile-header-left">
            {canNavigateBack && (
              <button onClick={onNavigateBack} className="mobile-header-button back-button">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

          </div>

          {/* Center section - Title with unread count */}
          <div className="mobile-header-center">
            <span className="mobile-header-title">{title}</span>
            {unreadCount > 0 && (
              <Badge variant="error" className="h-5 min-w-[1.25rem] text-tiny">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </div>

          {/* Right section - Action buttons */}
          {showActions && (
            <div className="mobile-header-right">
              {/* Search button */}
              {showSearch && (
                <button
                  onClick={handleSearchToggle}
                  className={cn("mobile-header-button", headerState.isSearchOpen && "bg-status-info-light text-blue-600")}
                >
                  <Search className="h-5 w-5" />
                </button>
              )}

              {/* Filter button */}
              {showFilters && (
                <button
                  onClick={handleFilterToggle}
                  className={cn("mobile-header-button", headerState.isFilterOpen && "bg-status-info-light text-blue-600")}
                >
                  <Filter className="h-5 w-5" />
                  {headerState.activeFilters.length > 0 && (
                    <Badge variant="error" className="absolute -right-1 -top-1 h-4 min-w-[1rem] text-tiny">
                      {headerState.activeFilters.length}
                    </Badge>
                  )}
                </button>
              )}

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || headerState.isRefreshing}
                className="mobile-header-button"
              >
                <RefreshCw className={cn("h-5 w-5", (isRefreshing || headerState.isRefreshing) && "animate-spin")} />
              </button>

              {/* New conversation button (only on list panel) */}
              {activePanel === "list" && (
                <button onClick={handleNewConversation} className="mobile-header-button">
                  <Plus className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search bar (collapsible) */}
        <OptimizedAnimatePresence>
          {headerState.isSearchOpen && (
            <OptimizedMotion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-[var(--fl-color-border-subtle)]"
            >
              <form onSubmit={handleSearchSubmit} className="spacing-3">
                <Input
                  type="search"
                  placeholder="Search conversations..."
                  value={headerState.searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </form>
            </OptimizedMotion.div>
          )}
        </OptimizedAnimatePresence>
      </header>

      {/* Filter drawer */}
      <Drawer open={headerState.isFilterOpen} onOpenChange={handleFilterToggle}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Filter Conversations</DrawerTitle>
            <DrawerDescription>Select filters to narrow down your conversation list</DrawerDescription>
          </DrawerHeader>

          <div className="space-y-3 spacing-3">
            {availableFilters.map((filter) => (
              <div key={filter.value} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={filter.value}
                    checked={headerState.activeFilters.includes(filter.value)}
                    onCheckedChange={(checked) => handleFilterChange(filter.value, checked as boolean)}
                  />
                  <label htmlFor={filter.value} className="text-sm font-medium">
                    {filter.label}
                  </label>
                </div>
                {filter.count !== undefined && (
                  <Badge variant="secondary" className="text-tiny">
                    {filter.count}
                  </Badge>
                )}
              </div>
            ))}

            {headerState.activeFilters.length > 0 && (
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setHeaderState((prev) => ({ ...prev, activeFilters: [] }));
                    onFilterChange?.([]);
                  }}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
