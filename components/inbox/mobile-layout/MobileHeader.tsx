/**
 * MobileHeader Component
 *
 * Mobile-optimized header with search, filters, navigation controls,
 * and pull-to-refresh functionality.
 */

"use client";

import React, { useCallback, useState } from "react";
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
import { ArrowLeft, Funnel as Filter, Plus, ArrowClockwise as RefreshCw, Search as Search } from "lucide-react";
import { MobileHeaderProps } from "./types";

const DEFAULT_FILTERS = [
  { value: "unread", label: "Unread", count: 12 },
  { value: "urgent", label: "Urgent", count: 3 },
  { value: "assigned", label: "Assigned to me", count: 8 },
  { value: "escalated", label: "Escalated", count: 2 },
  { value: "pending", label: "Pending", count: 15 },
];

interface MobileHeaderState {
  isSearchOpen: boolean;
  isFilterOpen: boolean;
  searchQuery: string;
  activeFilters: string[];
  isRefreshing: boolean;
  showNewConversationHint: boolean;
}

export function MobileHeader({
  activePanel,
  onNavigateBack,
  canNavigateBack,
  title,
  unreadCount = 0,
  onSearch,
  onFilterChange,
  onRefresh,
  onNewConversation,
  showSearch = true,
  showFilters = true,
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

  const handleSearchChange = useCallback((query: string) => {
    setHeaderState((prev) => ({ ...prev, searchQuery: query }));
    onSearch?.(query);
  }, [onSearch]);

  // Handle filter functionality
  const handleFilterToggle = useCallback(() => {
    setHeaderState((prev) => ({ ...prev, isFilterOpen: !prev.isFilterOpen }));
  }, []);

  const handleFilterChange = useCallback((filter: string, checked: boolean) => {
    setHeaderState((prev) => {
      const newFilters = checked
        ? [...prev.activeFilters, filter]
        : prev.activeFilters.filter((f) => f !== filter);
      return { ...prev, activeFilters: newFilters };
    });
    onFilterChange?.(headerState.activeFilters);
  }, [headerState.activeFilters, onFilterChange]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setHeaderState((prev) => ({ ...prev, isRefreshing: true }));
    try {
      await onRefresh?.();
    } finally {
      setHeaderState((prev) => ({ ...prev, isRefreshing: false }));
    }
  }, [onRefresh]);

  return (
    <div className={cn("flex-shrink-0 border-b bg-background", className)}>
      {/* Main header */}
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left side - Back button and title */}
        <div className="flex items-center gap-3">
          {canNavigateBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateBack}
              className="h-8 w-8 p-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-foreground">{title}</h1>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-[var(--fl-spacing-2)]">
          {showSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSearchToggle}
              className="h-8 w-8 p-0"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {showFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFilterToggle}
              className="h-8 w-8 p-0"
              aria-label="Filter"
            >
              <Filter className="h-4 w-4" />
              {headerState.activeFilters.length > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs rounded-full"
                >
                  {headerState.activeFilters.length}
                </Badge>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={headerState.isRefreshing}
            className="h-8 w-8 p-0"
            aria-label="Refresh"
          >
            <OptimizedMotion.div
              animate={{ rotate: headerState.isRefreshing ? 360 : 0 }}
              transition={{ duration: 1, repeat: headerState.isRefreshing ? Infinity : 0 }}
            >
              <RefreshCw className="h-4 w-4" />
            </OptimizedMotion.div>
          </Button>

          {onNewConversation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewConversation}
              className="h-8 w-8 p-0"
              aria-label="New conversation"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search bar */}
      <OptimizedAnimatePresence>
        {headerState.isSearchOpen && (
          <OptimizedMotion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t"
          >
            <div className="p-4">
              <Input
                placeholder="Search conversations..."
                value={headerState.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-9"
                autoFocus
              />
            </div>
          </OptimizedMotion.div>
        )}
      </OptimizedAnimatePresence>

      {/* Filter drawer */}
      <Drawer open={headerState.isFilterOpen} onOpenChange={handleFilterToggle}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Filter Conversations</DrawerTitle>
            <DrawerDescription>
              Select filters to narrow down your conversations
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            {DEFAULT_FILTERS.map((filter) => (
              <div key={filter.value} className="flex items-center space-x-2">
                <Checkbox
                  id={filter.value}
                  checked={headerState.activeFilters.includes(filter.value)}
                  onCheckedChange={(checked) =>
                    handleFilterChange(filter.value, checked as boolean)
                  }
                />
                <label
                  htmlFor={filter.value}
                  className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {filter.label}
                </label>
                {filter.count && (
                  <Badge variant="secondary" className="text-xs rounded-full">
                    {filter.count}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
