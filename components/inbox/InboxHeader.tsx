"use client";

import React from "react";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import {
  Archive,
  CaretRight as ChevronRight,
  Clock,
  Command,
  Funnel as Filter,
  GridFour as Grid3x3,
  Tray as Inbox,
  List,
  List as Menu,
  DotsThreeVertical as MoreVertical,
  MagnifyingGlass as Search,
  PaperPlaneTilt as Send,
  Gear as Settings,
  Users,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Separator } from "@/components/unified-ui/components/Separator";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface InboxHeaderProps {
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
  onToggleCommandBar: () => void;
  onToggleDetailsSidebar: () => void;
  onToggleMobileMenu?: () => void;
  showDetailsSidebar: boolean;
  filterCount?: number;
  className?: string;
}

const inboxFilters = [
  { id: "all", label: "All", icon: Inbox, count: 24 },
  { id: "unread", label: "Unread", icon: Clock, count: 8 },
  { id: "assigned", label: "Assigned to me", icon: Users, count: 5 },
  { id: "unassigned", label: "Unassigned", icon: Send, count: 3 },
  { id: "archived", label: "Archived", icon: Archive, count: 0 },
];

export function InboxHeader({
  viewMode,
  onViewModeChange,
  onToggleCommandBar,
  onToggleDetailsSidebar,
  onToggleMobileMenu,
  showDetailsSidebar,
  filterCount = 0,
  className,
}: InboxHeaderProps) {
  const [activeFilter, setActiveFilter] = React.useState("all");
  const [showFilterMenu, setShowFilterMenu] = React.useState(false);

  return (
    <header className={cn("sticky top-0 z-40 h-16 border-b bg-white/80 backdrop-blur-sm", className)}>
      <div className="flex h-full items-center justify-between px-4">
        {/* Left Section */}
        <div className="flex flex-1 items-center gap-3">
          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={onToggleMobileMenu}>
            <Icon icon={Menu} className="h-5 w-5" />
          </Button>

          {/* Breadcrumbs */}
          <nav className="hidden items-center gap-ds-2 text-sm sm:flex">
            <OptimizedMotion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </OptimizedMotion.span>
            <Icon icon={ChevronRight} className="h-4 w-4 text-muted-foreground" />
            <OptimizedMotion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="font-medium"
            >
              Inbox
            </OptimizedMotion.span>
          </nav>

          <Separator orientation="vertical" className="hidden h-6 sm:block" />

          {/* Quick Filters */}
          <div className="hidden items-center gap-1 md:flex">
            {inboxFilters.map((filter: any) => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;

              return (
                <OptimizedMotion.button
                  key={filter.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    "text-typography-sm inline-flex items-center gap-2 rounded-ds-md px-3 py-1.5 font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{filter.label}</span>
                  {filter.count > 0 && (
                    <Badge variant={isActive ? "secondary" : "outline"} className="ml-1 h-5 px-1.5 text-tiny">
                      {filter.count}
                    </Badge>
                  )}
                </OptimizedMotion.button>
              );
            })}
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="mx-4 flex items-center gap-ds-2">
          <OptimizedMotion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onToggleCommandBar}
            className="flex items-center gap-ds-2 rounded-ds-lg bg-muted/50 px-4 py-2 transition-colors hover:bg-muted"
          >
            <Icon icon={Search} className="h-4 w-4 text-muted-foreground" />
            <span className="hidden text-sm text-muted-foreground sm:inline">Search...</span>
            <kbd className="ml-8 hidden rounded border bg-background px-2 py-0.5 text-tiny shadow-card-base sm:inline">
              <Icon icon={Command} className="mr-0.5 inline h-3 w-3" />K
            </kbd>
          </OptimizedMotion.button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-ds-2">
          {/* View Mode Toggle */}
          <div className="hidden items-center rounded-ds-lg bg-muted spacing-1 sm:flex">
            <OptimizedMotion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewModeChange("list")}
              className={cn(
                "rounded-ds-md spacing-1.5 transition-all",
                viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
            >
              <Icon icon={List} className="h-4 w-4" />
            </OptimizedMotion.button>
            <OptimizedMotion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "rounded-ds-md spacing-1.5 transition-all",
                viewMode === "grid" ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
            >
              <Icon icon={Grid3x3} className="h-4 w-4" />
            </OptimizedMotion.button>
          </div>

          {/* Filter Button */}
          <div className="relative">
            <Button variant="ghost" size="sm" onClick={() => setShowFilterMenu(!showFilterMenu)} className="relative">
              <Icon icon={Filter} className="h-4 w-4" />
              {filterCount > 0 && (
                <Badge
                  variant="error"
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-tiny"
                >
                  {filterCount}
                </Badge>
              )}
            </Button>

            {/* Filter Dropdown */}
            {showFilterMenu && (
              <OptimizedMotion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background absolute right-0 mt-2 w-64 rounded-ds-lg border shadow-card-deep"
              >
                <div className="spacing-3">
                  <h3 className="mb-3 font-medium">Filters</h3>
                  <div className="space-y-spacing-sm">
                    <label className="flex items-center gap-ds-2 text-sm">
                      <input type="checkbox" className="rounded" />
                      <span>Unread only</span>
                    </label>
                    <label className="flex items-center gap-ds-2 text-sm">
                      <input type="checkbox" className="rounded" />
                      <span>High priority</span>
                    </label>
                    <label className="flex items-center gap-ds-2 text-sm">
                      <input type="checkbox" className="rounded" />
                      <span>Has attachments</span>
                    </label>
                  </div>
                </div>
              </OptimizedMotion.div>
            )}
          </div>

          {/* Details Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDetailsSidebar}
            className={cn("transition-colors", showDetailsSidebar && "bg-muted")}
          >
            <Icon icon={Settings} className="h-4 w-4" />
          </Button>

          {/* More Options */}
          <Button variant="ghost" size="sm">
            <Icon icon={MoreVertical} className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
